<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Product;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\UndoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    private const PER_PAGE = [10, 20, 50, 100];

    private const SECTION_LABELS = [
        'Product'  => 'Products',
        'Category' => 'Categories',
        'Order'    => 'Orders',
        'User'     => 'Users',
        'Coupon'   => 'Coupons',
    ];

    public function __construct(
        private ActivityLogService $activityLogService,
        private UndoService $undoService,
    ) {}

    public function index(Request $request): Response
    {
        $query = ActivityLog::query()->with(['user:id,name', 'revertedByUser:id,name']);

        if ($request->filled('model_type')) {
            $query->where('model_type', $request->model_type);
        }

        if ($request->filled('changed_by')) {
            $query->where('user_id', $request->changed_by);
        }

        if ($request->filled('action') && in_array($request->action, ['created', 'updated', 'deleted', 'restored'], true)) {
            $query->where('action', $request->action);
        }

        if ($request->input('status') === 'reverted') {
            $query->whereNotNull('reverted_at');
        } elseif ($request->input('status') === 'active') {
            $query->whereNull('reverted_at');
        }

        if ($request->filled('search')) {
            $term = '%' . str_replace(['%', '_'], ['\\%', '\\_'], (string) $request->search) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('model_name', 'like', $term)->orWhere('model_id', 'like', $term);
            });
        }

        if ($request->filled('period')) {
            $since = match ($request->period) {
                'hour'  => now()->subHour(),
                'today' => now()->startOfDay(),
                'week'  => now()->subWeek(),
                'month' => now()->subMonth(),
                'year'  => now()->startOfYear(),
                default => null,
            };
            if ($since) {
                $query->where('created_at', '>=', $since);
            }
        }

        $perPage = (int) $request->input('per_page', 20);
        if (! in_array($perPage, self::PER_PAGE, true)) {
            $perPage = 20;
        }

        $logs = $query->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (ActivityLog $log) => [
                'id'           => $log->id,
                'model_type'   => $log->model_type,
                'section'      => self::SECTION_LABELS[$log->model_type] ?? $log->model_type,
                'model_id'     => $log->model_id,
                'model_name'   => $log->model_name,
                'model_url'    => $log->getModelUrl(),
                'action'       => $log->action,
                'changes'      => $this->formatChanges($log->changes ?? []),
                'changed_by'   => $log->user?->name,
                'created_ago'  => $log->created_at->diffForHumans(),
                'created_at'   => $log->created_at->toDayDateTimeString(),
                'created_time' => $log->created_at->format('g:i A'),
                'day_key'      => $log->created_at->toDateString(),
                'day_label'    => $this->dayLabel($log->created_at),
                'revertable'   => $this->isRevertable($log),
                'reverted'     => $log->isReverted(),
                'reverted_by'  => $log->revertedByUser?->name,
                'reverted_ago' => $log->reverted_at?->diffForHumans(),
                'reverted_at'  => $log->reverted_at?->toDayDateTimeString(),
            ]);

        $userIds = ActivityLog::query()->pluck('user_id')->filter()->unique()->values();
        $users = User::query()->whereKey($userIds)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/ActivityLog', [
            'logs'           => $logs,
            'users'          => $users,
            'sectionLabels'  => self::SECTION_LABELS,
            'perPageOptions' => self::PER_PAGE,
            'filters'        => (object) $request->only(['model_type', 'changed_by', 'action', 'status', 'search', 'period', 'per_page']),
        ]);
    }

    public function revert(ActivityLog $activityLog): RedirectResponse
    {
        if ($activityLog->isReverted()) {
            return back()->with('error', 'This change has already been reverted.');
        }

        if (! $this->isRevertable($activityLog)) {
            return back()->with('error', "This change can't be reverted.");
        }

        $ok = match ($activityLog->model_type) {
            'Product' => $this->revertProduct($activityLog),
            default   => false,
        };

        if (! $ok) {
            return back()->with('error', "Could not revert — the record may no longer exist.");
        }

        $activityLog->update([
            'reverted_at' => now(),
            'reverted_by' => Auth::id(),
        ]);

        return back()->with('success', ($activityLog->model_name ?? 'Change') . ' reverted successfully.');
    }

    public function destroy(ActivityLog $activityLog): RedirectResponse
    {
        $activityLog->delete();

        return back()->with('success', 'Log entry removed.');
    }

    private function isRevertable(ActivityLog $log): bool
    {
        if ($log->isReverted()) {
            return false;
        }

        return match ($log->model_type) {
            'Product' => $log->action === 'updated' && ! empty($log->changes),
            default   => false,
        };
    }

    private function revertProduct(ActivityLog $log): bool
    {
        $product = Product::find($log->model_id);
        if (! $product) {
            return false;
        }

        $changes = $log->changes;
        if (empty($changes)) {
            return false;
        }

        $oldData = $product->toArray();
        $restoreData = [];

        foreach ($changes as $change) {
            $field = $change['field'];
            $type  = $change['type'] ?? 'text';

            if (($type === 'json' || $type === 'array') && array_key_exists('old_data', $change)) {
                $restoreData[$field] = is_array($change['old_data']) ? $change['old_data'] : [];
                continue;
            }

            $oldValue = $change['old'] ?? null;
            if ($oldValue === '(empty)' || $oldValue === '') {
                $oldValue = null;
            }

            if ($type === 'boolean') {
                $restoreData[$field] = $oldValue !== null ? filter_var($oldValue, FILTER_VALIDATE_BOOLEAN) : false;
            } elseif (in_array($field, ['price', 'compare_price'])) {
                $restoreData[$field] = $oldValue !== null ? (float) $oldValue : null;
            } elseif (in_array($field, ['stock', 'category_id', 'view_count', 'times_purchased', 'rating_count', 'low_stock_threshold'])) {
                $restoreData[$field] = $oldValue !== null ? (int) $oldValue : null;
            } else {
                $restoreData[$field] = $oldValue;
            }
        }

        $this->undoService->saveState($product, null, $restoreData);
        $product->update($restoreData);

        $restoredChanges = $this->undoService->getChanges($product, $oldData);
        $this->activityLogService->log($product, 'restored', $restoredChanges);

        return true;
    }

    private function formatChanges(array $changes): array
    {
        return array_map(fn ($c) => [
            'label' => $c['label'] ?? ucfirst(str_replace('_', ' ', $c['field'] ?? '')),
            'old'   => $c['old'] ?? '—',
            'new'   => $c['new'] ?? '—',
        ], $changes);
    }

    private function dayLabel(\Illuminate\Support\Carbon $date): string
    {
        return match (true) {
            $date->isToday()     => 'Today',
            $date->isYesterday() => 'Yesterday',
            default              => $date->format('l, M j, Y'),
        };
    }
}
