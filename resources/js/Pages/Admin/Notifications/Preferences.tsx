import { useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Bell, Mail, Smartphone, ShoppingBag, Package, Shield } from 'lucide-react';

interface Props {
    preferences: {
        in_app: { new_order: boolean; low_stock: boolean; editor_sensitive_action: boolean };
        email: { new_order: boolean; low_stock: boolean; editor_sensitive_action: boolean };
    };
    role: string;
}

const EVENT_META: Record<string, { label: string; description: string; icon: React.ElementType; adminOnly?: boolean }> = {
    new_order: {
        label: 'New Order',
        description: 'Notify when a customer places a new order.',
        icon: ShoppingBag,
    },
    low_stock: {
        label: 'Low Stock',
        description: 'Notify when a product stock drops below the threshold.',
        icon: Package,
    },
    editor_sensitive_action: {
        label: 'Editor Actions',
        description: 'Notify when an editor performs a sensitive action (delete, status change, etc.).',
        icon: Shield,
        adminOnly: true,
    },
};

export default function Preferences({ preferences, role }: Props) {
    const { data, setData, put, processing, recentlySuccessful } = useForm({
        in_app: { ...preferences.in_app },
        email: { ...preferences.email },
    });

    const isAdmin = role === 'admin';

    const toggle = (channel: 'in_app' | 'email', event: string) => {
        setData(channel, {
            ...data[channel],
            [event]: !data[channel][event as keyof typeof data.in_app],
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/admin/notifications/preferences');
    };

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Preferences</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Choose which events you want to be notified about and through which channels.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Channel headers */}
                        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <span>Event</span>
                            <span className="flex items-center gap-1.5 min-w-[80px] justify-center">
                                <Smartphone className="h-3.5 w-3.5" /> In-App
                            </span>
                            <span className="flex items-center gap-1.5 min-w-[80px] justify-center">
                                <Mail className="h-3.5 w-3.5" /> Email
                            </span>
                        </div>

                        {/* Event rows */}
                        {Object.entries(EVENT_META).map(([key, meta]) => {
                            if (meta.adminOnly && !isAdmin) return null;
                            const Icon = meta.icon;
                            const inAppVal = data.in_app[key as keyof typeof data.in_app];
                            const emailVal = data.email[key as keyof typeof data.email];

                            return (
                                <div
                                    key={key}
                                    className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                            <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{meta.label}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{meta.description}</p>
                                        </div>
                                    </div>

                                    {/* In-App toggle */}
                                    <div className="min-w-[80px] flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => toggle('in_app', key)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                                inAppVal ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                                    inAppVal ? 'translate-x-5' : 'translate-x-0.5'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Email toggle */}
                                    <div className="min-w-[80px] flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => toggle('email', key)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                                emailVal ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                                    emailVal ? 'translate-x-5' : 'translate-x-0.5'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                            <Bell className="h-3.5 w-3.5" />
                            In-app notifications appear in the bell icon at the top of the page.
                        </p>
                        <div className="flex items-center gap-3">
                            {recentlySuccessful && (
                                <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
                            )}
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
                            >
                                {processing ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
