import axios from "axios";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../../utils/auth";
import { uploadPetImage, deletePetImage } from "../../services/petImageService";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Species = "Canina" | "Felina" | "Ave" | "";
type Sex = "Macho" | "Fêmea" | "";
type Castrated = "Sim" | "Não" | "";

interface PetFormData {
    name: string;
    species: Species;
    breed: string;
    sex: Sex;
    isCastrated: Castrated;
    color: string;
}

type PhotoStatus = "uploading" | "done" | "error";

interface PhotoItem {
    id: string;
    file: File;
    previewUrl: string;
    status: PhotoStatus;
    uploadedImageId?: string;
    errorMessage?: string;
}

// ─── Sub-componente: Campo de input com label ─────────────────────────────────

interface FieldInputProps {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    error?: string;
}

const FieldInput = ({
    id,
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false,
    error,
}: FieldInputProps) => (
    <div className="flex flex-col gap-1">
        <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700"
        >
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
        <input
            type={type}
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={!!error}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${error
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-gray-300 focus:ring-orange-300 focus:border-orange-400"
                }`}
        />
        {error && (
            <span
                id={`${id}-error`}
                role="alert"
                className="text-red-500 text-xs mt-0.5"
            >
                {error}
            </span>
        )}
    </div>
);

// ─── Sub-componente: Select com label ────────────────────────────────────────

interface FieldSelectProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
    required?: boolean;
    error?: string;
}

const FieldSelect = ({
    id,
    label,
    value,
    onChange,
    options,
    required = false,
    error,
}: FieldSelectProps) => (
    <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
        <select
            id={id}
            value={value}
            onChange={onChange}
            required={required}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={!!error}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors bg-white ${error
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-gray-300 focus:ring-orange-300 focus:border-orange-400"
                }`}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                    {opt.label}
                </option>
            ))}
        </select>
        {error && (
            <span id={`${id}-error`} role="alert" className="text-red-500 text-xs mt-0.5">
                {error}
            </span>
        )}
    </div>
);

// ─── Sub-componente: Upload de Fotos com status individual ───────────────────

interface PhotoUploaderProps {
    photos: PhotoItem[];
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (id: string) => void;
    onRetry: (id: string) => void;
    disabled?: boolean;
    maxReached?: boolean;
}

const PhotoUploader = ({ photos, onFileChange, onRemove, onRetry, disabled, maxReached }: PhotoUploaderProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">
                Fotos do Animal
                <span className="text-gray-400 font-normal ml-1">(opcional — máx. 10)</span>
            </span>

            {/* Área de seleção */}
            {!maxReached && (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled}
                    className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-gray-300 rounded-md hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent"
                    aria-label="Selecionar fotos do animal"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4-4a3 3 0 014 0l4 4m-4-8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span className="text-sm">
                        Clique para selecionar fotos
                    </span>
                    <span className="text-xs text-gray-400">PNG, JPG, WEBP, GIF — múltiplas fotos</span>
                </button>
            )}

            {maxReached && (
                <div className="w-full flex items-center justify-center py-4 bg-orange-50 border border-orange-200 rounded-md">
                    <span className="text-sm text-orange-600 font-medium">
                        ⚠️ Limite máximo de 10 imagens atingido
                    </span>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={onFileChange}
                className="hidden"
                aria-label="Upload de fotos"
            />

            {/* Grid de thumbnails com status */}
            {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-1">
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            className="relative group rounded-md overflow-hidden border border-gray-200 aspect-square bg-gray-100"
                        >
                            <img
                                src={photo.previewUrl}
                                alt={`Foto do pet`}
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay de loading */}
                            {photo.status === "uploading" && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <svg
                                        className="animate-spin h-6 w-6 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        aria-label="Enviando..."
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                                        />
                                    </svg>
                                </div>
                            )}

                            {/* Badge de sucesso */}
                            {photo.status === "done" && (
                                <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm">
                                    ✓
                                </div>
                            )}

                            {/* Overlay de erro com retry */}
                            {photo.status === "error" && (
                                <div className="absolute inset-0 bg-red-500/40 flex flex-col items-center justify-center gap-1">
                                    <span className="text-white text-xs font-medium text-center px-1">Erro</span>
                                    <button
                                        type="button"
                                        onClick={() => onRetry(photo.id)}
                                        className="bg-white text-red-600 text-xs font-medium px-2 py-0.5 rounded shadow-sm hover:bg-red-50 transition-colors"
                                        aria-label="Tentar novamente"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            )}

                            {/* Botão de remover (hover) — não exibe durante upload */}
                            {photo.status !== "uploading" && (
                                <button
                                    type="button"
                                    onClick={() => onRemove(photo.id)}
                                    aria-label="Remover foto"
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

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

// ─── Validação do formulário ──────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof PetFormData, string>>;

const validateForm = (data: PetFormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.name.trim()) errors.name = "O nome do pet é obrigatório.";
    if (!data.species) errors.species = "Selecione a espécie do pet.";
    if (!data.breed.trim()) errors.breed = "A raça é obrigatória.";
    if (!data.sex) errors.sex = "Selecione o sexo do pet.";
    if (!data.color.trim()) errors.color = "A cor do animal é obrigatória.";

    return errors;
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const PetRegisterForm = () => {
    const navigate = useNavigate();

    // ── Estado do formulário ────────────────────────────────────────────────
    const [formData, setFormData] = useState<PetFormData>({
        name: "",
        species: "",
        breed: "",
        sex: "",
        isCastrated: "",
        color: "",
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [globalError, setGlobalError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // ── Estado de fase (Fase 1: cadastro | Fase 2: upload de fotos) ─────────
    const [createdPetId, setCreatedPetId] = useState<string | null>(null);
    const [photos, setPhotos] = useState<PhotoItem[]>([]);

    const isUploadPhase = createdPetId !== null;
    const hasUploading = photos.some((p) => p.status === "uploading");
    const doneCount = photos.filter((p) => p.status === "done").length;

    // ── Handlers do Formulário ──────────────────────────────────────────────

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        if (errors[id as keyof PetFormData]) {
            setErrors((prev) => ({ ...prev, [id]: undefined }));
        }
    };

    // ── Submit Fase 1: Cadastrar Pet ────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalError("");
        setSuccessMessage("");

        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const token = getAuthToken();
        if (!token) {
            setGlobalError("Você precisa estar logado para cadastrar um pet.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/pets`,
                {
                    name: formData.name.trim(),
                    species: formData.species,
                    breed: formData.breed.trim(),
                    sex: formData.sex,
                    isCastrated: formData.isCastrated === "Sim",
                    color: formData.color.trim(),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const petId = response.data.id || response.data.pet?.id;
            setCreatedPetId(petId);
            setSuccessMessage("Pet cadastrado com sucesso! Agora você pode adicionar fotos.");
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.message ||
                "Erro ao cadastrar pet. Tente novamente.";
            setGlobalError(message);
        } finally {
            setLoading(false);
        }
    };

    // ── Handlers de Fotos (Fase 2) ──────────────────────────────────────────

    const processUpload = async (item: PhotoItem) => {
        if (!createdPetId) return;

        try {
            const record = await uploadPetImage(createdPetId, item.file);
            setPhotos((prev) =>
                prev.map((p) =>
                    p.id === item.id
                        ? { ...p, status: "done" as PhotoStatus, uploadedImageId: record.id }
                        : p
                )
            );
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.message || "Falha no upload";
            setPhotos((prev) =>
                prev.map((p) =>
                    p.id === item.id
                        ? { ...p, status: "error" as PhotoStatus, errorMessage: errorMsg }
                        : p
                )
            );
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        // Verificar limite
        const remaining = 10 - photos.length;
        const filesToAdd = files.slice(0, remaining);

        const newItems: PhotoItem[] = filesToAdd.map((file) => ({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
            status: "uploading" as PhotoStatus,
        }));

        setPhotos((prev) => [...prev, ...newItems]);

        // Disparar upload para cada novo item
        newItems.forEach((item) => processUpload(item));

        // Limpar input para permitir re-selecionar
        e.target.value = "";
    };

    const handleRetry = (photoId: string) => {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) return;

        setPhotos((prev) =>
            prev.map((p) =>
                p.id === photoId ? { ...p, status: "uploading" as PhotoStatus, errorMessage: undefined } : p
            )
        );

        processUpload(photo);
    };

    const handleRemovePhoto = async (photoId: string) => {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) return;

        // Se já foi confirmada no backend, deletar
        if (photo.status === "done" && photo.uploadedImageId && createdPetId) {
            try {
                await deletePetImage(createdPetId, photo.uploadedImageId);
            } catch {
                // Se falhar ao deletar do backend, ainda remove do UI
            }
        }

        URL.revokeObjectURL(photo.previewUrl);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    };

    // ── Concluir (Fase 2 → Redirecionar) ───────────────────────────────────

    const handleFinish = () => {
        navigate("/profile");
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">

                {/* Cabeçalho */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isUploadPhase ? "Fotos do Pet" : "Cadastrar Pet"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isUploadPhase
                            ? "Adicione fotos do seu pet (opcional)."
                            : "O pet será vinculado automaticamente à sua conta."
                        }
                    </p>
                </div>

                {/* Feedback global de erro */}
                {globalError && (
                    <div
                        role="alert"
                        className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm"
                    >
                        {globalError}
                    </div>
                )}

                {/* Feedback de sucesso */}
                {successMessage && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="mb-4 px-4 py-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm font-medium"
                    >
                        ✅ {successMessage}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    FASE 1: Formulário de cadastro
                ═══════════════════════════════════════════════════════════ */}
                {!isUploadPhase && (
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">

                        <FieldInput
                            id="name"
                            label="Nome do Pet"
                            placeholder="Ex: Rex, Bella, Thor..."
                            value={formData.name}
                            onChange={handleChange}
                            required
                            error={errors.name}
                        />

                        <FieldSelect
                            id="species"
                            label="Espécie"
                            value={formData.species}
                            onChange={handleChange}
                            options={SPECIES_OPTIONS}
                            required
                            error={errors.species}
                        />

                        <FieldInput
                            id="breed"
                            label="Raça"
                            placeholder="Ex: Labrador, Siamês, Sem raça definida..."
                            value={formData.breed}
                            onChange={handleChange}
                            required
                            error={errors.breed}
                        />

                        <FieldSelect
                            id="sex"
                            label="Sexo"
                            value={formData.sex}
                            onChange={handleChange}
                            options={SEX_OPTIONS}
                            required
                            error={errors.sex}
                        />

                        <FieldSelect
                            id="isCastrated"
                            label="É castrado(a)?"
                            value={formData.isCastrated}
                            onChange={handleChange}
                            options={[
                                { value: "", label: "Selecione..." },
                                { value: "Sim", label: "✅ Sim" },
                                { value: "Não", label: "❌ Não" },
                            ]}
                            required
                            error={errors.isCastrated}
                        />

                        <FieldInput
                            id="color"
                            label="Cor do Animal"
                            placeholder="Ex: Caramelo, Preto e branco, Cinza..."
                            value={formData.color}
                            onChange={handleChange}
                            required
                            error={errors.color}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            aria-busy={loading}
                            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                                        />
                                    </svg>
                                    Cadastrando...
                                </>
                            ) : (
                                "Cadastrar Pet"
                            )}
                        </button>

                    </form>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    FASE 2: Upload de fotos
                ═══════════════════════════════════════════════════════════ */}
                {isUploadPhase && (
                    <div className="space-y-4">

                        {/* Resumo do pet cadastrado */}
                        <div className="px-4 py-3 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-600">
                            <span className="font-medium text-gray-700">Pet:</span>{" "}
                            {formData.name} • {formData.species} • {formData.breed}
                        </div>

                        {/* Uploader de fotos */}
                        <PhotoUploader
                            photos={photos}
                            onFileChange={handleFileChange}
                            onRemove={handleRemovePhoto}
                            onRetry={handleRetry}
                            disabled={hasUploading}
                            maxReached={photos.length >= 10}
                        />

                        {/* Contador de fotos */}
                        {photos.length > 0 && (
                            <p className="text-xs text-gray-400 text-center">
                                {doneCount} de {photos.length} foto(s) enviada(s)
                                {photos.length > 0 && ` • ${10 - photos.length} restante(s)`}
                            </p>
                        )}

                        {/* Botões da Fase 2 */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleFinish}
                                disabled={hasUploading}
                                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-md transition-colors"
                            >
                                {photos.length === 0 ? "Pular e Concluir" : "Concluir"}
                            </button>
                        </div>

                        {hasUploading && (
                            <p className="text-xs text-orange-500 text-center animate-pulse">
                                ⏳ Aguarde o envio das fotos...
                            </p>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default PetRegisterForm;