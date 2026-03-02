import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getPetsNearby } from '../../services/petService';
import type { PetMapData } from '../../services/petService';

// Fallback padrão: Uma pata ou silhueta (usado quando a imagem quebra/não existe)
const FALLBACK_IMAGE_URL = 'https://ui-avatars.com/api/?name=?&background=FF9D00&color=fff&rounded=true&size=128';

// Coordenada Inicial padrão (Ex: Latitude -21.135639, Longitude -41.679051)
const DEFAULT_CENTER: [number, number] = [-41.679051, -21.135639];
const DEFAULT_ZOOM = 14;

export default function HomeMap() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<{ [petId: string]: maplibregl.Marker }>({});

    // Controle de loading e debounce
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimerRef = useRef<number | null>(null);

    // Variáveis MapTiler
    const API_KEY = import.meta.env.VITE_MAPTILER_KEY;

    const fetchPetsInView = useCallback(async () => {
        if (!map.current) return;

        setIsLoading(true);
        try {
            const center = map.current.getCenter();
            // Raio de 1km fixo conforme requisito (ou poderia variar com zoom)
            const petsFound = await getPetsNearby(center.lat, center.lng, 1000);

            // Só atualiza os pets que tem localização válida
            const validPets = petsFound.filter(p => p.lostLatitude != null && p.lostLongitude != null);
            updateMarkers(validPets);

        } catch (error) {
            console.error("Erro ao carregar pets no mapa:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleCameraMove = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Aplica o debounce de 600ms para requisições de API durante movimento
        debounceTimerRef.current = window.setTimeout(() => {
            fetchPetsInView();
        }, 600);
    }, [fetchPetsInView]);

    useEffect(() => {
        if (map.current) return; // Se mapa já instanciado, não refazer
        if (!mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${API_KEY}`,
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            attributionControl: false // opcional: limpar poluição visual de copy
        });

        // Controles de Navegação (Zoom in/out, rotação base)
        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Escutando eventos para buscar API
        map.current.on('moveend', handleCameraMove);
        map.current.on('zoomend', handleCameraMove);

        // Fazemos uma primeira busca logo ao carregar o mapa (pois moveend não dispara no mount)
        map.current.on('load', () => {
            fetchPetsInView();
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
            // Limpa markers criados
            Object.values(markersRef.current).forEach(m => m.remove());
            markersRef.current = {};
        };
    }, [API_KEY, handleCameraMove, fetchPetsInView]);

    /**
     * Sincroniza o array de pets (banco local) com os objetos 'Marker' desenhados no mapa.
     * Nós reciclamos/removemos apenas os que entraram/saíram da viewport.
     */
    const updateMarkers = (newPets: PetMapData[]) => {
        if (!map.current) return;

        // Lista de IDs recebidos desta vez
        const newPetIds = new Set(newPets.map(p => p.id));

        // 1. Remover marcadores que *não* estão mais na resposta atual
        Object.keys(markersRef.current).forEach(existingPetId => {
            if (!newPetIds.has(existingPetId)) {
                markersRef.current[existingPetId].remove();
                delete markersRef.current[existingPetId];
            }
        });

        // 2. Adicionar ou atualizar novos
        newPets.forEach((pet) => {
            // Se já tem no mapa, pula criação
            if (markersRef.current[pet.id]) return;

            // Criar Elemento DOM Customizado (A bolinha com a Imagem do Pet)
            const el = document.createElement('div');
            // Nota: O maplibre-gl cuida do posicionamento via transform XY.
            // Para não haver tremedeira, evitamos classes utilitárias de "transform" e "hover:scale" no container principal.
            el.className = 'pet-marker shadow-lg border-2 border-orange-400 bg-white rounded-full overflow-hidden cursor-pointer w-12 h-12 flex items-center justify-center relative cursor-pointer group';

            // Escolher foto principal (backend retorna signed URL)
            const mainPhotoUrl = pet.imageUrl || FALLBACK_IMAGE_URL;

            // Fallback de onError nativo com createElement p/ img:
            const imgEl = document.createElement('img');
            imgEl.src = mainPhotoUrl;
            imgEl.className = 'w-full h-full object-cover';
            imgEl.onerror = () => { imgEl.src = FALLBACK_IMAGE_URL; };
            el.appendChild(imgEl);

            // Adiciona badge de Status (a API só retorna pets LOST)
            const badgeEl = document.createElement('div');
            badgeEl.className = 'absolute -bottom-1 -right-1 min-w-[14px] h-[14px] rounded-full border-white border text-[8px] font-bold text-white flex items-center justify-center px-[4px] bg-red-500';
            el.appendChild(badgeEl);

            // Criar Popup para clique (Exibe info básica html styling Tailwind/CSS via string)
            const popupHtml = `
                <div class="p-1 min-w-[220px]">
                    <img src="${mainPhotoUrl}" class="w-full h-32 object-cover rounded-md mb-2 shadow-sm" onerror="this.src='${FALLBACK_IMAGE_URL}'" />
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

            // Adicionar ao Mapa
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
            {/* O Container que a Lib atrela o canvas */}
            <div ref={mapContainer} className="relative w-full flex-1" />

            {/* Overlay de Loading Visual discreto */}
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
