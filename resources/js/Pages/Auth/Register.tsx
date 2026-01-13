import { Head, Link, useForm } from "@inertiajs/react";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/Components/ui/Label";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function Register() {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <>
            <Head title={t("auth:register.title")} />
            <div className="min-h-screen grid lg:grid-cols-2" dir="ltr">
                {/* Left Panel - Registration Form */}
                <div className="flex flex-col justify-center bg-background px-4 py-6 lg:px-8 order-2 lg:order-1">
                    <div className="mx-auto w-full max-w-[420px]">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-6">
                            <img
                                src="/images/logo-title-2.webp"
                                alt="HardRock"
                                className="h-10 mx-auto mb-3"
                            />
                            <h1 className="text-2xl font-bold text-foreground">
                                {t("auth:register.createAccount")}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("auth:register.fillDetails")}
                            </p>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-3 lg:space-y-4"
                        >
                            {/* Name Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name">
                                    {t("auth:register.fullName")}
                                </Label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder={t(
                                        "auth:register.namePlaceholder"
                                    )}
                                    autoComplete="name"
                                    autoFocus
                                    required
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    className="flex h-11 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email">
                                    {t("auth:register.email")}
                                </Label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder={t(
                                        "auth:register.emailPlaceholder"
                                    )}
                                    autoComplete="email"
                                    required
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    className="flex h-11 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password">
                                    {t("auth:register.password")}
                                </Label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        required
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        className="flex h-11 w-full rounded-md border border-border/60 bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
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
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation">
                                    {t("auth:register.confirmPassword")}
                                </Label>
                                <div className="relative">
                                    <input
                                        id="password_confirmation"
                                        type={
                                            showPasswordConfirmation
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        required
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData(
                                                "password_confirmation",
                                                e.target.value
                                            )
                                        }
                                        className="flex h-11 w-full rounded-md border border-border/60 bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPasswordConfirmation(
                                                !showPasswordConfirmation
                                            )
                                        }
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
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-11 bg-brand-purple hover:bg-brand-purple/90 text-white text-base font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing
                                    ? t("auth:register.creatingAccount")
                                    : t("auth:register.signUp")}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/60"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-background px-3 text-muted-foreground">
                                    {t("auth:register.orContinueWith")}
                                </span>
                            </div>
                        </div>

                        {/* Google Sign In Button */}
                        <a
                            href="/auth/google"
                            className="w-full h-11 flex items-center justify-center gap-3 border border-border/60 rounded-md hover:bg-gray-50 transition-colors"
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
                                {t("auth:register.continueWithGoogle")}
                            </span>
                        </a>

                        {/* Already have account Link */}
                        <div className="mt-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                {t("auth:register.alreadyHaveAccount")}{" "}
                                <Link
                                    href={route("login")}
                                    className="text-brand-purple hover:underline font-medium"
                                >
                                    {t("auth:register.logIn")}
                                </Link>
                            </p>
                        </div>

                        {/* Back to Homepage */}
                        <div className="mt-3 text-center">
                            <Link
                                href="/"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ← {t("auth:register.backToHomepage")}
                            </Link>
                        </div>

                        {/* Mobile Footer Links */}
                        <div className="lg:hidden mt-4 flex justify-center gap-6 text-sm text-muted-foreground">
                            <a
                                href="#"
                                className="hover:text-foreground transition-colors"
                            >
                                {t("auth:register.privacy")}
                            </a>
                            <a
                                href="#"
                                className="hover:text-foreground transition-colors"
                            >
                                {t("auth:register.terms")}
                            </a>
                            <a
                                href="/#contact"
                                className="hover:text-foreground transition-colors"
                            >
                                {t("auth:register.contact")}
                            </a>
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
                            src="/images/logo-title-2.webp"
                            alt="HardRock"
                            className="h-10 brightness-0 invert mb-6"
                        />
                        <h2 className="text-white text-3xl font-bold text-center mb-3">
                            {t("auth:register.joinHardrock")}
                        </h2>
                        <p className="text-white/80 text-base text-center max-w-sm">
                            {t("auth:register.joinDescription")}
                        </p>
                    </div>

                    {/* Footer Links */}
                    <div className="p-6 relative z-10">
                        <div className="flex justify-center gap-6 text-white/60 text-sm">
                            <a
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                {t("auth:register.privacyPolicy")}
                            </a>
                            <a
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                {t("auth:register.termsOfService")}
                            </a>
                            <a
                                href="/#contact"
                                className="hover:text-white transition-colors"
                            >
                                {t("auth:register.contact")}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
