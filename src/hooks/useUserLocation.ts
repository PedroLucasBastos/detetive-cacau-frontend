import { useState, useEffect, useRef } from 'react';

export function useUserLocation() {
    const [location, setLocation] = useState<[number, number] | null>(null);
    const hasRequested = useRef(false);

    useEffect(() => {
        if (hasRequested.current) return;
        hasRequested.current = true;

        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation([position.coords.longitude, position.coords.latitude]);
            },
            () => {
                // Erro ignorado silenciosamente conforme as regras (fallback para centro padrão)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    }, []);

    return { location };
}
