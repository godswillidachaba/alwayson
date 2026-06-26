<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <meta name="theme-color" content="#2563eb">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="mobile-web-app-capable" content="yes">
        <link rel="manifest" href="/manifest.json">
        <link rel="icon" href="/favicon.png" type="image/png" sizes="48x48">
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
        <link rel="canonical" href="{{ url()->current() }}">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
            <meta name="description" content="Solar-as-a-service for Nigerian homes and SMEs. No upfront cost, no diesel, no blackouts. Apply in 10 minutes, installed in 48 hours.">
            <meta property="og:title" content="{{ trim($page['component'] ?? '') ? str_replace('-', ' — ', str($page['component'])->headline()->title()) . ' - ' : '' }}{{ config('app.name') }}">
            <meta property="og:description" content="Solar-as-a-service for Nigerian homes and SMEs. No upfront cost, no diesel, no blackouts. Apply in 10 minutes, installed in 48 hours.">
            <meta property="og:image" content="{{ asset('assets/og-image-v2.jpg') }}">
            <meta property="og:image:width" content="1344">
            <meta property="og:image:height" content="768">
            <meta property="og:url" content="{{ url()->current() }}">
            <meta property="og:type" content="website">
            <meta property="og:site_name" content="AlwaysON">
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="AlwaysON — Solar in 48 hours, approved in 10 minutes">
            <meta name="twitter:description" content="Solar-as-a-service for Nigerian homes and SMEs. No upfront cost, no diesel, no blackouts.">
            <meta name="twitter:image" content="{{ asset('assets/og-image-v2.jpg') }}">
        </x-inertia::head>

        <script type="application/ld+json">
        {
            "@@context": "https://schema.org",
            "@type": "Organization",
            "name": "AlwaysON",
            "url": "{{ config('app.url') }}",
            "logo": "{{ asset('assets/logo-horizontal.png') }}",
            "description": "Solar-as-a-service for Nigerian homes and SMEs. No upfront cost, no diesel, no blackouts.",
            "areaServed": ["Lagos", "Abuja", "Port Harcourt"],
            "priceRange": "₦35,000-₦110,000",
            "sameAs": [
                "https://linkedin.com/company/alwayson"
            ]
        }
        </script>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />

        @production
            @if (file_exists(public_path('sw.js')))
                <script>
                    if ('serviceWorker' in navigator) {
                        window.addEventListener('load', () => {
                            navigator.serviceWorker.register('/sw.js');
                        });
                    }
                </script>
            @endif
        @endproduction
    </body>
</html>
