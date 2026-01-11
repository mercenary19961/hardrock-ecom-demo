import { Head, Link, useForm } from "@inertiajs/react";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/Components/ui/Label";
import { Checkbox } from "@/Components/ui/Checkbox";
import { AnimatedCharactersLoginPage } from "@/Components/ui/animated-characters-login-page";
import { useTranslation } from "react-i18next";
import "@/i18n";

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
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const [showPassword, setShowPassword] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route("login"));
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
                <Head title={t("auth:login.alreadyLoggedIn")} />
                <div
                    className="min-h-screen flex items-center justify-center bg-background p-4"
                    dir="ltr"
                >
                    <div className="w-full max-w-md text-center space-y-6">
                        <img
                            src="/images/logo-title.webp"
                            alt="HardRock"
                            className="h-10 mx-auto"
                        />
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">
                                {t("auth:login.welcomeBack", {
                                    name: user.name,
                                })}
                            </h1>
                            <p className="text-muted-foreground">
                                {t("auth:login.alreadyLoggedInDesc")}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard"
                                className="w-full h-12 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-md flex items-center justify-center font-medium transition-colors"
                            >
                                {t("auth:login.goToDashboard")}
                            </Link>
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                            >
                                {t("auth:login.signOutAndSwitch")}
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={t("auth:login.title")} />
            <div className="min-h-screen grid lg:grid-cols-2" dir="ltr">
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
                        <span className="text-white text-4xl font-bold">
                            {t("auth:login.pageTitle")}
                        </span>
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
                            <a
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                {t("auth:login.privacyPolicy")}
                            </a>
                            <a
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                {t("auth:login.termsOfService")}
                            </a>
                            <a
                                href="/#contact"
                                className="hover:text-white transition-colors"
                            >
                                {t("auth:login.contact")}
                            </a>
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
                        <div className="mb-8" dir={isRTL ? "rtl" : "ltr"}>
                            <h1 className="text-3xl font-bold text-foreground">
                                {t("auth:login.welcome")}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-2">
                                {t("auth:login.enterDetails")}
                            </p>
                        </div>

                        {/* Status Message */}
                        {status && (
                            <div className="mb-6 p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    {status}
                                </p>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div
                                className="space-y-2"
                                dir={isRTL ? "rtl" : "ltr"}
                            >
                                <Label htmlFor="email">
                                    {t("auth:login.email")}
                                </Label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder={t(
                                        "auth:login.emailPlaceholder"
                                    )}
                                    autoComplete="email"
                                    required
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                    className="flex h-12 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div
                                className="space-y-2"
                                dir={isRTL ? "rtl" : "ltr"}
                            >
                                <Label htmlFor="password">
                                    {t("auth:login.password")}
                                </Label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        onFocus={handleInputFocus}
                                        onBlur={handleInputBlur}
                                        style={isRTL ? { direction: 'rtl', textAlign: 'right' } : undefined}
                                        className={`flex h-12 w-full rounded-md border border-border/60 bg-background py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50 ${
                                            isRTL
                                                ? "pr-3"
                                                : "pl-3 pr-10"
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${
                                            isRTL ? "left-3" : "right-3"
                                        }`}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-5" />
                                        ) : (
                                            <Eye className="size-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div
                                className="flex items-center justify-between"
                                dir={isRTL ? "rtl" : "ltr"}
                            >
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                "remember",
                                                checked as boolean
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="text-sm font-normal text-muted-foreground cursor-pointer"
                                    >
                                        {t("auth:login.rememberMe")}
                                    </Label>
                                </div>
                                {canResetPassword && (
                                    <Link
                                        href={route("password.request")}
                                        className="text-sm text-brand-purple hover:underline"
                                    >
                                        {t("auth:login.forgotPassword")}
                                    </Link>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-12 bg-brand-purple hover:bg-brand-purple/90 text-white text-base font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing
                                    ? t("auth:login.loggingIn")
                                    : t("auth:login.logIn")}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/60"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-background px-3 text-muted-foreground">
                                    {t("auth:login.orContinueWith")}
                                </span>
                            </div>
                        </div>

                        {/* Google Sign In Button */}
                        <a
                            href="/auth/google"
                            className="w-full h-12 flex items-center justify-center gap-3 border border-border/60 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span className="text-sm font-medium text-foreground">
                                {t("auth:login.continueWithGoogle")}
                            </span>
                        </a>

                        {/* Sign Up Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                {t("auth:login.noAccount")}{" "}
                                <Link
                                    href={route("register")}
                                    className="text-brand-purple hover:underline font-medium"
                                >
                                    {t("auth:login.signUp")}
                                </Link>
                            </p>
                        </div>

                        {/* Back to Homepage */}
                        <div className="mt-4 text-center">
                            <Link
                                href="/"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ← {t("auth:login.backToHomepage")}
                            </Link>
                        </div>

                        {/* Mobile Footer Links */}
                        <div className="lg:hidden mt-6 flex justify-center gap-6 text-sm text-muted-foreground">
                            <a
                                href="#"
                                className="hover:text-foreground transition-colors"
                            >
                                {t("auth:login.privacy")}
                            </a>
                            <a
                                href="#"
                                className="hover:text-foreground transition-colors"
                            >
                                {t("auth:login.terms")}
                            </a>
                            <a
                                href="/#contact"
                                className="hover:text-foreground transition-colors"
                            >
                                {t("auth:login.contact")}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
