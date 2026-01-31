import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Button } from '@/Components/ui';
import {
    Settings,
    Save,
    Store,
    DollarSign,
    Package,
    CheckCircle,
    X,
    Loader2,
} from 'lucide-react';
import { useState, FormEvent } from 'react';

interface SettingField {
    key: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'boolean' | 'textarea' | 'select';
    value: string | number | boolean;
    default?: string | number | boolean;
    placeholder?: string;
    description?: string;
    options?: Array<{ value: string; label: string }>;
    min?: number;
    max?: number;
    step?: number;
    rtl?: boolean;
}

interface SettingGroup {
    label: string;
    description: string;
    fields: Record<string, SettingField>;
}

interface Props {
    settings: Record<string, SettingGroup>;
}

const groupIcons: Record<string, typeof Settings> = {
    general: Store,
    currency: DollarSign,
    inventory: Package,
};

export default function SettingsIndex({ settings }: Props) {
    const [activeGroup, setActiveGroup] = useState<string>(Object.keys(settings)[0] || 'general');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [hasSavedOnce, setHasSavedOnce] = useState(false);

    // Build initial form data from settings
    const buildFormData = () => {
        const data: Record<string, string | number | boolean> = {};
        Object.entries(settings).forEach(([, group]) => {
            Object.entries(group.fields).forEach(([key, field]) => {
                data[key] = field.value;
            });
        });
        return data;
    };

    const { data, setData, put, processing, isDirty } = useForm(buildFormData());

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put('/admin/settings', {
            preserveScroll: true,
            onSuccess: () => {
                setHasSavedOnce(true);
                setSuccessMessage('Settings saved successfully.');
                setTimeout(() => setSuccessMessage(null), 5000);
            },
        });
    };

    const handleFieldChange = (key: string, value: string | number | boolean) => {
        setData(key, value);
    };

    const renderField = (field: SettingField) => {
        const baseInputClass =
            'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors';

        switch (field.type) {
            case 'boolean':
                return (
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {field.label}
                            </label>
                            {field.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {field.description}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleFieldChange(field.key, !data[field.key])}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                data[field.key]
                                    ? 'bg-purple-600'
                                    : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    data[field.key] ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                );

            case 'textarea':
                return (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {field.label}
                        </label>
                        <textarea
                            value={data[field.key] as string}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            rows={3}
                            dir={field.rtl ? 'rtl' : 'ltr'}
                            className={baseInputClass}
                        />
                        {field.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {field.description}
                            </p>
                        )}
                    </div>
                );

            case 'select':
                return (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {field.label}
                        </label>
                        <select
                            value={data[field.key] as string}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className={baseInputClass}
                        >
                            {field.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {field.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {field.description}
                            </p>
                        )}
                    </div>
                );

            case 'number':
                return (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {field.label}
                        </label>
                        <input
                            type="number"
                            value={data[field.key] as number}
                            onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value) || 0)}
                            placeholder={field.placeholder}
                            min={field.min}
                            max={field.max}
                            step={field.step || 1}
                            className={baseInputClass}
                        />
                        {field.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {field.description}
                            </p>
                        )}
                    </div>
                );

            default:
                return (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {field.label}
                        </label>
                        <input
                            type={field.type}
                            value={data[field.key] as string}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            dir={field.rtl ? 'rtl' : 'ltr'}
                            className={baseInputClass}
                        />
                        {field.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {field.description}
                            </p>
                        )}
                    </div>
                );
        }
    };

    const groupKeys = Object.keys(settings);

    return (
        <AdminLayout>
            <Head title="Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        Settings
                    </h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1">
                            <Card className="dark:bg-gray-800 dark:border-gray-700 p-2">
                                <nav className="space-y-1">
                                    {groupKeys.map((groupKey) => {
                                        const group = settings[groupKey];
                                        const Icon = groupIcons[groupKey] || Settings;
                                        const isActive = activeGroup === groupKey;

                                        return (
                                            <button
                                                key={groupKey}
                                                type="button"
                                                onClick={() => setActiveGroup(groupKey)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                                    isActive
                                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                <Icon className={`h-5 w-5 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                                                <span className="font-medium">{group.label}</span>
                                            </button>
                                        );
                                    })}
                                </nav>
                            </Card>
                        </div>

                        {/* Settings Content */}
                        <div className="lg:col-span-3">
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <div className="p-6 border-b dark:border-gray-700">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {settings[activeGroup]?.label}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {settings[activeGroup]?.description}
                                    </p>
                                </div>

                                <div className="p-6 space-y-6">
                                    {settings[activeGroup] &&
                                        Object.values(settings[activeGroup].fields).map((field) => (
                                            <div key={field.key}>{renderField(field)}</div>
                                        ))}
                                </div>

                                {/* Save Button */}
                                <div className="px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg flex items-center justify-between">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isDirty
                                            ? 'You have unsaved changes'
                                            : hasSavedOnce
                                              ? 'All changes saved'
                                              : 'No unsaved changes'}
                                    </p>
                                    <Button
                                        type="submit"
                                        disabled={processing || !isDirty}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>

            {/* Success Message Toast */}
            {successMessage && (
                <div className="fixed bottom-6 right-6 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg border border-green-200 dark:border-green-800 flex items-center gap-3 animate-in slide-in-from-bottom-5">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span>{successMessage}</span>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="ml-2 p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-800/50 transition-colors"
                        title="Dismiss"
                    >
                        <X className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </button>
                </div>
            )}
        </AdminLayout>
    );
}
