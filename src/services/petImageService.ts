import axios from "axios";
import { getAuthToken } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UploadUrlResponse {
    signedUrl: string;
    path: string;
    token: string;
}

export interface PetImageRecord {
    id: string;
    path: string;
    isPublic: boolean;
    order: number;
    petId: string;
    createdAt: string;
    updatedAt: string;
    url?: string | null;
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
 * Solicita ao backend uma signed URL para upload direto no Supabase Storage.
 */
export const requestUploadUrl = async (
    petId: string,
    fileName: string,
    contentType: string
): Promise<UploadUrlResponse> => {
    const { data } = await axios.post<UploadUrlResponse>(
        `${API_URL}/api/pets/${petId}/images/upload-url`,
        { fileName, contentType },
        { headers: authHeaders() }
    );
    return data;
};

/**
 * Faz o upload binário do arquivo direto na signed URL do Supabase Storage.
 */
export const uploadToStorage = async (
    signedUrl: string,
    file: File
): Promise<void> => {
    await axios.put(signedUrl, file, {
        headers: {
            "Content-Type": file.type,
        },
    });
};

/**
 * Confirma ao backend que o upload foi concluído.
 */
export const confirmUpload = async (
    petId: string,
    path: string
): Promise<PetImageRecord> => {
    const { data } = await axios.post<PetImageRecord>(
        `${API_URL}/api/pets/${petId}/images/confirm`,
        { path },
        { headers: authHeaders() }
    );
    return data;
};

/**
 * Orquestra todo o fluxo de upload de uma imagem:
 * 1. Solicita signed URL ao backend
 * 2. Faz PUT direto no Storage
 * 3. Confirma o upload no backend
 */
export const uploadPetImage = async (
    petId: string,
    file: File
): Promise<PetImageRecord> => {
    // 1. Solicitar URL
    const { signedUrl, path } = await requestUploadUrl(
        petId,
        file.name,
        file.type
    );

    // 2. Upload binário
    await uploadToStorage(signedUrl, file);

    // 3. Confirmar
    const record = await confirmUpload(petId, path);
    return record;
};

/**
 * Remove uma imagem do pet (backend cuida de apagar do Storage também).
 */
export const deletePetImage = async (
    petId: string,
    imageId: string
): Promise<void> => {
    await axios.delete(
        `${API_URL}/api/pets/${petId}/images/${imageId}`,
        { headers: authHeaders() }
    );
};

/**
 * Lista todas as imagens de um pet (com signed URLs temporárias de visualização).
 */
export const listPetImages = async (
    petId: string
): Promise<PetImageRecord[]> => {
    const { data } = await axios.get<PetImageRecord[]>(
        `${API_URL}/api/pets/${petId}/images`,
        { headers: authHeaders() }
    );
    return data;
};
