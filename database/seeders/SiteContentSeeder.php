<?php

namespace Database\Seeders;

use App\Models\SiteContent;
use Illuminate\Database\Seeder;

class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $sections = [
            'hero' => [
                'badge' => 'Now serving Lagos, Abuja & Port Harcourt',
                'headline1' => '10 minutes to approval.',
                'headline2' => '48 hours to working solar.',
                'description' => 'AlwaysON installs and maintains a solar system on your roof for one fixed monthly fee. No upfront cost, no diesel, no blackouts.',
                'deposit' => 'Indicative deposit from ₦75,000. Collected only after bank approval — not at sign-up.',
                'buttons' => [
                    ['text' => 'Apply now', 'href' => '/apply'],
                    ['text' => 'See how it works', 'href' => '/#how'],
                ],
                'liveOutput' => "Today's output",
            ],
            'stats' => [
                'items' => [
                    ['label' => 'Upfront cost', 'value' => 0, 'prefix' => '₦', 'suffix' => ''],
                    ['label' => 'Approval time', 'value' => 10, 'prefix' => '', 'suffix' => 'min'],
                    ['label' => 'Install time', 'value' => 48, 'prefix' => '', 'suffix' => 'hrs'],
                    ['label' => 'Panel warranty', 'value' => 25, 'prefix' => '', 'suffix' => 'yr'],
                ],
            ],
            'how_it_works' => [
                'label' => 'How it works',
                'title' => 'Four steps from apply to lights on.',
                'steps' => [
                    ['icon' => 'sun', 'title' => 'Apply in 10 minutes', 'description' => 'Tell us about your home or business, your appliances, and your current power spend.'],
                    ['icon' => 'check', 'title' => 'Get approved instantly', 'description' => 'Credit decision in 10 minutes via our financing partner. No paperwork shuffle.'],
                    ['icon' => 'zap', 'title' => 'Installed in 48 hours', 'description' => 'Our certified engineers install panels, inverter and battery at your address.'],
                    ['icon' => 'clock', 'title' => 'Monitor & relax', 'description' => 'Track output, savings and battery health from any browser. We handle the rest.'],
                ],
            ],
            'pricing' => [
                'label' => 'Indicative pricing',
                'title' => 'A system that fits your load.',
                'description' => 'Final pricing confirmed after the validation call. Deposit is collected only once your application is approved.',
                'plans' => [
                    ['name' => 'Starter', 'price' => '₦35,000/mo', 'deposit' => 'Deposit from ₦75,000', 'badge' => null, 'features' => ['3 × 190Wp panels', '3kW inverter', '5kWh battery', 'Typical load 0–6 kWh/day', 'Full install, maintenance & monitoring']],
                    ['name' => 'Masstige', 'price' => '₦68,000/mo', 'deposit' => 'Deposit from ₦150,000', 'badge' => 'Most popular', 'features' => ['4 × 630Wp panels', '5kW inverter', '10kWh battery', 'Typical load 6–12 kWh/day', 'Full install, maintenance & monitoring']],
                    ['name' => 'Premium', 'price' => '₦110,000/mo', 'deposit' => 'Deposit from ₦250,000', 'badge' => null, 'features' => ['6 × 630Wp panels', '7.5kW inverter', '15kWh battery', 'Typical load 12–25 kWh/day', 'Full install, maintenance & monitoring']],
                ],
            ],
            'features' => [
                'items' => [
                    ['icon' => 'zap', 'title' => 'Tier-1 hardware', 'description' => 'European inverters, lithium batteries, and 25-year panels — engineered for Nigerian conditions.'],
                    ['icon' => 'check', 'title' => 'Full warranty cover', 'description' => 'We own and maintain the system for the lease period. You only ever pay the monthly fee.'],
                    ['icon' => 'clock', 'title' => 'Live monitoring', 'description' => 'Performance dashboard, fault alerts, and a 24/7 support team backing every installation.'],
                ],
            ],
            'testimonials' => [
                'label' => 'Testimonials',
                'title' => 'What our customers say',
                'items' => [
                    ['quote' => 'We were approved in seven minutes. Engineers arrived the next morning.', 'name' => 'Tunde', 'location' => 'Lekki Phase 1, Lagos'],
                    ['quote' => 'Finally — reliable power without the generator noise. My productivity has doubled.', 'name' => 'Ngozi', 'location' => 'GRA, Port Harcourt'],
                    ['quote' => 'The monitoring dashboard is a game changer. I can see exactly what my system is doing.', 'name' => 'Segun', 'location' => 'Wuse 2, Abuja'],
                ],
            ],
            'faq' => [
                'title' => 'Common questions',
                'items' => [
                    ['question' => 'When do I pay the deposit?', 'answer' => "The deposit is collected only after your application has been approved by our financing partner. You won't pay anything at the time of applying."],
                    ['question' => 'What if I move house?', 'answer' => 'You can transfer your solar system to your new address. Our team will handle the de-installation and re-installation. Terms and conditions apply.'],
                    ['question' => 'Who owns the equipment?', 'answer' => 'AlwaysON retains ownership of the solar equipment for the duration of the lease period. This allows us to offer you zero upfront cost and full maintenance coverage.'],
                    ['question' => 'What happens after the lease?', 'answer' => 'At the end of the lease term, you have the option to renew, upgrade to a newer system, or purchase the equipment at fair market value.'],
                ],
            ],
            'cta' => [
                'headline' => 'Ready to never see a blackout again?',
                'description' => 'Get your free quote in 10 minutes. No commitment, no upfront payment.',
                'buttons' => [
                    ['text' => 'Get your quote', 'href' => '/apply'],
                    ['text' => 'See how it works', 'href' => '/#how'],
                ],
            ],
            'social' => [
                'links' => [
                    ['platform' => 'LinkedIn', 'url' => '', 'visible' => false],
                    ['platform' => 'Instagram', 'url' => '', 'visible' => false],
                ],
            ],
        ];

        foreach ($sections as $section => $content) {
            SiteContent::updateOrCreate(
                ['section' => $section],
                ['content' => $content],
            );
        }
    }
}
