import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ShieldCheck, Save, RotateCcw, Users } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Editor {
    id: number;
    name: string;
    email: string;
    created_at: string;
    permissions: Record<string, Record<string, boolean>>;
}

interface Props {
    editors: Editor[];
    schema: Record<string, string[]>;
    defaults: Record<string, Record<string, boolean>>;
}

const SECTION_LABELS: Record<string, string> = {
    products:     'Products',
    categories:   'Categories',
    orders:       'Orders',
    reviews:      'Reviews',
    coupons:      'Coupons',
    reports:      'Reports',
    customers:    'Customers',
    activity_log: 'Activity Log',
};

const ACTION_LABELS: Record<string, string> = {
    view:          'View',
    create:        'Create',
    edit:          'Edit',
    delete:        'Delete',
    update_status: 'Update Status',
    export:        'Export',
};

export default function Authorization({ editors, schema, defaults }: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(editors[0]?.id ?? null);
    const [perms, setPerms] = useState<Record<number, Record<string, Record<string, boolean>>>>(
        Object.fromEntries(editors.map((e) => [e.id, e.permissions])),
    );
    const [saving, setSaving] = useState(false);

    const selected = editors.find((e) => e.id === selectedId);
    const currentPerms = selectedId !== null ? (perms[selectedId] ?? {}) : {};

    function toggle(section: string, action: string) {
        if (selectedId === null) return;
        setPerms((prev) => ({
            ...prev,
            [selectedId]: {
                ...prev[selectedId],
                [section]: {
                    ...prev[selectedId]?.[section],
                    [action]: !prev[selectedId]?.[section]?.[action],
                },
            },
        }));
    }

    function resetToDefaults() {
        if (selectedId === null) return;
        setPerms((prev) => ({ ...prev, [selectedId]: JSON.parse(JSON.stringify(defaults)) }));
    }

    function save() {
        if (selectedId === null || saving) return;
        setSaving(true);
        router.put(`/admin/authorization/${selectedId}`, { permissions: currentPerms }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    }

    return (
        <AdminLayout>
            <Head title="Authorization" />

            <div className="mb-6 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-purple-400" />
                <div>
                    <h1 className="text-xl font-bold text-white">Authorization</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Manage what each editor can do in the admin panel.</p>
                </div>
            </div>

            {editors.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
                    <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No editors yet. Create editor accounts from the Team page.</p>
                </div>
            ) : (
                <div className="flex gap-5">
                    {/* Editor list */}
                    <div className="w-60 shrink-0 space-y-1">
                        {editors.map((editor) => (
                            <button
                                key={editor.id}
                                onClick={() => setSelectedId(editor.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                                    selectedId === editor.id
                                        ? 'bg-purple-600/20 border-purple-500/50 text-white'
                                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <div className="font-medium text-sm truncate">{editor.name}</div>
                                <div className="text-xs text-gray-500 truncate mt-0.5">{editor.email}</div>
                            </button>
                        ))}
                    </div>

                    {/* Permissions grid */}
                    {selected && (
                        <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                                <div>
                                    <span className="font-semibold text-white">{selected.name}</span>
                                    <span className="text-gray-500 text-sm ml-2">{selected.email}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={resetToDefaults}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-600 text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                                    >
                                        <RotateCcw size={13} />
                                        Reset to defaults
                                    </button>
                                    <button
                                        onClick={save}
                                        disabled={saving}
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                                    >
                                        <Save size={13} />
                                        {saving ? 'Saving…' : 'Save'}
                                    </button>
                                </div>
                            </div>

                            <table className="w-full text-sm">
                                <thead className="bg-gray-700/40 border-b border-gray-700">
                                    <tr>
                                        <th className="text-start px-5 py-2.5 font-medium text-gray-400 w-40">Section</th>
                                        {['view', 'create', 'edit', 'delete', 'update_status', 'export'].map((a) => (
                                            <th key={a} className="text-center px-3 py-2.5 font-medium text-gray-400 text-xs">
                                                {ACTION_LABELS[a]}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/50">
                                    {Object.entries(schema).map(([section, actions]) => (
                                        <tr key={section} className="hover:bg-gray-700/20 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-200">
                                                {SECTION_LABELS[section] ?? section}
                                            </td>
                                            {['view', 'create', 'edit', 'delete', 'update_status', 'export'].map((action) => (
                                                <td key={action} className="text-center px-3 py-3">
                                                    {actions.includes(action) ? (
                                                        <button
                                                            onClick={() => toggle(section, action)}
                                                            className={`inline-flex items-center justify-center w-5 h-5 rounded border transition-colors ${
                                                                currentPerms[section]?.[action]
                                                                    ? 'bg-purple-600 border-purple-500 text-white'
                                                                    : 'bg-gray-700 border-gray-600 text-transparent hover:border-gray-400'
                                                            }`}
                                                            title={`${currentPerms[section]?.[action] ? 'Revoke' : 'Grant'} ${ACTION_LABELS[action]} on ${SECTION_LABELS[section]}`}
                                                        >
                                                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-700">—</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}
