<?php

namespace App\Http\Controllers;

use App\Models\SiteContent;
use Illuminate\Support\Facades\Cache;
use Inertia\Response;

class WelcomePageController extends Controller
{
    public function index(): Response
    {
        $siteContent = Cache::remember('site_content', 3600, function () {
            return SiteContent::all()
                ->keyBy('section')
                ->map(fn (SiteContent $sc) => $sc->content)
                ->toArray();
        });

        return inertia('welcome', [
            'siteContent' => $siteContent,
        ]);
    }
}
