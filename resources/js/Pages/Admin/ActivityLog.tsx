import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    Undo2, Trash2, ArrowRight, Package, FolderTree, ShoppingCart,
    Users, Ticket, History, Search, X, RotateCcw, ExternalLink,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PaginatedData } from '@/types/models';
import { AdminSelect } from '@/Components/admin/AdminSelect';

// ── Types ─────────────────────────────────────────────────────────────────────

type LogAction = 'created' | 'updated' | 'deleted' | 'restored';

interface ChangeEntry {
    label: string;
    old: string;
    new: string;
}

interface ActivityLogItem {
    id: number;
    model_type: string;
    section: string;
    model_id: number;
    model_name: string | null;
    model_url: string | null;
    action: LogAction;
    changes: ChangeEntry[];
    changed_by: string | null;
    created_ago: string;
    created_at: string;
    created_time: string;
    day_key: string;
    day_label: string;
    revertable: boolean;
    reverted: boolean;
    reverted_by: string | null;
    reverted_ago: string | null;
    reverted_at: string | null;
}

interface Filters {
    model_type?: string;
    changed_by?: string;
    action?: string;
    status?: string;
    search?: string;
    period?: string;
    per_page?: string;
}

interface PageProps {
    logs: PaginatedData<ActivityLogItem>;
    users: Array<{ id: number; name: string }>;
    sectionLabels: Record<string, string>;
    perPageOptions: number[];
    filters: Filters;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTION_BADGE: Record<LogAction, string> = {
    created:  'bg-green-900/50 text-green-400',
    updated:  'bg-blue-900/50 text-blue-400',
    deleted:  'bg-red-900/50 text-red-400',
    restored: 'bg-amber-900/50 text-amber-400',
};

const ACTION_BORDER: Record<LogAction, string> = {
    created:  'border-l-green-500',
    updated:  'border-l-blue-500',
    deleted:  'border-l-red-500',
    restored: 'border-l-amber-500',
};

const SECTION_ICONS: Record<string, React.ElementType> = {
    Product:  Package,
    Category: FolderTree,
    Order:    ShoppingCart,
    User:     Users,
    Coupon:   Ticket,
};

const ACTION_OPTIONS = [
    { value: '', label: 'All actions' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'deleted', label: 'Deleted' },
    { value: 'restored', label: 'Restored' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'Any status' },
    { value: 'active', label: 'Not reverted' },
    { value: 'reverted', label: 'Reverted' },
];

const PERIOD_OPTIONS = [
    { value: '', label: 'Any time' },
    { value: 'hour', label: 'Last hour' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Past week' },
    { value: 'month', label: 'Past month' },
    { value: 'year', label: 'This year' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfirmButton({ onConfirm, children, title, className = '' }: {
    onConfirm: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
}) {
    const [confirming, setConfirming] = useState(false);

    if (confirming) {
        return (
            <span className="flex items-center gap-2 text-xs">
                <button
                    onClick={() => { onConfirm(); setConfirming(false); }}
                    className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded font-medium transition-colors"
                >
                    Confirm
                </button>
                <button onClick={() => setConfirming(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                    Cancel
                </button>
            </span>
        );
    }

    return (
        <button onClick={() => setConfirming(true)} title={title} className={className}>
            {children}
        </button>
    );
}

function LogCard({ log, onRevert, onDestroy }: {
    log: ActivityLogItem;
    onRevert: (id: number) => void;
    onDestroy: (id: number) => void;
}) {
    const Icon = SECTION_ICONS[log.model_type] ?? History;
    const borderColor = ACTION_BORDER[log.action] ?? 'border-l-gray-600';

    return (
        <div className={`bg-gray-800 border border-gray-700 border-l-2 ${borderColor} rounded-xl overflow-hidden hover:border-t-gray-600 hover:border-r-gray-600 hover:border-b-gray-600 transition-colors ${log.reverted ? 'opacity-55' : ''}`}>

            {/* Header */}
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Icon size={14} className="text-gray-500 flex-shrink-0" />
                        <span className="text-sm font-semibold text-white">{log.section}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ACTION_BADGE[log.action] ?? 'bg-gray-700 text-gray-300'}`}>
                            {log.action}
                        </span>
                        {log.reverted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700/70 text-gray-500 border border-gray-600">
                                reverted
                            </span>
                        )}
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-xs text-gray-300">{log.created_time}</div>
                        <div className="text-xs text-gray-500">{log.created_ago}</div>
                    </div>
                </div>

                {log.model_name && (
                    <div className="text-xs text-gray-400 mb-0.5">
                        {log.model_url ? (
                            <Link href={log.model_url} className="hover:text-purple-400 inline-flex items-center gap-0.5 transition-colors">
                                {log.model_name}
                                <ExternalLink size={10} className="ml-0.5" />
                            </Link>
                        ) : (
                            log.model_name
                        )}
                    </div>
                )}
                <div className="text-xs text-gray-600">by {log.changed_by ?? 'system'}</div>
            </div>

            {/* Field diffs */}
            {log.changes.length > 0 && (
                <div className="border-t border-gray-700/60 px-4 py-3 bg-gray-700/20 space-y-2">
                    {log.changes.slice(0, 4).map((c, i) => (
                        <div key={i} className="text-xs flex items-start gap-1.5 flex-wrap">
                            <span className="font-medium text-gray-300 whitespace-nowrap">{c.label}:</span>
                            <span className="text-gray-500 line-through break-all">{c.old}</span>
                            <ArrowRight size={10} className="text-gray-600 shrink-0 mt-0.5" />
                            <span className="text-gray-200 break-all">{c.new}</span>
                        </div>
                    ))}
                    {log.changes.length > 4 && (
                        <p className="text-xs text-gray-600">+{log.changes.length - 4} more fields</p>
                    )}
                </div>
            )}

            {/* Footer actions */}
            <div className="border-t border-gray-700/60 px-4 py-2.5 flex items-center justify-between">
                {log.reverted ? (
                    <span className="text-xs text-gray-600" title={log.reverted_at ?? undefined}>
                        Reverted{log.reverted_by ? ` by ${log.reverted_by}` : ''}
                        {log.reverted_ago ? ` · ${log.reverted_ago}` : ''}
                    </span>
                ) : log.revertable ? (
                    <ConfirmButton
                        onConfirm={() => onRevert(log.id)}
                        title="Revert this change"
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-400 transition-colors"
                    >
                        <Undo2 size={13} />
                        Revert
                    </ConfirmButton>
                ) : (
                    <span className="text-xs text-gray-600">audit only</span>
                )}

                <ConfirmButton
                    onConfirm={() => onDestroy(log.id)}
                    title="Remove log entry"
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                    <Trash2 size={13} />
                </ConfirmButton>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ActivityLog() {
    const { logs, users, sectionLabels, perPageOptions, filters } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => { setSearch(filters.search ?? ''); }, [filters.search]);

    useEffect(() => {
        const current = filters.search ?? '';
        if (search === current) return;
        const t = setTimeout(() => applyFilter('search', search), 350);
        return () => clearTimeout(t);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const hasFilters = Boolean(
        filters.model_type || filters.changed_by || filters.action ||
        filters.status || filters.search || filters.period,
    );

    function applyFilter(key: string, value: string) {
        router.get('/admin/activity-log', { ...filters, [key]: value || undefined, page: undefined }, {
            preserveState: true,
            replace: true,
        });
    }

    function resetFilters() {
        router.get('/admin/activity-log', {}, { preserveState: true, replace: true });
    }

    function revert(id: number) {
        router.post(`/admin/activity-log/${id}/revert`, {}, { preserveScroll: true });
    }

    function destroy(id: number) {
        router.delete(`/admin/activity-log/${id}`, { preserveScroll: true });
    }

    const groups = useMemo(() => {
        const out: { key: string; label: string; items: ActivityLogItem[] }[] = [];
        for (const log of logs.data) {
            const last = out[out.length - 1];
            if (last && last.key === log.day_key) last.items.push(log);
            else out.push({ key: log.day_key, label: log.day_label, items: [log] });
        }
        return out;
    }, [logs.data]);

    return (
        <AdminLayout>
            <Head title="Activity Log" />

            {/* Page header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/15 rounded-xl border border-purple-500/20">
                        <History className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Activity Log</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Every tracked change to products, categories, orders, users and coupons.{' '}
                            <span className="text-gray-200 font-medium">{logs.total}</span> matching entr{logs.total === 1 ? 'y' : 'ies'}.
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or ID…"
                        className="w-52 rounded-lg border border-gray-700 bg-gray-800 text-gray-200 text-sm pl-8 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <AdminSelect variant="filter"
                    className="w-44"
                    value={filters.model_type ?? ''}
                    onChange={(v) => applyFilter('model_type', v)}
                    options={[
                        { value: '', label: 'All sections' },
                        ...Object.entries(sectionLabels).map(([value, label]) => ({ value, label })),
                    ]}
                />
                <AdminSelect variant="filter"
                    className="w-40"
                    value={filters.action ?? ''}
                    onChange={(v) => applyFilter('action', v)}
                    options={ACTION_OPTIONS}
                />
                <AdminSelect variant="filter"
                    className="w-40"
                    value={filters.status ?? ''}
                    onChange={(v) => applyFilter('status', v)}
                    options={STATUS_OPTIONS}
                />
                <AdminSelect variant="filter"
                    className="w-44"
                    value={filters.changed_by ?? ''}
                    onChange={(v) => applyFilter('changed_by', v)}
                    options={[
                        { value: '', label: 'Anyone' },
                        ...users.map((u) => ({ value: String(u.id), label: u.name })),
                    ]}
                />
                <AdminSelect variant="filter"
                    className="w-40"
                    value={filters.period ?? ''}
                    onChange={(v) => applyFilter('period', v)}
                    options={PERIOD_OPTIONS}
                />
                {hasFilters && (
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <RotateCcw size={13} />
                        Reset
                    </button>
                )}
            </div>

            {/* Card groups */}
            {logs.data.length === 0 ? (
                <div className="py-20 text-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-xl">
                    No activity recorded for this filter.
                </div>
            ) : (
                <div className="space-y-8">
                    {groups.map((group) => (
                        <div key={group.key}>
                            {/* Day divider */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-gray-700/60" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                    {group.label}
                                </span>
                                <div className="h-px flex-1 bg-gray-700/60" />
                            </div>

                            {/* Cards */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                {group.items.map((log) => (
                                    <LogCard
                                        key={log.id}
                                        log={log}
                                        onRevert={revert}
                                        onDestroy={destroy}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer: per-page + pagination */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                    <span>Rows</span>
                    <AdminSelect variant="filter"
                        className="w-20"
                        value={String(filters.per_page ?? 20)}
                        onChange={(v) => applyFilter('per_page', v)}
                        options={perPageOptions.map((n) => ({ value: String(n), label: String(n) }))}
                    />
                    {logs.total > 0 && (
                        <span className="whitespace-nowrap text-xs">
                            Showing {logs.from}–{logs.to} of {logs.total}
                        </span>
                    )}
                </div>

                {logs.last_page > 1 && (
                    <div className="flex items-center gap-1">
                        {logs.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                                        link.active
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                                />
                            ) : (
                                <span
                                    key={i}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className="px-3 py-1.5 rounded-lg border text-xs bg-gray-800 border-gray-700 text-gray-600 cursor-default"
                                />
                            )
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
