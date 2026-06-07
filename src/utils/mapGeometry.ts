/**
 * Gera um GeoJSON Feature do tipo Polygon representando um círculo
 * aproximado ao redor de um ponto geográfico.
 *
 * @param lat         Latitude central em graus decimais
 * @param lng         Longitude central em graus decimais
 * @param radiusMeters Raio do círculo em metros
 * @param points      Número de vértices do polígono (padrão: 64 — suave o suficiente)
 * @returns GeoJSON Feature<Polygon>
 */
export function generateCircleGeoJSON(
    lat: number,
    lng: number,
    radiusMeters: number,
    points = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
    const coordinates: [number, number][] = [];

    for (let i = 0; i <= points; i++) {
        const angle = (2 * Math.PI * i) / points;

        // Deslocamento em metros (componentes x=leste, y=norte)
        const dx = radiusMeters * Math.sin(angle);
        const dy = radiusMeters * Math.cos(angle);

        // Conversão de metros para graus (aproximação esférica)
        const latOffset = dy / 111_320;
        const lngOffset = dx / (111_320 * Math.cos((lat * Math.PI) / 180));

        coordinates.push([lng + lngOffset, lat + latOffset]);
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
        },
        properties: {},
    };
}
