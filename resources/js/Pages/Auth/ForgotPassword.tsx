import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Label } from '@/Components/ui/Label';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Forgot Password" />
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-[420px] p-8">
                    {/* Logo Section */}
                    <div className="text-center mb-12">
                        <img
                            src="/images/logo-title.webp"
                            alt="HardRock"
                            className="h-10 mx-auto mb-6"
                        />
                        <h1 className="text-3xl font-semibold text-foreground">Forgot Password</h1>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm text-center mb-10">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    {/* Success Message */}
                    {status && (
                        <div className="mb-6 p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-700 dark:text-green-400">{status}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <input
                                id="email"
                                type="email"
                                placeholder="admin@hardrock-co.com"
                                autoComplete="email"
                                autoFocus
                                required
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="flex h-12 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full h-12 bg-brand-purple hover:bg-brand-purple/90 text-white text-base font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <div className="mt-8 text-center">
                        <Link
                            href={route('login')}
                            className="text-sm text-brand-purple hover:underline"
                        >
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
