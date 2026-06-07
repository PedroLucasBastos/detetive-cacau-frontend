import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { generateCircleGeoJSON } from '../../utils/mapGeometry';
import './PetCampaignMap.css';

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * Zoom fixo calibrado para mostrar ~3km de região ao redor do pet,
 * deixando o círculo de 2km confortavelmente visível.
 */
const CAMPAIGN_MAP_ZOOM = 13;

// IDs internos das camadas MapLibre (evita colisão com HomeMap)
const SOURCE_ID = 'campaign-radius-source';
const FILL_LAYER_ID = 'campaign-radius-fill';
const LINE_LAYER_ID = 'campaign-radius-line';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PetCampaignMapProps {
    /** Latitude do pet. Null = sem localização cadastrada. */
    latitude: number | null;
    /** Longitude do pet. Null = sem localização cadastrada. */
    longitude: number | null;
    /**
     * Raio da campanha em metros.
     * Default: 2000 (2km).
     * Preparado para receber múltiplos raios no futuro.
     */
    radiusMeters?: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

function PetCampaignMap({
    latitude,
    longitude,
    radiusMeters = 2000,
}: PetCampaignMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);

    const API_KEY = import.meta.env.VITE_MAPTILER_KEY;

    // ── Estado: sem localização ───────────────────────────────────────────────
    if (latitude === null || longitude === null) {
        return (
            <div className="pet-campaign-map pet-campaign-map--empty" aria-label="Mapa indisponível">
                <span className="pet-campaign-map__empty-icon" aria-hidden="true">📍</span>
                <p className="pet-campaign-map__empty-title">Localização não cadastrada</p>
                <p className="pet-campaign-map__empty-subtitle">
                    Cadastre a última localização do pet para visualizar o mapa e o alcance da campanha.
                </p>
            </div>
        );
    }

    return (
        <div className="pet-campaign-map" aria-label="Mapa de alcance da campanha">
            <MapInstance
                mapContainer={mapContainer}
                map={map}
                markerRef={markerRef}
                latitude={latitude}
                longitude={longitude}
                radiusMeters={radiusMeters}
                apiKey={API_KEY}
            />
        </div>
    );
}

// ─── Sub-componente: instância real do mapa ───────────────────────────────────
// Separado para evitar que o hook useEffect rode quando latitude/longitude
// são null (o componente pai retorna early nesse caso).

interface MapInstanceProps {
    mapContainer: React.RefObject<HTMLDivElement | null>;
    map: React.MutableRefObject<maplibregl.Map | null>;
    markerRef: React.MutableRefObject<maplibregl.Marker | null>;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    apiKey: string;
}

function MapInstance({
    mapContainer,
    map,
    markerRef,
    latitude,
    longitude,
    radiusMeters,
    apiKey,
}: MapInstanceProps) {
    useEffect(() => {
        if (map.current) return;
        if (!mapContainer.current) return;

        // ── Inicializar mapa centralizado no pet, zoom fixo ──────────────────
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
            center: [longitude, latitude],
            zoom: CAMPAIGN_MAP_ZOOM,
            attributionControl: false,
            // Desabilita interações de movimentação — foco na visualização
            dragPan: true,
            scrollZoom: false,
            doubleClickZoom: false,
            touchZoomRotate: false,
        });

        // ── Após carregamento: adicionar círculo e marcador ──────────────────
        map.current.on('load', () => {
            if (!map.current) return;

            // 1. GeoJSON source do círculo
            const circleGeoJSON = generateCircleGeoJSON(latitude, longitude, radiusMeters);

            map.current.addSource(SOURCE_ID, {
                type: 'geojson',
                data: circleGeoJSON,
            });

            // 2. Camada de preenchimento (fill) — área sombreada
            map.current.addLayer({
                id: FILL_LAYER_ID,
                type: 'fill',
                source: SOURCE_ID,
                paint: {
                    'fill-color': '#c8a06e',
                    'fill-opacity': 0.18,
                },
            });

            // 3. Camada de borda (line) — contorno do círculo
            map.current.addLayer({
                id: LINE_LAYER_ID,
                type: 'line',
                source: SOURCE_ID,
                paint: {
                    'line-color': '#8a5a2a',
                    'line-width': 2,
                    'line-dasharray': [4, 2],
                },
            });

            // 4. Marcador do pet no centro
            const el = document.createElement('div');
            el.className = 'campaign-map-marker';
            el.setAttribute('aria-label', 'Localização do pet');

            const inner = document.createElement('div');
            inner.className = 'campaign-map-marker__inner';
            inner.textContent = '🐾';
            el.appendChild(inner);

            markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([longitude, latitude])
                .addTo(map.current);
        });

        // ── Cleanup ──────────────────────────────────────────────────────────
        return () => {
            markerRef.current?.remove();
            markerRef.current = null;
            map.current?.remove();
            map.current = null;
        };

        // O mapa é inicializado uma única vez — as props não mudam durante a vida útil do componente
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={mapContainer} className="pet-campaign-map__canvas" />;
}

export default PetCampaignMap;
