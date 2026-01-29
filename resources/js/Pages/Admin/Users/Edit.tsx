import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Card, CardHeader, CardContent, Badge } from '@/Components/ui';
import { User } from '@/types/models';
import {
    ArrowLeft,
    UserCircle,
    Mail,
    Phone,
    KeyRound,
    Shield,
    Calendar,
    Trash2,
    AlertTriangle,
    Send,
    Check,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    user: User;
}

// Helper to format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

export default function EditUser({ user }: Props) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [resetEmailStatus, setResetEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [verifyEmailStatus, setVerifyEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
    });

    const handleSendResetEmail = () => {
        setResetEmailStatus('sending');
        router.post(`/admin/users/${user.id}/send-reset-email`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setResetEmailStatus('sent');
                // Reset after 5 seconds so they can send again if needed
                setTimeout(() => setResetEmailStatus('idle'), 5000);
            },
            onError: () => {
                setResetEmailStatus('idle');
            },
        });
    };

    const handleSendVerificationEmail = () => {
        setVerifyEmailStatus('sending');
        router.post(`/admin/users/${user.id}/send-verification-email`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setVerifyEmailStatus('sent');
                setTimeout(() => setVerifyEmailStatus('idle'), 5000);
            },
            onError: () => {
                setVerifyEmailStatus('idle');
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/users/${user.id}`);
    };

    const handleDelete = () => {
        router.delete(`/admin/users/${user.id}`);
    };

    const isAdmin = user.role === 'admin';

    return (
        <AdminLayout>
            <Head title={`Edit User: ${user.name}`} />

            {/* Top Action Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <Link
                    href="/admin/users"
                    className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Users
                </Link>
                <div className="flex gap-3 ml-auto">
                    <Button type="submit" form="user-edit-form" disabled={processing}>
                        {processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Link href="/admin/users">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                </div>
            </div>

            <form id="user-edit-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Main Form - Left Side */}
                    <div className="xl:col-span-2">
                        <Card className="dark:bg-gray-800 dark:border-gray-700">
                            <CardHeader>
                                <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                    <UserCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    User Information
                                </h2>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                        <UserCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Full Name
                                    </label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={errors.name}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                        <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Email Address
                                    </label>
                                    <Input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        error={errors.email}
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                        <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Phone Number (Optional)
                                    </label>
                                    <Input
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        error={errors.phone}
                                        placeholder="+962 7XX XXX XXX"
                                    />
                                </div>

                                {/* Password Reset */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                        <KeyRound className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Password
                                    </label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={handleSendResetEmail}
                                        disabled={resetEmailStatus !== 'idle'}
                                    >
                                        {resetEmailStatus === 'idle' && (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Send Password Reset Link
                                            </>
                                        )}
                                        {resetEmailStatus === 'sending' && (
                                            <>
                                                <Send className="h-4 w-4 mr-2 animate-pulse" />
                                                Sending...
                                            </>
                                        )}
                                        {resetEmailStatus === 'sent' && (
                                            <>
                                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                                Reset Link Sent!
                                            </>
                                        )}
                                    </Button>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        This will send a password reset email to the user. They can then set their own new password.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Right Side */}
                    <div className="space-y-6">
                        {/* User Info Card */}
                        <Card className="dark:bg-gray-800 dark:border-gray-700">
                            <CardHeader>
                                <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                                    <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    Account Details
                                </h2>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Role Badge */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                        Role
                                    </label>
                                    <Badge
                                        variant={isAdmin ? 'default' : 'info'}
                                        className="text-sm px-3 py-1"
                                    >
                                        {isAdmin ? (
                                            <span className="flex items-center gap-1.5">
                                                <Shield className="h-3.5 w-3.5" />
                                                Administrator
                                            </span>
                                        ) : (
                                            'Customer'
                                        )}
                                    </Badge>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        User roles cannot be changed.
                                    </p>
                                </div>

                                {/* Joined Date */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Joined
                                    </label>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatDate(user.created_at)}
                                    </p>
                                </div>

                                {/* Email Verification */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                        Email Verified
                                    </label>
                                    {user.email_verified_at ? (
                                        <Badge variant="success" className="text-xs">
                                            Verified
                                        </Badge>
                                    ) : (
                                        <div className="space-y-2">
                                            <Badge variant="warning" className="text-xs">
                                                Not Verified
                                            </Badge>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs"
                                                onClick={handleSendVerificationEmail}
                                                disabled={verifyEmailStatus !== 'idle'}
                                            >
                                                {verifyEmailStatus === 'idle' && (
                                                    <>
                                                        <Send className="h-3 w-3 mr-1.5" />
                                                        Resend Verification
                                                    </>
                                                )}
                                                {verifyEmailStatus === 'sending' && (
                                                    <>
                                                        <Send className="h-3 w-3 mr-1.5 animate-pulse" />
                                                        Sending...
                                                    </>
                                                )}
                                                {verifyEmailStatus === 'sent' && (
                                                    <>
                                                        <Check className="h-3 w-3 mr-1.5 text-green-600" />
                                                        Sent!
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Delete Card - Only for customers */}
                        {!isAdmin && (
                            <Card className="dark:bg-gray-800 dark:border-gray-700 border-red-200 dark:border-red-900/50">
                                <CardHeader>
                                    <h2 className="text-lg font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                                        <AlertTriangle className="h-5 w-5" />
                                        Danger Zone
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    {!showDeleteConfirm ? (
                                        <>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                Deleting this user will remove their account. This action uses soft delete and can be reversed.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => setShowDeleteConfirm(true)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete User
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                                Are you sure you want to delete "{user.name}"?
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                    onClick={handleDelete}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Admin Protection Notice */}
                        {isAdmin && (
                            <Card className="dark:bg-gray-800 dark:border-gray-700 border-amber-200 dark:border-amber-900/50">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                                Protected Account
                                            </p>
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                Administrator accounts cannot be deleted for security reasons.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
