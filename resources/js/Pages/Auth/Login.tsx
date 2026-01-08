import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from '@/Components/ui/Label';
import { Checkbox } from '@/Components/ui/Checkbox';
import { AnimatedCharactersLoginPage } from '@/Components/ui/animated-characters-login-page';

interface User {
    id: number;
    name: string;
    email: string;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    user?: User;
}

export default function Login({ status, canResetPassword, user }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('login'));
    };

    const handleInputFocus = () => {
        setIsTyping(true);
    };

    const handleInputBlur = () => {
        setIsTyping(false);
    };

    // If user is already authenticated
    if (user) {
        return (
            <>
                <Head title="Already Logged In" />
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="w-full max-w-md text-center space-y-6">
                        <img
                            src="/images/logo-title.webp"
                            alt="HardRock"
                            className="h-10 mx-auto"
                        />
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>
                            <p className="text-muted-foreground">You are already logged in.</p>
                        </div>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard"
                                className="w-full h-12 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-md flex items-center justify-center font-medium transition-colors"
                            >
                                Go to Dashboard
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                            >
                                Sign out and use a different account
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Log in" />
            <div className="min-h-screen grid lg:grid-cols-2">
                {/* Left Panel - Animated Characters (Desktop Only) */}
                <div className="hidden lg:flex flex-col bg-gradient-to-br from-brand-purple/90 via-brand-purple to-brand-purple/80 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
                    <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-40 right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

                    {/* Header */}
                    <div className="p-8 flex items-center gap-4 relative z-10">
                        <img
                            src="/images/logo-title.webp"
                            alt="HardRock"
                            className="h-8 brightness-0 invert"
                        />
                        <span className="text-white text-4xl font-bold">Login Page</span>
                    </div>

                    {/* Animated Characters */}
                    <div className="flex-1 relative z-10 flex items-end justify-center px-8">
                        <AnimatedCharactersLoginPage
                            isTyping={isTyping}
                            showPassword={showPassword}
                            hasPasswordValue={data.password.length > 0}
                        />
                    </div>

                    {/* Footer Links */}
                    <div className="p-8 relative z-10">
                        <div className="flex gap-6 text-white/60 text-sm">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="/#contact" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Login Form */}
                <div className="flex flex-col justify-center bg-background px-4 py-8 lg:px-8">
                    <div className="mx-auto w-full max-w-[420px]">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <img
                                src="/images/logo-title.webp"
                                alt="HardRock"
                                className="h-10"
                            />
                        </div>

                        {/* Title */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
                            <p className="text-sm text-muted-foreground mt-2">Please enter your details</p>
                        </div>

                        {/* Status Message */}
                        {status && (
                            <div className="mb-6 p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-700 dark:text-green-400">{status}</p>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="admin@hardrock-demo.com"
                                    autoComplete="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                    className="flex h-12 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        onFocus={handleInputFocus}
                                        onBlur={handleInputBlur}
                                        className="flex h-12 w-full rounded-md border border-border/60 bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
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

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked) => setData('remember', checked as boolean)}
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="text-sm font-normal text-muted-foreground cursor-pointer"
                                    >
                                        Remember for 30 days
                                    </Label>
                                </div>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm text-brand-purple hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-12 bg-brand-purple hover:bg-brand-purple/90 text-white text-base font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Logging in...' : 'Log in'}
                            </button>
                        </form>

                        {/* Sign Up Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Don't have an account?{' '}
                                <Link
                                    href={route('register')}
                                    className="text-brand-purple hover:underline font-medium"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </div>

                        {/* Back to Homepage */}
                        <div className="mt-4 text-center">
                            <Link
                                href="/"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ← Back to Homepage
                            </Link>
                        </div>

                        {/* Mobile Footer Links */}
                        <div className="lg:hidden mt-6 flex justify-center gap-6 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                            <a href="/#contact" className="hover:text-foreground transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
