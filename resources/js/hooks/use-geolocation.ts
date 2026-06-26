import { useCallback, useState } from 'react';
import type { GeoLocation } from '@/types/application';

type GeolocationState = {
    location: GeoLocation | null;
    loading: boolean;
    error: string | null;
};

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        location: null,
        loading: false,
        error: null,
    });

    const requestLocation = useCallback(
        (onSuccess?: (location: GeoLocation) => void) => {
            if (!navigator.geolocation) {
                setState({
                    location: null,
                    loading: false,
                    error: 'Geolocation not supported',
                });

                return;
            }

            setState((prev) => ({ ...prev, loading: true, error: null }));

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc: GeoLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    setState({
                        location: loc,
                        loading: false,
                        error: null,
                    });

                    onSuccess?.(loc);
                },
                (err) => {
                    setState({
                        location: null,
                        loading: false,
                        error: err.message,
                    });
                },
                {
                    enableHighAccuracy: false,
                    timeout: 30000,
                    maximumAge: 60000,
                },
            );
        },
        [],
    );

    return { ...state, requestLocation };
}
