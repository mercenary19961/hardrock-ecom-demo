import "../css/app.css";
import "./bootstrap";
import "./i18n";

import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { LanguageProvider } from "@/contexts/LanguageContext";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const pages = import.meta.glob("./Pages/**/*.tsx", { eager: true });
        return pages[`./Pages/${name}.tsx`];
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <LanguageProvider>
                <App {...props} />
            </LanguageProvider>
        );
    },
    progress: false,
});
