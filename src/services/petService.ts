import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PetMapData {
    id: string;
    name: string;
    species: string;
    breed: string;
    sex: string;
    color: string;
    lostLatitude: number | null;
    lostLongitude: number | null;
    lostAt: string | null;
    distance_meters: number;
    imageUrl: string | null;
    tutorName: string;
    tutorPhone: string;
}

// ─── Funções do Serviço ───────────────────────────────────────────────────────

/**
 * Busca animais encontrados e perdidos num raio específico de uma localização (visualização pública).
 * 
 * @param lat Latitude central da busca
 * @param lng Longitude central da busca
 * @param radius_meters Raio em metros (padrão: 1000m = 1km)
 * @returns Array com dados dos animais próximos a referida coordenada
 */
export const getPetsNearby = async (
    lat: number,
    lng: number,
    radius_meters: number = 1000
): Promise<PetMapData[]> => {
    // Esse endpoint é público no back-end, por isso não envia Headers de Auth,
    // garantindo a renderização para qualquer visitante do app (Viu meu Pet?).
    const { data } = await axios.get<{ pets: PetMapData[]; page: number; pageSize: number }>(
        `${API_URL}/api/pets/nearby`,
        {
            params: {
                lat,
                lng,
                radius_meters
            }
        }
    );
    return data.pets;
};
