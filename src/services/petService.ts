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

// ─── Tipo de detalhe completo do Pet ──────────────────────────────────────────

export interface PetDetail {
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
    lostAt: string | null;
    foundAt: string | null;
    images: {
        id: string;
        path: string;
        isPublic: boolean;
        order: number;
        url?: string | null;
    }[];
    locations: {
        id: string;
        latitude: number;
        longitude: number;
        createdAt: string;
    }[];
}

/**
 * Busca os dados completos de um pet específico do usuário logado.
 *
 * @param petId ID do pet a ser buscado
 * @returns Dados completos do pet incluindo imagens e localizações
 */
export const getPetById = async (petId: string): Promise<PetDetail> => {
    const { data } = await axios.get<PetDetail>(
        `${API_URL}/api/pets/${petId}`,
        { headers: authHeaders() }
    );
    return data;
};


