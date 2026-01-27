import { Fragment } from 'react';
import { Link } from '@inertiajs/react';
import { Dialog, Transition } from '@headlessui/react';
import {
    X,
    History,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    User,
} from 'lucide-react';

interface ActivityLog {
    id: number;
    model_type: string;
    model_id: number;
    model_name: string | null;
    action: 'created' | 'updated' | 'deleted' | 'restored';
    changes: Array<{
        field: string;
        label: string;
        type: string;
        old: string;
        new: string;
    }> | null;
    user_id: number | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    created_at: string;
}

interface ActivityDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activities: ActivityLog[];
}

// Helper to format relative time
const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
};

// Get action icon and color
const getActionStyle = (action: string) => {
    switch (action) {
        case 'created':
            return { icon: Plus, color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' };
        case 'updated':
            return { icon: Pencil, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' };
        case 'deleted':
            return { icon: Trash2, color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30' };
        case 'restored':
            return { icon: RotateCcw, color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30' };
        default:
            return { icon: History, color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30' };
    }
};

// Get model URL
const getModelUrl = (activity: ActivityLog): string | null => {
    if (activity.action === 'deleted') return null;
    const urlMap: Record<string, string> = {
        'Product': `/admin/products/${activity.model_id}/edit`,
        'Category': `/admin/categories/${activity.model_id}/edit`,
        'Order': `/admin/orders/${activity.model_id}`,
    };
    return urlMap[activity.model_type] ?? null;
};

function ActivityItem({ activity, onClose }: { activity: ActivityLog; onClose: () => void }) {
    const actionStyle = getActionStyle(activity.action);
    const ActionIcon = actionStyle.icon;
    const modelUrl = getModelUrl(activity);
    const displayName = activity.model_name || `${activity.model_type} #${activity.model_id}`;

    return (
        <div className="flex items-start gap-3 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
            {/* Action icon */}
            <div className={`p-2 rounded-lg shrink-0 ${actionStyle.color}`}>
                <ActionIcon className="h-4 w-4" />
            </div>

            {/* Activity details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {activity.action}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.model_type}:
                    </span>
                    {modelUrl ? (
                        <Link
                            href={modelUrl}
                            onClick={onClose}
                            className="text-sm font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 truncate max-w-[200px]"
                        >
                            {displayName}
                        </Link>
                    ) : (
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
                            {displayName}
                        </span>
                    )}
                </div>

                {/* Changes summary for updates */}
                {activity.action === 'updated' && activity.changes && activity.changes.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {activity.changes.slice(0, 3).map((change, idx) => (
                            <div key={idx} className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">{change.label}:</span>{' '}
                                <span className="text-red-500 line-through">{change.old || '(empty)'}</span>
                                {' → '}
                                <span className="text-green-600">{change.new || '(empty)'}</span>
                            </div>
                        ))}
                        {activity.changes.length > 3 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                +{activity.changes.length - 3} more changes
                            </span>
                        )}
                    </div>
                )}

                {/* User and time */}
                <div className="flex items-center gap-2 mt-2">
                    {activity.user && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {activity.user.name}
                        </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatTimeAgo(activity.created_at)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function ActivityDrawer({ isOpen, onClose, activities }: ActivityDrawerProps) {
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="w-screen max-w-md">
                                    <div className="flex h-full flex-col bg-white dark:bg-gray-800 shadow-xl">
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-4 py-4 border-b dark:border-gray-700">
                                            <Dialog.Title className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                                <History className="h-5 w-5 text-purple-500" />
                                                All Activity
                                                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                                    ({activities.length})
                                                </span>
                                            </Dialog.Title>
                                            <button
                                                onClick={onClose}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <X className="h-5 w-5 dark:text-gray-400" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 overflow-y-auto px-4">
                                            {activities.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-center">
                                                    <History className="h-16 w-16 text-gray-200 dark:text-gray-600 mb-4" />
                                                    <p className="text-gray-500 dark:text-gray-400">
                                                        No recent activity
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {activities.map((activity) => (
                                                        <ActivityItem
                                                            key={activity.id}
                                                            activity={activity}
                                                            onClose={onClose}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
