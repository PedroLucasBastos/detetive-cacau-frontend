import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getPetsNearby } from '../../services/petService';
import type { PetMapData } from '../../services/petService';
import { useUserLocation } from '../../hooks/useUserLocation';

// Coordenada Inicial padrão
const DEFAULT_CENTER: [number, number] = [-41.679051, -21.135639];
const DEFAULT_ZOOM = 14;

// ── Otimização: distância mínima em metros para refazer o fetch ──────────────
const MIN_DISTANCE_METERS = 200;
const DEBOUNCE_MS = 1500;
const SEARCH_RADIUS = 1000;

/**
 * Calcula distância aproximada (Haversine simplificado) entre dois pontos em metros.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HomeMap() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<{ [petId: string]: maplibregl.Marker }>({});

    const { location: userLocation } = useUserLocation();
    const hasCenteredOnUser = useRef(false);

    const [isLoading, setIsLoading] = useState(false);
    const debounceTimerRef = useRef<number | null>(null);

    // ── Otimização: guardar último centro buscado para evitar re-fetch ────
    const lastFetchCenter = useRef<{ lat: number; lng: number } | null>(null);

    const API_KEY = import.meta.env.VITE_MAPTILER_KEY;

    // ── Refs para callbacks estáveis (evita remontagem do useEffect) ──────
    const fetchPetsRef = useRef<() => void>(() => { });

    fetchPetsRef.current = async () => {
        if (!map.current) return;

        const center = map.current.getCenter();

        // Guard: se o centro não mudou significativamente, não refaz a busca
        if (lastFetchCenter.current) {
            const dist = haversineDistance(
                lastFetchCenter.current.lat,
                lastFetchCenter.current.lng,
                center.lat,
                center.lng
            );
            if (dist < MIN_DISTANCE_METERS) return;
        }

        lastFetchCenter.current = { lat: center.lat, lng: center.lng };
        setIsLoading(true);

        try {
            const petsFound = await getPetsNearby(center.lat, center.lng, SEARCH_RADIUS);
            const validPets = petsFound.filter(p => p.lostLatitude != null && p.lostLongitude != null);
            updateMarkers(validPets);
        } catch (error) {
            console.error("Erro ao carregar pets no mapa:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Inicialização do mapa (roda UMA VEZ) ─────────────────────────────
    useEffect(() => {
        if (map.current) return;
        if (!mapContainer.current) return;

        const initialCenter = userLocation || DEFAULT_CENTER;
        if (userLocation) {
            hasCenteredOnUser.current = true;
        }

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${API_KEY}`,
            center: initialCenter,
            zoom: DEFAULT_ZOOM,
            attributionControl: false,
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Apenas 'moveend' (zoom já dispara moveend, não precisa de zoomend)
        map.current.on('moveend', () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = window.setTimeout(() => {
                fetchPetsRef.current();
            }, DEBOUNCE_MS);
        });

        // Busca inicial ao carregar o mapa
        map.current.on('load', () => {
            fetchPetsRef.current();
        });

        // Cleanup
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            Object.values(markersRef.current).forEach(m => m.remove());
            markersRef.current = {};
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Atualização suave do centro quando a localização chegar ───────────
    useEffect(() => {
        if (map.current && userLocation && !hasCenteredOnUser.current) {
            hasCenteredOnUser.current = true;
            map.current.flyTo({
                center: userLocation,
                zoom: DEFAULT_ZOOM,
                essential: true,
                duration: 2000 // Transição suave para a localização do usuário
            });
        }
    }, [userLocation]);

    /**
     * Sincroniza os marcadores no mapa com os pets recebidos da API.
     * Recicla marcadores existentes e só cria novos quando necessário.
     */
    const updateMarkers = (newPets: PetMapData[]) => {
        if (!map.current) return;

        const newPetIds = new Set(newPets.map(p => p.id));

        // 1. Remover marcadores que não estão mais na resposta
        Object.keys(markersRef.current).forEach(existingPetId => {
            if (!newPetIds.has(existingPetId)) {
                markersRef.current[existingPetId].remove();
                delete markersRef.current[existingPetId];
            }
        });

        // 2. Adicionar novos (pula se já existe)
        newPets.forEach((pet) => {
            if (markersRef.current[pet.id]) return;

            const el = document.createElement('div');
            el.className = 'pet-marker shadow-lg border-2 border-orange-400 bg-white rounded-full overflow-hidden cursor-pointer w-12 h-12 flex items-center justify-center relative group';

            const mainPhotoUrl = pet.imageUrl || null;

            if (mainPhotoUrl) {
                const imgEl = document.createElement('img');
                imgEl.src = mainPhotoUrl;
                imgEl.alt = pet.name;
                imgEl.className = 'w-full h-full object-cover';
                imgEl.onerror = () => {
                    imgEl.remove();
                    const fallback = document.createElement('span');
                    fallback.className = 'text-2xl';
                    fallback.textContent = pet.species === 'Cachorro' ? '🐶' : pet.species === 'Gato' ? '🐱' : '🐾';
                    el.appendChild(fallback);
                };
                el.appendChild(imgEl);
            } else {
                const emojiEl = document.createElement('span');
                emojiEl.className = 'text-2xl';
                emojiEl.textContent = pet.species === 'Cachorro' ? '🐶' : pet.species === 'Gato' ? '🐱' : '🐾';
                el.appendChild(emojiEl);
            }

            // Badge de status LOST
            const badgeEl = document.createElement('div');
            badgeEl.className = 'absolute -bottom-1 -right-1 min-w-[14px] h-[14px] rounded-full border-white border text-[8px] font-bold text-white flex items-center justify-center px-[4px] bg-red-500';
            el.appendChild(badgeEl);

            // Popup
            const petEmoji = pet.species === 'Cachorro' ? '🐶' : pet.species === 'Gato' ? '🐱' : '🐾';
            const photoSection = mainPhotoUrl
                ? `<img src="${mainPhotoUrl}" class="w-full h-32 object-cover rounded-md mb-2 shadow-sm" onerror="this.style.display='none'" />`
                : `<div class="w-full h-32 rounded-md mb-2 shadow-sm bg-orange-50 flex items-center justify-center text-5xl">${petEmoji}</div>`;

            const popupHtml = `
                <div class="p-1 min-w-[220px]">
                    ${photoSection}
                    <h3 class="font-bold text-gray-800 text-lg leading-tight truncate px-1">${pet.name}</h3>
                    <div class="px-1 text-xs text-gray-500 space-y-1.5 mt-1.5 font-medium">
                        <p>${pet.species} • ${pet.sex} • ${pet.color}</p>
                        ${pet.tutorName ? `<p>🐾 Tutor: <b class="text-gray-700">${pet.tutorName}</b></p>` : ''}
                        ${pet.tutorPhone ? `<p>📞 <a href="tel:${pet.tutorPhone}" class="text-orange-600 underline font-semibold">${pet.tutorPhone}</a></p>` : ''}
                        ${pet.lostAt ? `<p>📅 Perdido em: ${new Date(pet.lostAt).toLocaleDateString('pt-BR')}</p>` : ''}
                    </div>
                </div>
            `;
            const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHtml);

            const newMarker = new maplibregl.Marker({ element: el })
                .setLngLat([pet.lostLongitude as number, pet.lostLatitude as number])
                .setPopup(popup);

            if (map.current) {
                newMarker.addTo(map.current);
            }

            markersRef.current[pet.id] = newMarker;
        });
    };

    return (
        <div className="absolute inset-0 w-full h-full flex flex-col">
            <div ref={mapContainer} className="relative w-full flex-1" />

            {isLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md z-10 font-bold text-orange-600 text-sm flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Buscando animais...
                </div>
            )}
        </div>
    );
}
