import { VitePWA } from 'vite-plugin-pwa';
import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            publicDirectory: 'public_html',
            fonts: [
                bunny('Inter', {
                    weights: [400, 500, 600, 700],
                }),
                bunny('Sora', {
                    weights: [500, 600, 700],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.png', 'icons/*.png'],
            manifest: {
                name: 'AlwaysON — Solar in 48 hours',
                short_name: 'AlwaysON',
                description:
                    'Solar-as-a-service for Nigerian homes and SMEs. No upfront cost, no diesel, no blackouts.',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                background_color: '#ffffff',
                theme_color: '#2563eb',
                orientation: 'portrait-primary',
                icons: [
                    {
                        src: '/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,woff,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^\/(?!build\/|api\/|payments\/|esign\/|storage\/).*$/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pages',
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: 7 * 24 * 60 * 60,
                            },
                            networkTimeoutSeconds: 5,
                        },
                    },
                ],
                navigateFallback: '/offline.html',
                navigateFallbackDenylist: [/\/api\//, /\/payments\//, /\/esign\//],
            },
            outDir: path.resolve(__dirname, 'public_html'),
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('leaflet') || id.includes('react-leaflet')) {
                        return 'vendor-leaflet';
                    }
                    if (id.includes('recharts')) {
                        return 'vendor-recharts';
                    }
                    if (id.includes('framer-motion')) {
                        return 'vendor-framer';
                    }
                },
            },
        },
    },
});
