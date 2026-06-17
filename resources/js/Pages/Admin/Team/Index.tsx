import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, ShieldCheck, Shield, Mail, CalendarDays, Crown } from 'lucide-react';
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

function Avatar({ name }: { name: string }) {
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div className="h-10 w-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-purple-300">{initials}</span>
        </div>
    );
}

function DeleteButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
    const [confirming, setConfirming] = useState(false);

    if (disabled) {
        return (
            <span className="p-1.5 text-gray-700 cursor-not-allowed" title="You can't remove yourself">
                <Trash2 size={14} />
            </span>
        );
    }

    if (confirming) {
        return (
            <span className="flex items-center gap-2 text-xs">
                <button
                    onClick={() => { onConfirm(); setConfirming(false); }}
                    className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded font-medium transition-colors"
                >
                    Remove
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                    Cancel
                </button>
            </span>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
            title="Remove from team"
        >
            <Trash2 size={14} />
        </button>
    );
}

function MemberCard({ member, isSelf, onDelete }: { member: Member; isSelf: boolean; onDelete: () => void }) {
    return (
        <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors group">
            {isSelf && (
                <span className="absolute top-3 right-3 text-[10px] font-semibold text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded-full">
                    You
                </span>
            )}

            <div className="flex items-start gap-3 mb-4">
                <Avatar name={member.name} />
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate pr-10">{member.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail size={11} className="text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-400 truncate">{member.email}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                <CalendarDays size={11} />
                <span>Added {member.created_at}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                    member.role === 'admin'
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                        : 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                }`}>
                    {member.role === 'admin' ? <Crown size={11} /> : <Shield size={11} />}
                    {member.role === 'admin' ? 'Admin' : 'Editor'}
                </span>

                <div className="flex items-center gap-0.5">
                    <Link
                        href={`/admin/team/${member.id}/edit`}
                        className="p-1.5 text-gray-500 hover:text-purple-400 transition-colors rounded-lg hover:bg-purple-400/10"
                        title="Edit member"
                    >
                        <Pencil size={14} />
                    </Link>
                    <DeleteButton onConfirm={onDelete} disabled={isSelf} />
                </div>
            </div>
        </div>
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

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/15 rounded-xl border border-purple-500/20">
                        <Users className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Team</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {members.length} staff member{members.length !== 1 ? 's' : ''} with admin panel access
                        </p>
                    </div>
                </div>
                <Link
                    href="/admin/team/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-purple-900/30"
                >
                    <Plus size={16} />
                    Add Member
                </Link>
            </div>

            {/* Admins section */}
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck size={15} className="text-amber-400" />
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        Admins
                    </h2>
                    <span className="text-xs text-gray-600 font-medium bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
                        {admins.length}
                    </span>
                </div>

                {admins.length === 0 ? (
                    <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-600 text-sm">
                        No admins yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {admins.map((m) => (
                            <MemberCard
                                key={m.id}
                                member={m}
                                isSelf={m.id === auth.user.id}
                                onDelete={() => destroy(m.id)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Editors section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Shield size={15} className="text-blue-400" />
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        Editors
                    </h2>
                    <span className="text-xs text-gray-600 font-medium bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
                        {editors.length}
                    </span>
                </div>

                {editors.length === 0 ? (
                    <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
                        <p className="text-gray-600 text-sm">No editors yet.</p>
                        <Link
                            href="/admin/team/create"
                            className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-sm mt-2 transition-colors"
                        >
                            <Plus size={14} />
                            Add an editor
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {editors.map((m) => (
                            <MemberCard
                                key={m.id}
                                member={m}
                                isSelf={m.id === auth.user.id}
                                onDelete={() => destroy(m.id)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </AdminLayout>
    );
}
