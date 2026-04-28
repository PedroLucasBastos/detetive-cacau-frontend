import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthToken } from "../utils/auth";
import { listPetImages, uploadPetImage, deletePetImage } from "../services/petImageService";
import type { PetImageRecord } from "../services/petImageService";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Species = "Canina" | "Felina" | "Ave" | "";
type Sex = "Macho" | "Fêmea" | "";
type Castrated = "Sim" | "Não" | "";

interface Pet {
    id: string;
    name: string;
    species: string;
    breed: string;
    sex: string;
    isCastrated: boolean;
    color: string;
    status: string;
}

interface PetFormData {
    name: string;
    species: Species;
    breed: string;
    sex: Sex;
    isCastrated: Castrated;
    color: string;
    status: string;
}

type PhotoStatus = "uploading" | "done" | "error";

interface PhotoItem {
    id: string; // ID local ou do banco
    file?: File;
    previewUrl: string;
    status: PhotoStatus;
    uploadedImageId?: string; // ID real no banco se 'done'
    errorMessage?: string;
}

// ─── Constantes de opções ─────────────────────────────────────────────────────

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
    { value: "", label: "Selecione a espécie..." },
    { value: "Canina", label: "🐶 Canina (Cachorro)" },
    { value: "Felina", label: "🐱 Felina (Gato)" },
    { value: "Ave", label: "🐦 Ave" },
];

const SEX_OPTIONS: { value: Sex; label: string }[] = [
    { value: "", label: "Selecione o sexo..." },
    { value: "Macho", label: "♂ Macho" },
    { value: "Fêmea", label: "♀ Fêmea" },
];

const STATUS_OPTIONS = [
    { value: "SAFE", label: "🏠 Em Segurança (Em casa)" },
    { value: "LOST", label: "🚨 Perdido" },
    { value: "FOUND", label: "🎉 Encontrado" }
];

// ─── Sub-componente: Campo de input com label ─────────────────────────────────

const FieldInput = ({ id, label, value, onChange, required, error, disabled }: any) => (
    <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
            {required && !disabled && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
            type="text"
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-md transition-colors ${disabled ? "bg-gray-100 text-gray-500 border-gray-200" : error
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-gray-300 focus:ring-orange-300 focus:border-orange-400 focus:outline-none focus:ring-2 bg-white"
                }`}
        />
        {error && !disabled && <span className="text-red-500 text-xs mt-0.5">{error}</span>}
    </div>
);

const FieldSelect = ({ id, label, value, onChange, options, required, error, disabled }: any) => (
    <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
            {required && !disabled && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-md transition-colors ${disabled ? "bg-gray-100 text-gray-500 border-gray-200" : error
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-gray-300 focus:ring-orange-300 focus:border-orange-400 focus:outline-none focus:ring-2 bg-white"
                }`}
        >
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value} disabled={opt.value === "" && !disabled}>
                    {opt.label}
                </option>
            ))}
        </select>
        {error && !disabled && <span className="text-red-500 text-xs mt-0.5">{error}</span>}
    </div>
);

// ─── Sub-componente: Upload de Fotos com status individual ───────────────────

const PhotoUploader = ({ photos, onFileChange, onRemove, onRetry, disabled, maxReached, isEditing }: any) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">
                Fotos do Animal
                {isEditing && <span className="text-gray-400 font-normal ml-1">(mínimo 1, máx. 10)</span>}
            </span>

            {/* Área de seleção */}
            {isEditing && !maxReached && (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled}
                    className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-gray-300 rounded-md hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent"
                >
                    <span className="text-sm">Clique para adicionar fotos</span>
                </button>
            )}

            {isEditing && maxReached && (
                <div className="w-full flex items-center justify-center py-4 bg-orange-50 border border-orange-200 rounded-md">
                    <span className="text-sm text-orange-600 font-medium">⚠️ Limite máximo de 10 imagens atingido</span>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={onFileChange}
                className="hidden"
            />

            {/* Grid de thumbnails com status */}
            {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mt-1">
                    {photos.map((photo: any) => (
                        <div key={photo.id} className="relative group rounded-md overflow-hidden border border-gray-200 aspect-square bg-gray-100">
                            <img src={photo.previewUrl} alt="Pet" className="w-full h-full object-cover" />

                            {photo.status === "uploading" && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="text-white text-xs">Enviando...</span>
                                </div>
                            )}

                            {photo.status === "error" && (
                                <div className="absolute inset-0 bg-red-500/40 flex flex-col items-center justify-center gap-1">
                                    <span className="text-white text-xs font-medium px-1">Erro</span>
                                    <button
                                        type="button"
                                        onClick={() => onRetry(photo.id)}
                                        className="bg-white text-red-600 text-xs font-medium px-2 py-0.5 rounded shadow-sm"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            )}

                            {isEditing && photo.status !== "uploading" && (
                                <button
                                    type="button"
                                    onClick={() => onRemove(photo.id)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-gray-500 italic py-4">Nenhuma foto cadastrada.</div>
            )}
        </div>
    );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

function PetDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [pet, setPet] = useState<Pet | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Estados do Form
    const [formData, setFormData] = useState<PetFormData | null>(null);
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [errors, setErrors] = useState<any>({});
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [globalMessage, setGlobalMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const hasUploading = photos.some((p) => p.status === "uploading");

    // ─── Carregar Pet ──────────────────────────────────────────────────────────

    useEffect(() => {
        const fetchPet = async () => {
            const token = getAuthToken();
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                // Busca detalhes
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/pets/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetchedPet = res.data;
                setPet(fetchedPet);
                
                // Preenche formulário
                setFormData({
                    name: fetchedPet.name,
                    species: fetchedPet.species,
                    breed: fetchedPet.breed,
                    sex: fetchedPet.sex,
                    isCastrated: fetchedPet.isCastrated ? "Sim" : "Não",
                    color: fetchedPet.color,
                    status: fetchedPet.status
                });

                // Busca imagens
                const images: PetImageRecord[] = await listPetImages(fetchedPet.id);
                setPhotos(images.map(img => ({
                    id: img.id,
                    previewUrl: img.url || "",
                    status: "done",
                    uploadedImageId: img.id
                })));
                
                setLoading(false);
            } catch (err) {
                setGlobalMessage({ type: 'error', text: 'Não foi possível carregar os detalhes do pet.' });
                setLoading(false);
            }
        };

        if (id) fetchPet();
    }, [id, navigate]);

    // ─── Handlers do Form ──────────────────────────────────────────────────────

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!formData) return;
        const { id, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [id]: value }));
        if (errors[id]) {
            setErrors((prev: any) => ({ ...prev, [id]: undefined }));
        }
    };

    // ─── Handlers de Fotos ─────────────────────────────────────────────────────

    const processUpload = async (item: PhotoItem) => {
        if (!id) return;
        try {
            const record = await uploadPetImage(id, item.file!);
            setPhotos((prev) =>
                prev.map((p) => p.id === item.id ? { ...p, status: "done", uploadedImageId: record.id, previewUrl: record.url || "" } : p)
            );
        } catch (err: any) {
            setPhotos((prev) =>
                prev.map((p) => p.id === item.id ? { ...p, status: "error", errorMessage: "Falha no upload" } : p)
            );
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        const remaining = 10 - photos.length;
        const filesToAdd = files.slice(0, remaining);

        const newItems: PhotoItem[] = filesToAdd.map((file) => ({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
            status: "uploading",
        }));

        setPhotos((prev) => [...prev, ...newItems]);
        newItems.forEach((item) => processUpload(item));
        e.target.value = "";
    };

    const handleRemovePhoto = async (photoId: string) => {
        if (photos.filter(p => p.status === 'done').length <= 1) {
            setGlobalMessage({ type: 'error', text: 'O pet deve ter pelo menos uma foto.' });
            return;
        }

        const photo = photos.find((p) => p.id === photoId);
        if (!photo || !id) return;

        if (photo.status === "done" && photo.uploadedImageId) {
            try {
                await deletePetImage(id, photo.uploadedImageId);
            } catch {
                setGlobalMessage({ type: 'error', text: 'Falha ao deletar a imagem do servidor.' });
                return;
            }
        }

        if (photo.previewUrl.startsWith('blob:')) URL.revokeObjectURL(photo.previewUrl);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    };

    const handleRetry = (photoId: string) => {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) return;
        setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, status: "uploading", errorMessage: undefined } : p));
        processUpload(photo);
    };

    // ─── Salvar ───────────────────────────────────────────────────────────────

    const validateForm = () => {
        if (!formData) return {};
        const errs: any = {};
        if (!formData.name.trim()) errs.name = "Nome é obrigatório";
        if (!formData.species) errs.species = "Espécie é obrigatória";
        if (!formData.breed.trim()) errs.breed = "Raça é obrigatória";
        if (!formData.sex) errs.sex = "Sexo é obrigatório";
        if (!formData.color.trim()) errs.color = "Cor é obrigatória";
        return errs;
    };

    const handleSave = async () => {
        setGlobalMessage(null);
        
        const validationErrs = validateForm();
        if (Object.keys(validationErrs).length > 0) {
            setErrors(validationErrs);
            return;
        }

        const validPhotos = photos.filter(p => p.status === 'done');
        if (validPhotos.length === 0) {
            setGlobalMessage({ type: 'error', text: 'É obrigatório ter pelo menos uma foto salva.' });
            return;
        }

        if (hasUploading) {
            setGlobalMessage({ type: 'error', text: 'Aguarde o envio das fotos terminar.' });
            return;
        }

        const token = getAuthToken();
        setSaving(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/pets/${id}`, {
                name: formData?.name.trim(),
                species: formData?.species,
                breed: formData?.breed.trim(),
                sex: formData?.sex,
                isCastrated: formData?.isCastrated === "Sim",
                color: formData?.color.trim(),
                status: formData?.status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setGlobalMessage({ type: 'success', text: 'Informações salvas com sucesso!' });
            setIsEditing(false);
        } catch (err: any) {
            setGlobalMessage({ type: 'error', text: err.response?.data?.message || 'Erro ao salvar informações.' });
        } finally {
            setSaving(false);
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
                <svg className="animate-spin h-8 w-8 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                </svg>
            </div>
        );
    }

    if (!pet || !formData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-10 px-4 text-gray-500">
                <p>Pet não encontrado ou sem permissão.</p>
                <button onClick={() => navigate('/profile')} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md">Voltar ao Perfil</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 pt-24">
            <div className="max-w-2xl mx-auto">
                {/* Header Page */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate('/profile')} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium transition-colors">
                        <span>←</span> Voltar
                    </button>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors shadow-sm font-medium">
                            Editar Pet
                        </button>
                    ) : (
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium">
                            Cancelar Edição
                        </button>
                    )}
                </div>

                <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="mb-6 text-center border-b pb-4">
                        <h1 className="text-2xl font-bold text-gray-800">Detalhes do Pet</h1>
                        <p className="text-sm text-gray-500 mt-1">Gerencie as informações do seu companheiro.</p>
                    </div>

                    {globalMessage && (
                        <div className={`mb-6 px-4 py-3 rounded-md text-sm font-medium ${globalMessage.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                            {globalMessage.text}
                        </div>
                    )}

                    <div className="space-y-4">
                        <FieldInput id="name" label="Nome do Pet" value={formData.name} onChange={handleChange} required error={errors.name} disabled={!isEditing} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldSelect id="species" label="Espécie" value={formData.species} onChange={handleChange} options={SPECIES_OPTIONS} required error={errors.species} disabled={!isEditing} />
                            <FieldInput id="breed" label="Raça" value={formData.breed} onChange={handleChange} required error={errors.breed} disabled={!isEditing} />
                            <FieldSelect id="sex" label="Sexo" value={formData.sex} onChange={handleChange} options={SEX_OPTIONS} required error={errors.sex} disabled={!isEditing} />
                            <FieldSelect id="isCastrated" label="Castrado?" value={formData.isCastrated} onChange={handleChange} options={[{ value: "", label: "Selecione..." }, { value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]} required error={errors.isCastrated} disabled={!isEditing} />
                        </div>
                        
                        <FieldInput id="color" label="Cor do Animal" value={formData.color} onChange={handleChange} required error={errors.color} disabled={!isEditing} />
                        
                        <div className="border-t pt-4 mt-2">
                            <FieldSelect id="status" label="Status Atual" value={formData.status} onChange={handleChange} options={STATUS_OPTIONS} disabled={!isEditing} />
                        </div>

                        <div className="border-t pt-4 mt-2">
                            <PhotoUploader photos={photos} onFileChange={handleFileChange} onRemove={handleRemovePhoto} onRetry={handleRetry} disabled={hasUploading} maxReached={photos.length >= 10} isEditing={isEditing} />
                        </div>

                        {isEditing && (
                            <div className="pt-6">
                                <button
                                    onClick={handleSave}
                                    disabled={saving || hasUploading}
                                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PetDetails;
