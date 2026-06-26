<?php

namespace App\Support;

class ApplianceData
{
    /** @return array<int, array{key: string, label: string, watts: int}> */
    public static function residential(): array
    {
        return [
            ['key' => 'fridge', 'label' => 'Fridge / Freezer', 'watts' => 150],
            ['key' => 'ac', 'label' => 'Air conditioner', 'watts' => 1500],
            ['key' => 'tv', 'label' => 'TV / Home theatre', 'watts' => 150],
            ['key' => 'fan', 'label' => 'Ceiling fan', 'watts' => 75],
            ['key' => 'lights', 'label' => 'Light bulbs (per 10)', 'watts' => 100],
            ['key' => 'washing', 'label' => 'Washing machine', 'watts' => 500],
            ['key' => 'microwave', 'label' => 'Microwave', 'watts' => 1000],
            ['key' => 'iron', 'label' => 'Electric iron', 'watts' => 1000],
            ['key' => 'waterPump', 'label' => 'Water pump', 'watts' => 750],
            ['key' => 'other', 'label' => 'Other devices', 'watts' => 200],
        ];
    }

    /** @return array<int, array{key: string, label: string, watts: int}> */
    public static function commercial(): array
    {
        return [
            ['key' => 'fridge', 'label' => 'Refrigeration / Freezer', 'watts' => 500],
            ['key' => 'cctv', 'label' => 'CCTV system', 'watts' => 200],
            ['key' => 'pos', 'label' => 'POS terminal', 'watts' => 100],
            ['key' => 'ac', 'label' => 'Air conditioning unit', 'watts' => 3000],
            ['key' => 'lights', 'label' => 'Lighting', 'watts' => 500],
            ['key' => 'machinery', 'label' => 'Small machinery', 'watts' => 2000],
            ['key' => 'fan', 'label' => 'Industrial fan', 'watts' => 200],
            ['key' => 'waterPump', 'label' => 'Water pump', 'watts' => 1500],
            ['key' => 'other', 'label' => 'Other equipment', 'watts' => 500],
        ];
    }

    /** @return array<int, array{key: string, label: string, watts: int}> */
    public static function industrial(): array
    {
        return [
            ['key' => 'heavyMachine', 'label' => 'Heavy machinery', 'watts' => 5000],
            ['key' => 'cctv', 'label' => 'CCTV system', 'watts' => 500],
            ['key' => 'pos', 'label' => 'POS terminal', 'watts' => 100],
            ['key' => 'ac', 'label' => 'Industrial A/C', 'watts' => 5000],
            ['key' => 'lights', 'label' => 'Workshop lighting', 'watts' => 1000],
            ['key' => 'refrigeration', 'label' => 'Industrial refrigeration', 'watts' => 3000],
            ['key' => 'waterPump', 'label' => 'Industrial water pump', 'watts' => 3000],
            ['key' => 'compressor', 'label' => 'Air compressor', 'watts' => 2000],
            ['key' => 'other', 'label' => 'Other equipment', 'watts' => 1000],
        ];
    }

    /** @return array<int, array{key: string, label: string, watts: int}> */
    public static function forBuildingType(string $buildingType): array
    {
        return match ($buildingType) {
            'Commercial' => self::commercial(),
            'Industrial' => self::industrial(),
            default => self::residential(),
        };
    }

    /** @return array{key: string, label: string, watts: int}|null */
    public static function find(string $key, string $buildingType): ?array
    {
        $list = self::forBuildingType($buildingType);

        foreach ($list as $item) {
            if ($item['key'] === $key) {
                return $item;
            }
        }

        return null;
    }
}
