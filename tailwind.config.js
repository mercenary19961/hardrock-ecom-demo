import defaultTheme from "tailwindcss/defaultTheme";
import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
        "./storage/framework/views/*.php",
        "./resources/views/**/*.blade.php",
        "./resources/js/**/*.tsx",
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    purple: {
                        DEFAULT: "#660ADB",
                        50: "#F3E8FF",
                        100: "#E9D5FF",
                        200: "#D8B4FE",
                        300: "#C084FC",
                        400: "#A855F7",
                        500: "#660ADB",
                        600: "#5509B8",
                        700: "#440895",
                        800: "#330672",
                        900: "#22054F",
                    },
                    orange: {
                        DEFAULT: "#FF3C2B",
                        50: "#FFF5F4",
                        100: "#FFE8E6",
                        200: "#FFCCC7",
                        300: "#FFA69D",
                        400: "#FF7268",
                        500: "#FF3C2B",
                        600: "#E62A19",
                        700: "#BF2215",
                        800: "#991B11",
                        900: "#73150D",
                    },
                    slate: "#212a38",
                },
                // shadcn/ui CSS variable colors
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },

    plugins: [forms],
};
