import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';

interface Location {
    lat: number;
    lng: number;
    label?: string;
}

export default function TicketMap({
    locations,
    className,
    height = 200,
}: {
    locations: Location[];
    className?: string;
    height?: number;
}) {
    if (locations.length === 0) {
        return null;
    }

    if (locations.length === 1) {
        const { lat, lng } = locations[0]!;

        return (
            <MapContainer
                center={[lat, lng]}
                zoom={15}
                scrollWheelZoom={false}
                className={`w-full rounded-lg border ${className ?? ''}`}
                style={{ height }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]}>
                    {locations[0]!.label && (
                        <Tooltip permanent direction="top" offset={[0, -10]}>
                            {locations[0]!.label}
                        </Tooltip>
                    )}
                </Marker>
            </MapContainer>
        );
    }

    const centerLat =
        locations.reduce((s, l) => s + l.lat, 0) / locations.length;
    const centerLng =
        locations.reduce((s, l) => s + l.lng, 0) / locations.length;

    return (
        <MapContainer
            center={[centerLat, centerLng]}
            zoom={12}
            scrollWheelZoom={false}
            className={`w-full rounded-lg border ${className ?? ''}`}
            style={{ height }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((loc, i) => (
                <Marker key={i} position={[loc.lat, loc.lng]}>
                    {loc.label && (
                        <Tooltip direction="top" offset={[0, -10]}>
                            {loc.label}
                        </Tooltip>
                    )}
                </Marker>
            ))}
        </MapContainer>
    );
}

export function LocationPin({ lat, lng }: { lat: number; lng: number }) {
    return (
        <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
            <MapPin className="size-3.5" />
            Open in Google Maps
        </a>
    );
}
