import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    Undo2, Trash2, ArrowRight, Package, FolderTree, ShoppingCart,
    Users, Ticket, History, Search, X, RotateCcw, ExternalLink,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PaginatedData } from '@/types/models';
import { AdminSelect } from '@/Components/admin/AdminSelect';

// ── Types ────────────────────────────────────────────────────────────────────

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

const ACTION_STYLES: Record<LogAction, string> = {
    created:  'bg-green-900/50 text-green-400',
    updated:  'bg-blue-900/50 text-blue-400',
    deleted:  'bg-red-900/50 text-red-400',
    restored: 'bg-amber-900/50 text-amber-400',
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
            <span className="flex items-center gap-1.5 text-xs">
                <button onClick={() => { onConfirm(); setConfirming(false); }} className="text-red-400 hover:text-red-300 font-medium">
                    Confirm
                </button>
                <span className="text-gray-600">·</span>
                <button onClick={() => setConfirming(false)} className="text-gray-500 hover:text-gray-300">
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

            <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex-1 min-w-48">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <History className="h-5 w-5 text-purple-400" />
                        Activity Log
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Every tracked change to products, categories, orders, users and coupons.{' '}
                        <span className="text-gray-200 font-medium">{logs.total}</span> matching entr{logs.total === 1 ? 'y' : 'ies'}.
                    </p>
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
            <div className="flex flex-wrap items-center gap-2 mb-5">
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

            {/* Table */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                {logs.data.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 text-sm">
                        No activity recorded for this filter.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-700/50 border-b border-gray-700">
                            <tr>
                                <th className="text-start px-4 py-3 font-medium text-gray-400">Change</th>
                                <th className="text-start px-4 py-3 font-medium text-gray-400 hidden lg:table-cell">Details</th>
                                <th className="text-start px-4 py-3 font-medium text-gray-400 hidden sm:table-cell whitespace-nowrap">When</th>
                                <th className="text-end px-4 py-3 font-medium text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        {groups.map((group) => (
                            <tbody key={group.key} className="divide-y divide-gray-700/50">
                                {/* Day header */}
                                <tr className="bg-gray-700/30 border-t border-gray-700">
                                    <td colSpan={4} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        {group.label}
                                    </td>
                                </tr>

                                {group.items.map((log) => {
                                    const Icon = SECTION_ICONS[log.model_type] ?? History;
                                    return (
                                        <tr
                                            key={log.id}
                                            className={`hover:bg-gray-700/30 transition-colors align-top ${log.reverted ? 'opacity-50' : ''}`}
                                        >
                                            {/* Change summary */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-gray-500"><Icon size={14} /></span>
                                                    <span className="font-medium text-white">{log.section}</span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${ACTION_STYLES[log.action] ?? 'bg-gray-700 text-gray-300'}`}>
                                                        {log.action}
                                                    </span>
                                                </div>
                                                {log.model_name && (
                                                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                        {log.model_url ? (
                                                            <Link href={log.model_url} className="hover:text-purple-400 flex items-center gap-0.5 transition-colors">
                                                                {log.model_name}
                                                                <ExternalLink size={10} />
                                                            </Link>
                                                        ) : (
                                                            log.model_name
                                                        )}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500 mt-1">by {log.changed_by ?? 'system'}</div>
                                            </td>

                                            {/* Field diffs */}
                                            <td className="px-4 py-3 hidden lg:table-cell max-w-md">
                                                {log.changes.length === 0 ? (
                                                    <span className="text-xs text-gray-600">—</span>
                                                ) : (
                                                    <ul className="space-y-1">
                                                        {log.changes.slice(0, 4).map((c, i) => (
                                                            <li key={i} className="text-xs flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-medium text-gray-300">{c.label}:</span>
                                                                <span className="text-gray-500 line-through">{c.old}</span>
                                                                <ArrowRight size={10} className="text-gray-600 shrink-0" />
                                                                <span className="text-gray-200">{c.new}</span>
                                                            </li>
                                                        ))}
                                                        {log.changes.length > 4 && (
                                                            <li className="text-xs text-gray-500">+{log.changes.length - 4} more fields</li>
                                                        )}
                                                    </ul>
                                                )}
                                            </td>

                                            {/* When */}
                                            <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap" title={log.created_at}>
                                                <div className="text-gray-300">{log.created_time}</div>
                                                <div className="text-xs text-gray-500">{log.created_ago}</div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-3">
                                                    {log.reverted ? (
                                                        <span className="text-xs text-gray-600 whitespace-nowrap" title={log.reverted_at ?? undefined}>
                                                            Reverted{log.reverted_by ? ` by ${log.reverted_by}` : ''}
                                                            {log.reverted_ago ? ` · ${log.reverted_ago}` : ''}
                                                        </span>
                                                    ) : log.revertable ? (
                                                        <ConfirmButton
                                                            onConfirm={() => revert(log.id)}
                                                            title="Revert this change"
                                                            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-400 transition-colors"
                                                        >
                                                            <Undo2 size={14} />
                                                            Revert
                                                        </ConfirmButton>
                                                    ) : (
                                                        <span className="text-xs text-gray-600" title="This action can't be reverted">audit only</span>
                                                    )}
                                                    <ConfirmButton
                                                        onConfirm={() => destroy(log.id)}
                                                        title="Remove log entry"
                                                        className="text-gray-600 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </ConfirmButton>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        ))}
                    </table>
                )}
            </div>

            {/* Footer: per-page + pagination */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                    <span>Rows</span>
                    <AdminSelect variant="filter"
                        className="w-20"
                        value={String(filters.per_page ?? 20)}
                        onChange={(v) => applyFilter('per_page', v)}
                        options={perPageOptions.map((n) => ({ value: String(n), label: String(n) }))}
                    />
                    {logs.total > 0 && (
                        <span className="whitespace-nowrap">
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
