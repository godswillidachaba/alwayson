<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@alwayson.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_SUPER_ADMIN,
            'email_verified_at' => now(),
        ]);

        User::factory()->create([
            'name' => 'Operations User',
            'email' => 'ops@alwayson.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_OPERATIONS,
            'email_verified_at' => now(),
        ]);

        User::factory()->create([
            'name' => 'Installer User',
            'email' => 'installer@alwayson.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_INSTALLER,
            'email_verified_at' => now(),
        ]);
    }
}
