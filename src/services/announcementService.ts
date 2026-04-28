import axios from "axios";
import { getAuthToken } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AnnouncementPayload {
    type: "LOST" | "FOUND";
    description?: string;
    latitude: number;
    longitude: number;
    occurredAt?: string;
    contactPhone: string;
    petId?: string;
    petData?: {
        name: string;
        species: string;
        breed: string;
        sex: string;
        isCastrated: boolean;
        color: string;
        eyeColor?: string;
        age?: string;
        distinctiveMarks?: string;
    };
}

export interface AnnouncementRecord {
    id: string;
    type: "LOST" | "FOUND";
    status: "ACTIVE" | "RESOLVED" | "CANCELLED";
    description: string | null;
    latitude: number;
    longitude: number;
    occurredAt: string;
    contactPhone: string;
    petId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;
    pet: {
        id: string;
        name: string;
        species: string;
        breed: string;
        sex: string;
        color: string;
        images: { id: string; path: string; isPublic: boolean; order: number }[];
    };
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
 * Cria um novo anúncio de pet perdido ou encontrado.
 */
export const createAnnouncement = async (
    data: AnnouncementPayload
): Promise<AnnouncementRecord> => {
    const { data: response } = await axios.post<AnnouncementRecord>(
        `${API_URL}/api/announcements`,
        data,
        { headers: authHeaders() }
    );
    return response;
};

/**
 * Lista todos os anúncios do usuário logado.
 */
export const listMyAnnouncements = async (): Promise<AnnouncementRecord[]> => {
    const { data } = await axios.get<AnnouncementRecord[]>(
        `${API_URL}/api/announcements`,
        { headers: authHeaders() }
    );
    return data;
};

/**
 * Marca um anúncio como resolvido (encerrado).
 */
export const resolveAnnouncement = async (
    announcementId: string
): Promise<AnnouncementRecord> => {
    const { data } = await axios.patch<AnnouncementRecord>(
        `${API_URL}/api/announcements/${announcementId}/resolve`,
        {},
        { headers: authHeaders() }
    );
    return data;
};

/**
 * Remove (deleta) um anúncio.
 */
export const deleteAnnouncement = async (
    announcementId: string
): Promise<void> => {
    await axios.delete(
        `${API_URL}/api/announcements/${announcementId}`,
        { headers: authHeaders() }
    );
};
