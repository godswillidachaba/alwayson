import type {
    Address,
    GeoLocation,
    LocationSuggestion,
} from '@/types/application';

const MAPBOX_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

function getToken(): string {
    return import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '';
}

export async function searchAddress(
    query: string,
): Promise<LocationSuggestion[]> {
    if (!query.trim() || !getToken()) {
        return [];
    }

    const params = new URLSearchParams({
        access_token: getToken(),
        limit: '5',
        country: 'NG',
        language: 'en',
        types: 'address,place,locality,neighborhood,district,region',
    });

    const res = await fetch(
        `${MAPBOX_BASE}/${encodeURIComponent(query)}.json?${params}`,
    );

    if (!res.ok) {
        return [];
    }

    const data = await res.json();

    return (data.features ?? []).map(
        (f: { place_name: string; center: [number, number] }) => ({
            displayName: f.place_name,
            lat: f.center[1],
            lng: f.center[0],
        }),
    );
}

export async function reverseGeocode({
    lat,
    lng,
}: GeoLocation): Promise<Address | null> {
    if (!getToken()) {
        return null;
    }

    const params = new URLSearchParams({
        access_token: getToken(),
        language: 'en',
        types: 'address,place,locality,neighborhood,district,region,country',
    });

    const res = await fetch(`${MAPBOX_BASE}/${lng},${lat}.json?${params}`);

    if (!res.ok) {
        return null;
    }

    const data = await res.json();
    const feature = data.features?.[0];

    if (!feature) {
        return null;
    }

    const context = feature.context ?? [];
    const getContext = (idPrefix: string): string =>
        context.find((c: { id: string; text: string }) =>
            c.id.startsWith(idPrefix),
        )?.text ?? '';

    return {
        formattedAddress: feature.place_name ?? '',
        street: feature.address
            ? `${feature.address} ${feature.text ?? ''}`.trim()
            : (feature.text ?? ''),
        city:
            getContext('place') ||
            getContext('district') ||
            getContext('locality'),
        state: getContext('region'),
        country: getContext('country'),
    };
}
