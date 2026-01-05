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
            },
        },
    },

    plugins: [forms],
};
