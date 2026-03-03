import axios from "axios";
import { getAuthToken } from "../utils/auth";

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

export interface MyPetData {
    id: string;
    name: string;
    species: string;
    breed: string;
    sex: string;
    isCastrated: boolean;
    color: string;
    eyeColor: string | null;
    age: string | null;
    distinctiveMarks: string | null;
    status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const authHeaders = () => {
    const token = getAuthToken();
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
};

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

/**
 * Lista os pets do usuário logado (para seleção no formulário de anúncio).
 */
export const getMyPets = async (): Promise<MyPetData[]> => {
    const { data } = await axios.get<MyPetData[]>(
        `${API_URL}/api/pets`,
        { headers: authHeaders() }
    );
    return data;
};

