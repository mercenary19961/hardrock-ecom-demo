import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split React and related packages
                    'vendor-react': ['react', 'react-dom'],
                    // Split Inertia
                    'vendor-inertia': ['@inertiajs/react'],
                    // Split i18n
                    'vendor-i18n': ['i18next', 'react-i18next'],
                    // Split UI libraries
                    'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge', 'class-variance-authority'],
                },
            },
        },
        chunkSizeWarningLimit: 600,
    },
});
