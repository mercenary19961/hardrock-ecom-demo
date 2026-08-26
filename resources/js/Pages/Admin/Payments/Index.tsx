import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { CreditCard, Search, CheckCircle2, XCircle, Clock, AlertTriangle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { AdminSelect } from '@/Components/admin/AdminSelect';

interface Order {
    id: number;
    order_number: string;
    total: string;
    payment_method: string;
    payment_status: string;
    customer_name: string;
}

interface Payment {
    id: number;
    order_id: number;
    order: Order;
    provider: string;
    invoice_id: string | null;
    payment_id: string;
    status: 'initiated' | 'paid' | 'failed' | 'mismatch';
    amount: number;
    currency: string;
    source_type: string | null;
    source_company: string | null;
    failure_message: string | null;
    paid_at: string | null;
    created_at: string;
}

interface PaginatedPayments {
    data: Payment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Stats {
    total_paid: string;
    paid_count: number;
    failed_count: number;
    pending_count: number;
}

interface Filters {
    search?: string;
    status?: string;
    provider?: string;
    date_from?: string;
    date_to?: string;
}

interface Props {
    payments: PaginatedPayments;
    filters: Filters;
    stats: Stats;
}

const STATUS_CONFIG = {
    paid:      { label: 'Paid',      icon: CheckCircle2,  cls: 'text-green-400  bg-green-400/10  border-green-400/20',  accent: 'border-l-green-500'  },
    failed:    { label: 'Failed',    icon: XCircle,       cls: 'text-red-400    bg-red-400/10    border-red-400/20',    accent: 'border-l-red-500'    },
    initiated: { label: 'Initiated', icon: Clock,         cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', accent: 'border-l-yellow-500' },
    mismatch:  { label: 'Mismatch',  icon: AlertTriangle, cls: 'text-amber-400  bg-amber-400/10  border-amber-400/20',  accent: 'border-l-amber-500'  },
} as const;

function StatusBadge({ status }: { status: Payment['status'] }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.initiated;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
            <Icon size={11} />
            {cfg.label}
        </span>
    );
}

function ProviderBadge({ provider }: { provider: string }) {
    const colors: Record<string, string> = {
        moyasar: 'text-purple-300 bg-purple-400/10 border-purple-400/20',
        tamara:  'text-cyan-300   bg-cyan-400/10   border-cyan-400/20',
    };
    const cls = colors[provider.toLowerCase()] ?? 'text-gray-300 bg-gray-700 border-gray-600';
    return (
        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${cls}`}>
            {provider}
        </span>
    );
}

function formatAmount(halalas: number, currency: string): string {
    return `${(halalas / 100).toFixed(2)} ${currency}`;
}

function PaymentCard({ payment }: { payment: Payment }) {
    const cfg = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.initiated;

    return (
        <div className={`bg-gray-800 border border-l-2 ${cfg.accent} border-gray-700 rounded-xl p-4 flex flex-col gap-3 hover:border-t-gray-600 hover:border-r-gray-600 hover:border-b-gray-600 transition-colors`}>
            {/* Top row: order link + badges */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Link
                        href={`/admin/orders/${payment.order_id}`}
                        className="text-sm font-semibold text-white hover:text-purple-300 transition-colors inline-flex items-center gap-1 shrink-0"
                    >
                        {payment.order?.order_number ?? `#${payment.order_id}`}
                        <ExternalLink size={11} className="opacity-50" />
                    </Link>
                    <ProviderBadge provider={payment.provider} />
                </div>
                <StatusBadge status={payment.status} />
            </div>

            {/* Amount — prominent */}
            <p className="text-2xl font-bold text-white tabular-nums">
                {formatAmount(payment.amount, payment.currency)}
            </p>

            {/* Source info + customer */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {payment.source_type && (
                    <span className="capitalize">{payment.source_type}</span>
                )}
                {payment.source_company && (
                    <span className="capitalize text-gray-600">({payment.source_company})</span>
                )}
                {payment.order?.customer_name && (
                    <span className="text-gray-500">{payment.order.customer_name}</span>
                )}
            </div>

            {/* Failure message */}
            {payment.status === 'failed' && payment.failure_message && (
                <p className="text-xs text-red-400/80 bg-red-400/5 rounded-lg px-2 py-1.5 border border-red-400/10">
                    {payment.failure_message}
                </p>
            )}

            {/* Footer: date */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-700/60 text-xs text-gray-600">
                <span className="font-mono text-gray-700 truncate max-w-[160px]" title={payment.payment_id}>
                    {payment.payment_id ? payment.payment_id.slice(0, 20) + '…' : '—'}
                </span>
                <span>
                    {new Date(payment.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </span>
            </div>
        </div>
    );
}

export default function PaymentsIndex({ payments, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilters(extra: Partial<Filters> = {}) {
        router.get('/admin/payments', { ...filters, search, ...extra }, { preserveState: true, replace: true });
    }

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        applyFilters();
    }

    return (
        <AdminLayout>
            <Head title="Payments" />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/15 rounded-xl border border-purple-500/20">
                        <CreditCard className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Payments</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {payments.total.toLocaleString()} transaction{payments.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Revenue',   value: `${stats.total_paid} SAR`, sub: `${stats.paid_count} payments`,   icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20'  },
                    { label: 'Failed',          value: stats.failed_count,        sub: 'gateway failures',                icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20'    },
                    { label: 'Pending',         value: stats.pending_count,       sub: 'awaiting confirmation',           icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
                    { label: 'Gateways',        value: 'Moyasar + Tamara',        sub: 'active providers',                icon: CreditCard,   color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
                ].map(({ label, value, sub, icon: Icon, color, bg, border }) => (
                    <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${bg} border ${border} shrink-0`}>
                                <Icon size={16} className={color} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                                <p className="text-base font-semibold text-white truncate">{value}</p>
                                <p className="text-xs text-gray-600">{sub}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by order number or customer…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </form>
                    <AdminSelect
                        variant="filter" className="w-40"
                        value={filters.status ?? ''}
                        onChange={(v) => applyFilters({ status: v || undefined })}
                        options={[
                            { value: '',          label: 'All statuses' },
                            { value: 'paid',      label: 'Paid'         },
                            { value: 'failed',    label: 'Failed'       },
                            { value: 'initiated', label: 'Initiated'    },
                            { value: 'mismatch',  label: 'Mismatch'     },
                        ]}
                    />
                    <AdminSelect
                        variant="filter" className="w-36"
                        value={filters.provider ?? ''}
                        onChange={(v) => applyFilters({ provider: v || undefined })}
                        options={[
                            { value: '',        label: 'All providers' },
                            { value: 'moyasar', label: 'Moyasar'      },
                            { value: 'tamara',  label: 'Tamara'       },
                        ]}
                    />
                    <div className="flex gap-2">
                        <input type="date" value={filters.date_from ?? ''}
                            onChange={(e) => applyFilters({ date_from: e.target.value || undefined })}
                            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <input type="date" value={filters.date_to ?? ''}
                            onChange={(e) => applyFilters({ date_to: e.target.value || undefined })}
                            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                </div>
            </div>

            {/* Cards grid */}
            {payments.data.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-500 text-sm">
                    No payment transactions found.
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {payments.data.map((payment) => (
                        <PaymentCard key={payment.id} payment={payment} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {payments.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                    <span>Showing {payments.from}–{payments.to} of {payments.total}</span>
                    <div className="flex items-center gap-1">
                        {payments.links.map((link, i) => {
                            if (link.label === '&laquo; Previous') return (
                                <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url)}
                                    className="p-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                            );
                            if (link.label === 'Next &raquo;') return (
                                <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url)}
                                    className="p-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                    <ChevronRight size={16} />
                                </button>
                            );
                            return (
                                <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url)}
                                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium transition-colors ${link.active ? 'bg-purple-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}>
                                    {link.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
