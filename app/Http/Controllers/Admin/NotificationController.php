<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $notifications = $user->notifications()
            ->latest()
            ->take(30)
            ->get()
            ->map(fn ($n) => [
                'id'         => $n->id,
                'type'       => $n->data['type'] ?? 'general',
                'title'      => $n->data['title'] ?? '',
                'body'       => $n->data['body'] ?? '',
                'url'        => $n->data['url'] ?? null,
                'read'       => $n->read_at !== null,
                'created_at' => $n->created_at->diffForHumans(),
            ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $user->unreadNotifications()->count(),
        ]);
    }

    public function markRead(string $id): JsonResponse
    {
        Auth::user()->notifications()->find($id)?->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function markAllRead(): JsonResponse
    {
        Auth::user()->unreadNotifications->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function preferences(): Response
    {
        $user = Auth::user();

        return Inertia::render('Admin/Notifications/Preferences', [
            'preferences' => $user->resolvedNotificationPrefs(),
            'role'        => $user->role,
        ]);
    }

    public function updatePreferences(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $defaults = Permission::DEFAULT_NOTIFICATION_PREFS;

        $clean = [];
        foreach ($defaults as $channel => $events) {
            foreach (array_keys($events) as $event) {
                $clean[$channel][$event] = (bool) ($request->input("{$channel}.{$event}", false));
            }
        }

        $user->update(['notification_preferences' => $clean]);

        return back()->with('success', 'Notification preferences saved.');
    }
}
