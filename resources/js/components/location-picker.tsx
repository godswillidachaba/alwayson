import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Crosshair, Loader2, SearchX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents,
    useMap,
} from 'react-leaflet';

import { useGeolocation } from '@/hooks/use-geolocation';
import { searchAddress, reverseGeocode } from '@/lib/geocoding';
import type { LocationData, LocationSuggestion } from '@/types/application';

const pinIcon = L.divIcon({
    className: '',
    html: `<svg viewBox="0 0 24 36" width="28" height="42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="hsl(221, 83%, 53%)"/><path d="M12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" fill="white" opacity="0.9"/><circle cx="12" cy="12" r="3" fill="hsl(221, 83%, 53%)"/></svg>`,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
});

const NIGERIA_CENTER: [number, number] = [9.082, 8.675];

interface LocationPickerProps {
    value: LocationData | null;
    onChange: (location: LocationData | null) => void;
}

function DraggableMarker({
    position,
    onMove,
}: {
    position: [number, number];
    onMove: (lat: number, lng: number) => void;
}) {
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;

            if (marker) {
                const { lat, lng } = marker.getLatLng();
                onMove(lat, lng);
            }
        },
    };

    return (
        <Marker
            ref={markerRef}
            position={position}
            draggable
            icon={pinIcon}
            eventHandlers={eventHandlers}
        />
    );
}

function MapClickHandler({
    onClick,
}: {
    onClick: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });

    return null;
}

function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    const prevCenterRef = useRef(center);

    useEffect(() => {
        const [lat, lng] = center;
        const [prevLat, prevLng] = prevCenterRef.current;
        prevCenterRef.current = center;

        if (lat !== prevLat || lng !== prevLng) {
            map.flyTo(center, 15, { duration: 0.5 });
        }
    }, [center, map]);

    return null;
}

export default function LocationPicker({
    value,
    onChange,
}: LocationPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [resolvingAddress, setResolvingAddress] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const {
        loading: geoLoading,
        error: geoError,
        requestLocation,
    } = useGeolocation();

    const mapPosition: [number, number] = value
        ? [value.lat, value.lng]
        : NIGERIA_CENTER;

    const handleMove = useCallback(
        async (lat: number, lng: number) => {
            onChange({
                lat,
                lng,
                formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                street: '',
                city: '',
                state: '',
                country: '',
            });

            setResolvingAddress(true);

            try {
                const address = await reverseGeocode({ lat, lng });

                if (address) {
                    onChange({
                        lat,
                        lng,
                        formattedAddress: address.formattedAddress,
                        street: address.street,
                        city: address.city,
                        state: address.state,
                        country: address.country,
                    });
                }
            } finally {
                setResolvingAddress(false);
            }
        },
        [onChange],
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;

        setSearchQuery(query);
        setSearchError(null);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);

            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setSearching(true);
            const results = await searchAddress(query);

            setSuggestions(results);
            setSearching(false);

            if (results.length === 0) {
                setSearchError(
                    'Address not found. Click the map to place your pin.',
                );
                setShowSuggestions(false);
            } else {
                setSearchError(null);
                setShowSuggestions(true);
            }
        }, 400);
    };

    const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
        setSearchQuery(suggestion.displayName);
        setShowSuggestions(false);
        setSearchError(null);
        handleMove(suggestion.lat, suggestion.lng);
    };

    const handleUseMyLocation = () => {
        requestLocation((loc) => {
            handleMove(loc.lat, loc.lng);
        });
    };

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="space-y-4">
            <div className="relative" ref={dropdownRef}>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                    <div className="relative flex-1">
                        <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search your address..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => {
                                if (suggestions.length > 0) {
                                    setShowSuggestions(true);
                                }
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent py-2 pr-3 pl-9 text-sm shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                        />
                        {searching && (
                            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={geoLoading}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted disabled:opacity-50 sm:w-auto"
                        title="Use my location"
                    >
                        {geoLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Crosshair className="h-4 w-4" />
                        )}
                        <span className="sm:inline">
                            {geoLoading ? 'Detecting...' : 'My location'}
                        </span>
                    </button>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[1000] mt-1 w-full rounded-md border border-border/60 bg-surface shadow-lg">
                        {suggestions.map((s, i) => (
                            <button
                                key={`${s.lat}-${s.lng}-${i}`}
                                type="button"
                                onClick={() => handleSelectSuggestion(s)}
                                className="flex w-full gap-2 px-3 py-2.5 text-left text-sm transition-colors first:rounded-t-md last:rounded-b-md hover:bg-muted"
                            >
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="line-clamp-2">
                                    {s.displayName}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {searchError && (
                    <div className="mt-1 flex items-center gap-2 rounded-md border border-border/60 bg-muted px-3 py-2 text-sm text-muted-foreground">
                        <SearchX className="h-4 w-4 shrink-0" />
                        <span>{searchError}</span>
                    </div>
                )}
            </div>

            {geoError && (
                <div className="rounded-lg border border-red-400/50 bg-red-50 px-4 py-3 text-sm dark:border-red-500/30 dark:bg-red-950">
                    <div className="flex items-start gap-3">
                        <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                        <div className="min-w-0 space-y-1">
                            <p className="font-medium text-red-800 dark:text-red-200">
                                Location unavailable
                            </p>
                            <p className="text-red-700 dark:text-red-300">
                                Search your address above or tap the map to
                                place your pin instead.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-0 h-[400px] overflow-hidden rounded-lg border border-border/60">
                <MapContainer
                    center={mapPosition}
                    zoom={5}
                    className="h-full w-full"
                    zoomControl={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController center={mapPosition} />
                    <DraggableMarker
                        position={mapPosition}
                        onMove={handleMove}
                    />
                    <MapClickHandler onClick={handleMove} />
                </MapContainer>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted p-3">
                {resolvingAddress ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Resolving address...
                    </div>
                ) : value ? (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 shrink-0 text-primary" />
                            <span className="font-medium">
                                {value.formattedAddress ||
                                    `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Coordinates: {value.lat.toFixed(5)},{' '}
                            {value.lng.toFixed(5)}
                            {!value.formattedAddress &&
                                ' — no address data for this location'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                            Search for an address or click on the map to place a
                            pin. You can drag the pin to adjust.
                        </p>
                        <p className="text-xs">
                            If the search doesn't find your location, just click
                            the map where you are — it works for any address.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
