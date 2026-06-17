import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, ShieldCheck, Shield } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Member {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'editor';
    verified: boolean;
    created_at: string;
}

interface Props {
    members: Member[];
}

function ConfirmDelete({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
    const [confirming, setConfirming] = useState(false);
    if (disabled) return <span className="text-gray-700"><Trash2 size={15} /></span>;
    if (confirming) return (
        <span className="flex items-center gap-1.5 text-xs">
            <button onClick={() => { onConfirm(); setConfirming(false); }} className="text-red-400 hover:text-red-300 font-medium">Delete</button>
            <span className="text-gray-600">·</span>
            <button onClick={() => setConfirming(false)} className="text-gray-500 hover:text-gray-300">Cancel</button>
        </span>
    );
    return (
        <button onClick={() => setConfirming(true)} className="text-gray-500 hover:text-red-400 transition-colors" title="Remove from team">
            <Trash2 size={15} />
        </button>
    );
}

export default function TeamIndex({ members }: Props) {
    const { auth } = usePage().props as { auth: { user: { id: number; name: string; email: string; role: string } } };

    const admins  = members.filter((m) => m.role === 'admin');
    const editors = members.filter((m) => m.role === 'editor');

    function destroy(id: number) {
        router.delete(`/admin/team/${id}`, { preserveScroll: true });
    }

    return (
        <AdminLayout>
            <Head title="Team" />

            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-purple-400" />
                    <div>
                        <h1 className="text-xl font-bold text-white">Team</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Staff accounts with admin panel access.</p>
                    </div>
                </div>
                <Link
                    href="/admin/team/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus size={16} />
                    Add Member
                </Link>
            </div>

            {[{ label: 'Admins', icon: ShieldCheck, list: admins }, { label: 'Editors', icon: Shield, list: editors }].map(({ label, icon: Icon, list }) => (
                <div key={label} className="mb-6">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                        <Icon size={14} />
                        {label} ({list.length})
                    </h2>

                    {list.length === 0 ? (
                        <p className="text-sm text-gray-600 pl-1">None yet.</p>
                    ) : (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-700/40 border-b border-gray-700">
                                    <tr>
                                        <th className="text-start px-5 py-3 font-medium text-gray-400">Name</th>
                                        <th className="text-start px-5 py-3 font-medium text-gray-400 hidden sm:table-cell">Email</th>
                                        <th className="text-start px-5 py-3 font-medium text-gray-400 hidden md:table-cell">Added</th>
                                        <th className="text-end px-5 py-3 font-medium text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/50">
                                    {list.map((m) => (
                                        <tr key={m.id} className="hover:bg-gray-700/20 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="font-medium text-white">{m.name}</div>
                                                {m.id === auth.user.id && <span className="text-xs text-purple-400">You</span>}
                                            </td>
                                            <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">{m.email}</td>
                                            <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{m.created_at}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Link href={`/admin/team/${m.id}/edit`} className="text-gray-400 hover:text-purple-400 transition-colors" title="Edit">
                                                        <Pencil size={15} />
                                                    </Link>
                                                    <ConfirmDelete onConfirm={() => destroy(m.id)} disabled={m.id === auth.user.id} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ))}
        </AdminLayout>
    );
}
