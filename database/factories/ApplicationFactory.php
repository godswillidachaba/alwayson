<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Application;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Application>
 */
class ApplicationFactory extends Factory
{
    protected $model = Application::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'session_token' => Str::uuid()->toString(),
            'user_id' => User::factory(),
            'full_name' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->safeEmail(),
            'ndpr_consented' => true,
            'location_lat' => fake()->latitude(),
            'location_lng' => fake()->longitude(),
            'location_address' => fake()->address(),
            'location_street' => fake()->streetAddress(),
            'location_city' => fake()->city(),
            'location_state' => 'Lagos',
            'location_country' => 'Nigeria',
            'billing_street' => null,
            'billing_city' => null,
            'billing_state' => null,
            'billing_country' => null,
            'current_step' => 1,
            'submitted_at' => now(),
            'status' => Application::STATUS_SUBMITTED,
            'building_type' => 'Residential',
            'selected_plan' => 'Masstige',
            'monthly_income' => 45_000_000,  // ₦450,000 in kobo
            'monthly_bill' => 1_200_000,     // ₦12,000 in kobo
            'monthly_generator' => 3_500_000, // ₦35,000 in kobo
            'total_load_watts' => 2500,
            'deposit_amount' => 1_360_000,   // ₦13,600 in kobo (20% of ₦68,000)
            'monthly_lease_amount' => 6_800_000, // ₦68,000 in kobo
            'is_suspended' => false,
        ];
    }
}
