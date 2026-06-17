import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { AdminSelect } from '@/Components/admin/AdminSelect';

interface Member { id: number; name: string; email: string; role: 'admin' | 'editor' }

export default function TeamEdit({ member }: { member: Member }) {
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        _method:               'PUT',
        name:                  member.name,
        email:                 member.email,
        role:                  member.role,
        password:              '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/team/${member.id}`);
    }

    return (
        <AdminLayout>
            <Head title={`Edit ${member.name}`} />

            <div className="max-w-lg">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-white">Edit Team Member</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{member.email}</p>
                </div>

                <form onSubmit={submit} className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
                        <AdminSelect
                            value={data.role}
                            onChange={(v) => setData('role', v as 'admin' | 'editor')}
                            options={[
                                { value: 'editor', label: 'Editor' },
                                { value: 'admin', label: 'Admin' },
                            ]}
                        />
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <p className="text-xs text-gray-500 mb-4">Leave password blank to keep the current one.</p>
                        {[
                            { label: 'New Password', key: 'password' as const, show: showPw, toggle: () => setShowPw(!showPw) },
                            { label: 'Confirm New Password', key: 'password_confirmation' as const, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
                        ].map(({ label, key, show, toggle }) => (
                            <div key={key} className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
                                <div className="relative">
                                    <input
                                        type={show ? 'text' : 'password'}
                                        value={data[key]}
                                        onChange={(e) => setData(key, e.target.value)}
                                        className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                        <Link href="/admin/team" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
