import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from '@/Components/ui/Label';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Sign Up" />
            <div className="min-h-screen grid lg:grid-cols-2">
                {/* Left Panel - Registration Form */}
                <div className="flex flex-col justify-center bg-background px-4 py-6 lg:px-8 order-2 lg:order-1">
                    <div className="mx-auto w-full max-w-[420px]">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-6">
                            <img
                                src="/images/logo-title.webp"
                                alt="HardRock"
                                className="h-10 mx-auto mb-3"
                            />
                            <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
                            <p className="text-sm text-muted-foreground mt-1">Fill in your details to get started</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
                            {/* Name Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Full Name</Label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    autoComplete="name"
                                    autoFocus
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="flex h-11 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    autoComplete="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="flex h-11 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        required
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="flex h-11 w-full rounded-md border border-border/60 bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-5" />
                                        ) : (
                                            <Eye className="size-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <div className="relative">
                                    <input
                                        id="password_confirmation"
                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        required
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="flex h-11 w-full rounded-md border border-border/60 bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPasswordConfirmation ? (
                                            <EyeOff className="size-5" />
                                        ) : (
                                            <Eye className="size-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.password_confirmation}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-11 bg-brand-purple hover:bg-brand-purple/90 text-white text-base font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Creating account...' : 'Sign Up'}
                            </button>
                        </form>

                        {/* Already have account Link */}
                        <div className="mt-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <Link
                                    href={route('login')}
                                    className="text-brand-purple hover:underline font-medium"
                                >
                                    Log in
                                </Link>
                            </p>
                        </div>

                        {/* Back to Homepage */}
                        <div className="mt-3 text-center">
                            <Link
                                href="/"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ← Back to Homepage
                            </Link>
                        </div>

                        {/* Mobile Footer Links */}
                        <div className="lg:hidden mt-4 flex justify-center gap-6 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                            <a href="/#contact" className="hover:text-foreground transition-colors">Contact</a>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Branding (Desktop Only) */}
                <div className="hidden lg:flex flex-col bg-gradient-to-br from-brand-purple/90 via-brand-purple to-brand-purple/80 relative overflow-hidden order-1 lg:order-2">
                    {/* Decorative elements */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
                    <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-40 right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

                    {/* Centered Content */}
                    <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-8">
                        <img
                            src="/images/logo-title.webp"
                            alt="HardRock"
                            className="h-10 brightness-0 invert mb-6"
                        />
                        <h2 className="text-white text-3xl font-bold text-center mb-3">Join HardRock</h2>
                        <p className="text-white/80 text-base text-center max-w-sm">
                            Create an account to start shopping and enjoy exclusive benefits.
                        </p>
                    </div>

                    {/* Footer Links */}
                    <div className="p-6 relative z-10">
                        <div className="flex justify-center gap-6 text-white/60 text-sm">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="/#contact" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
