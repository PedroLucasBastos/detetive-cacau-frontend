import axios from "axios";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../../utils/auth";

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

interface PhotoPreview {
    file: File;
    previewUrl: string;
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

// ─── Sub-componente: Upload de Fotos ─────────────────────────────────────────

interface PhotoUploaderProps {
    previews: PhotoPreview[];
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (index: number) => void;
}

const PhotoUploader = ({ previews, onFileChange, onRemove }: PhotoUploaderProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">
                Fotos do Animal
                <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            </span>

            {/* Área de drag visual / botão de seleção */}
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-gray-300 rounded-md hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
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
                <span className="text-xs text-gray-400">PNG, JPG, WEBP — múltiplas fotos</span>
            </button>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onFileChange}
                className="hidden"
                aria-label="Upload de fotos"
            />

            {/* Pré-visualização das fotos selecionadas */}
            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-1">
                    {previews.map((photo, index) => (
                        <div
                            key={index}
                            className="relative group rounded-md overflow-hidden border border-gray-200 aspect-square bg-gray-100"
                        >
                            <img
                                src={photo.previewUrl}
                                alt={`Foto ${index + 1} do pet`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => onRemove(index)}
                                aria-label={`Remover foto ${index + 1}`}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            >
                                ✕
                            </button>
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

    const [formData, setFormData] = useState<PetFormData>({
        name: "",
        species: "",
        breed: "",
        sex: "",
        isCastrated: "",
        color: "",
    });

    const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});
    const [globalError, setGlobalError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        // Limpa o erro do campo ao digitar
        if (errors[id as keyof PetFormData]) {
            setErrors((prev) => ({ ...prev, [id]: undefined }));
        }
    };



    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const newPreviews: PhotoPreview[] = files.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setPhotoPreviews((prev) => [...prev, ...newPreviews]);
        // Limpa o input para permitir re-selecionar o mesmo arquivo
        e.target.value = "";
    };

    const handleRemovePhoto = (index: number) => {
        setPhotoPreviews((prev) => {
            URL.revokeObjectURL(prev[index].previewUrl); // libera memória
            return prev.filter((_, i) => i !== index);
        });
    };

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalError("");
        setSuccessMessage("");

        // Validação local
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
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/pets`,
                {
                    name: formData.name.trim(),
                    species: formData.species,
                    breed: formData.breed.trim(),
                    sex: formData.sex,
                    isCastrated: formData.isCastrated === "Sim",
                    color: formData.color.trim(),
                    // photos são opcionais; o backend espera array de URLs.
                    // Fotos locais serão suportadas quando o backend tiver endpoint de upload.
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setSuccessMessage("Pet cadastrado com sucesso! Redirecionando...");
            setTimeout(() => navigate("/profile"), 1800);
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

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">

                {/* Cabeçalho */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Cadastrar Pet
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        O pet será vinculado automaticamente à sua conta.
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

                <form onSubmit={handleSubmit} noValidate className="space-y-4">

                    {/* Nome do pet */}
                    <FieldInput
                        id="name"
                        label="Nome do Pet"
                        placeholder="Ex: Rex, Bella, Thor..."
                        value={formData.name}
                        onChange={handleChange}
                        required
                        error={errors.name}
                    />

                    {/* Espécie */}
                    <FieldSelect
                        id="species"
                        label="Espécie"
                        value={formData.species}
                        onChange={handleChange}
                        options={SPECIES_OPTIONS}
                        required
                        error={errors.species}
                    />

                    {/* Raça */}
                    <FieldInput
                        id="breed"
                        label="Raça"
                        placeholder="Ex: Labrador, Siamês, Sem raça definida..."
                        value={formData.breed}
                        onChange={handleChange}
                        required
                        error={errors.breed}
                    />

                    {/* Sexo */}
                    <FieldSelect
                        id="sex"
                        label="Sexo"
                        value={formData.sex}
                        onChange={handleChange}
                        options={SEX_OPTIONS}
                        required
                        error={errors.sex}
                    />

                    {/* É castrado? */}
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

                    {/* Cor do animal */}
                    <FieldInput
                        id="color"
                        label="Cor do Animal"
                        placeholder="Ex: Caramelo, Preto e branco, Cinza..."
                        value={formData.color}
                        onChange={handleChange}
                        required
                        error={errors.color}
                    />

                    {/* Upload de fotos */}
                    <PhotoUploader
                        previews={photoPreviews}
                        onFileChange={handleFileChange}
                        onRemove={handleRemovePhoto}
                    />

                    {/* Botão de submit */}
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
            </div>
        </div>
    );
};

export default PetRegisterForm;