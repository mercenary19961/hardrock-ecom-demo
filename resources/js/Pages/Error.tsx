import { Link, Head } from "@inertiajs/react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useTranslation } from "react-i18next";
import { Home, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/Components/ui";

interface Props {
    status: number;
    message?: string;
}

export default function Error({ status, message }: Props) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

    const title = {
        503: t("common:errors.503.title", "Service Unavailable"),
        500: t("common:errors.500.title", "Server Error"),
        404: t("common:errors.404.title", "Page Not Found"),
        403: t("common:errors.403.title", "Forbidden"),
    }[status] || t("common:errors.default.title", "Error");

    const description = {
        503: t(
            "common:errors.503.description",
            "Sorry, we are doing some maintenance. Please check back soon."
        ),
        500: t(
            "common:errors.500.description",
            "Whoops, something went wrong on our servers."
        ),
        404: t(
            "common:errors.404.description",
            "Sorry, the page you are looking for could not be found."
        ),
        403: t(
            "common:errors.403.description",
            "Sorry, you are forbidden from accessing this page."
        ),
    }[status] ||
        message ||
        t("common:errors.default.description", "An unexpected error occurred.");

    return (
        <>
            <Head title={`${status} - ${title}`} />
            <div
                className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4"
                dir={isRTL ? "rtl" : "ltr"}
            >
                <div className="max-w-2xl w-full text-center">
                    {/* Lottie Animation */}
                    <div className="w-full max-w-md mx-auto mb-8">
                        <DotLottieReact
                            src="https://lottie.host/faef78fe-e3d0-4f51-bc4e-7901925d464b/PE8Zph2ch6.lottie"
                            loop
                            autoplay
                            className="w-full h-auto"
                        />
                    </div>

                    {/* Error Code */}
                    <h1 className="text-7xl font-bold text-purple-600 mb-4">
                        {status}
                    </h1>

                    {/* Title */}
                    <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
                        {title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 mb-8 text-lg">{description}</p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("common:errors.goBack", "Go Back")}
                        </Button>

                        <Link href="/">
                            <Button className="gap-2 w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
                                <Home className="h-4 w-4" />
                                {t("common:errors.goHome", "Go Home")}
                            </Button>
                        </Link>

                        {status >= 500 && (
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                {t("common:errors.tryAgain", "Try Again")}
                            </Button>
                        )}
                    </div>

                    {/* Footer */}
                    <p className="mt-12 text-sm text-gray-500">
                        {t(
                            "common:errors.needHelp",
                            "Need help? Contact our support team."
                        )}
                    </p>
                </div>
            </div>
        </>
    );
}
