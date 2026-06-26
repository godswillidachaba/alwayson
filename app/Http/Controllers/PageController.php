<?php

namespace App\Http\Controllers;

use Inertia\Response;

class PageController extends Controller
{
    public function about(): Response
    {
        return inertia('about');
    }

    public function privacy(): Response
    {
        return inertia('privacy');
    }

    public function terms(): Response
    {
        return inertia('terms');
    }
}
