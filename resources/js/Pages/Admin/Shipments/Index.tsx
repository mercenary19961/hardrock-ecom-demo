import { Head, Link, router } from '@inertiajs/react';
import { Truck, Package, CheckCircle2, XCircle, Clock, ExternalLink, FileText, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { AdminSelect } from '@/Components/admin/AdminSelect';

interface Shipment {
    id: number;
    order_number: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    carrier: string | null;
    tracking_number: string | null;
    oto_id: number | null;
    shipping_label_url: string | null;
    shipping_provider: string | null;
    shipping_fee: string;
    total: string;
    customer_name: string;
    customer_email: string;
    payment_method: string;
    updated_at: string;
    created_at: string;
}

interface PaginatedShipments {
    data: Shipment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Stats {
    in_transit: number;
    delivered: number;
    cancelled: number;
    pending_fulfillment: number;
}

interface Filters {
    status?: string;
    carrier?: string;
    date_from?: string;
    date_to?: string;
}

interface Props {
    shipments: PaginatedShipments;
    filters: Filters;
    stats: Stats;
    carriers: string[];
}

const STATUS_CONFIG = {
    shipped:    { label: 'In Transit', icon: Truck,        cls: 'text-blue-400   bg-blue-400/10   border-blue-400/20',   accent: 'border-l-blue-500'   },
    delivered:  { label: 'Delivered',  icon: CheckCircle2, cls: 'text-green-400  bg-green-400/10  border-green-400/20',  accent: 'border-l-green-500'  },
    cancelled:  { label: 'Cancelled',  icon: XCircle,      cls: 'text-red-400    bg-red-400/10    border-red-400/20',    accent: 'border-l-red-500'    },
    processing: { label: 'Processing', icon: Clock,        cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', accent: 'border-l-yellow-500' },
    pending:    { label: 'Pending',    icon: Package,      cls: 'text-gray-400   bg-gray-700      border-gray-600',      accent: 'border-l-gray-600'   },
} as const;

function StatusBadge({ status }: { status: Shipment['status'] }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
            <Icon size={11} />
            {cfg.label}
        </span>
    );
}

function TrackingLink({ carrier, trackingNumber }: { carrier: string | null; trackingNumber: string }) {
    const urls: Record<string, string> = {
        dhl:    `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
        fedex:  `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
        ups:    `https://www.ups.com/track?tracknum=${trackingNumber}`,
        aramex: `https://www.aramex.com/track/results?ShipmentNumber=${trackingNumber}`,
        usps:   `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    };
    const url = carrier ? urls[carrier.toLowerCase()] : undefined;

    return url ? (
        <a href={url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors font-mono"
        >
            <MapPin size={13} />
            {trackingNumber}
            <ExternalLink size={11} className="opacity-50" />
        </a>
    ) : (
        <span className="text-sm text-gray-400 font-mono">{trackingNumber}</span>
    );
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
    const cfg = STATUS_CONFIG[shipment.status] ?? STATUS_CONFIG.pending;

    return (
        <div className={`bg-gray-800 border border-l-2 ${cfg.accent} border-gray-700 rounded-xl p-4 flex flex-col gap-3 hover:border-t-gray-600 hover:border-r-gray-600 hover:border-b-gray-600 transition-colors`}>
            {/* Top row: order + status */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Link
                        href={`/admin/orders/${shipment.id}`}
                        className="text-sm font-semibold text-white hover:text-purple-300 transition-colors inline-flex items-center gap-1 shrink-0"
                    >
                        {shipment.order_number}
                        <ExternalLink size={11} className="opacity-50" />
                    </Link>
                    {shipment.carrier && (
                        <span className="text-xs font-medium text-gray-400 capitalize bg-gray-700 border border-gray-600 px-2 py-0.5 rounded-full">
                            {shipment.carrier}
                        </span>
                    )}
                </div>
                <StatusBadge status={shipment.status} />
            </div>

            {/* Customer */}
            <p className="text-xs text-gray-500">{shipment.customer_name}</p>

            {/* Tracking */}
            <div className="flex flex-col gap-1">
                {shipment.tracking_number ? (
                    <TrackingLink carrier={shipment.carrier} trackingNumber={shipment.tracking_number} />
                ) : (
                    <span className="text-sm text-gray-600 italic">No tracking number yet</span>
                )}
                {shipment.oto_id && (
                    <span className="text-xs text-gray-600 font-mono">OTO #{shipment.oto_id}</span>
                )}
            </div>

            {/* Footer: label + date */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-700/60">
                <div>
                    {shipment.shipping_label_url ? (
                        <a
                            href={shipment.shipping_label_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600"
                        >
                            <FileText size={12} />
                            Download Label
                        </a>
                    ) : (
                        <span className="text-xs text-gray-700">No label</span>
                    )}
                </div>
                <span className="text-xs text-gray-600">
                    {new Date(shipment.updated_at).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </span>
            </div>
        </div>
    );
}

export default function ShipmentsIndex({ shipments, filters, stats, carriers }: Props) {
    function applyFilters(extra: Partial<Filters> = {}) {
        router.get('/admin/shipments', { ...filters, ...extra }, { preserveState: true, replace: true });
    }

    const carrierOptions = [
        { value: '', label: 'All carriers' },
        ...carriers.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
    ];

    return (
        <AdminLayout>
            <Head title="Shipments" />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/15 rounded-xl border border-purple-500/20">
                        <Truck className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Shipments</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {shipments.total.toLocaleString()} shipment{shipments.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stat cards — clickable to filter */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'In Transit',         value: stats.in_transit,          icon: Truck,        color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   filter: 'shipped'    },
                    { label: 'Delivered',           value: stats.delivered,           icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20',  filter: 'delivered'  },
                    { label: 'Cancelled',           value: stats.cancelled,           icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20',    filter: 'cancelled'  },
                    { label: 'Pending Fulfillment', value: stats.pending_fulfillment, icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', filter: 'processing' },
                ].map(({ label, value, icon: Icon, color, bg, border, filter }) => (
                    <button
                        key={label}
                        onClick={() => applyFilters({ status: filters.status === filter ? undefined : filter })}
                        className={`bg-gray-800 border rounded-xl p-4 text-left transition-colors hover:border-gray-600 ${
                            filters.status === filter ? 'border-purple-500/50 ring-1 ring-purple-500/20' : 'border-gray-700'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${bg} border ${border} shrink-0`}>
                                <Icon size={16} className={color} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                                <p className="text-2xl font-bold text-white">{value}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <AdminSelect
                        variant="filter" className="w-44"
                        value={filters.status ?? ''}
                        onChange={(v) => applyFilters({ status: v || undefined })}
                        options={[
                            { value: '',           label: 'All statuses' },
                            { value: 'shipped',    label: 'In Transit'   },
                            { value: 'delivered',  label: 'Delivered'    },
                            { value: 'cancelled',  label: 'Cancelled'    },
                            { value: 'processing', label: 'Processing'   },
                        ]}
                    />
                    {carriers.length > 0 && (
                        <AdminSelect
                            variant="filter" className="w-36"
                            value={filters.carrier ?? ''}
                            onChange={(v) => applyFilters({ carrier: v || undefined })}
                            options={carrierOptions}
                        />
                    )}
                    <div className="flex gap-2 ml-auto">
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
            {shipments.data.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-500 text-sm">
                    No shipments found.
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {shipments.data.map((shipment) => (
                        <ShipmentCard key={shipment.id} shipment={shipment} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {shipments.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                    <span>Showing {shipments.from}–{shipments.to} of {shipments.total}</span>
                    <div className="flex items-center gap-1">
                        {shipments.links.map((link, i) => {
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
