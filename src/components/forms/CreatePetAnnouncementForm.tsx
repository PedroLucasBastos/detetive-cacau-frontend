import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getAuthToken, getAuthUser } from "../../utils/auth";
import { getMyPets } from "../../services/petService";
import type { MyPetData } from "../../services/petService";
import { createAnnouncement, deleteAnnouncement } from "../../services/announcementService";
import { uploadPetImage, deletePetImage, listPetImages } from "../../services/petImageService";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AnnouncementType = "LOST" | "FOUND" | "";
type Species = "Cachorro" | "Gato" | "Ave" | "";
type Sex = "Macho" | "Fêmea" | "";

interface FormData {
    // Etapa 1
    type: AnnouncementType;
    species: Species;
    sex: Sex;
    selectedPetId: string;
    // Etapa 2
    breed: string;
    color: string;
    eyeColor: string;
    age: string;
    distinctiveMarks: string;
    // Etapa 3
    petName: string;
    description: string;
    // Etapa 4
    occurredAt: string;
    contactPhone: string;
}

type PhotoStatus = "uploading" | "done" | "error";

interface PhotoItem {
    id: string;
    file?: File;
    previewUrl: string;
    status: PhotoStatus;
    uploadedImageId?: string;
    errorMessage?: string;
}

type StepErrors = Record<string, string | undefined>;

// ─── Constantes ───────────────────────────────────────────────────────────────

const STEPS = [
    { number: 1, title: "Tipo do Anúncio" },
    { number: 2, title: "Características Físicas" },
    { number: 3, title: "Informações + Fotos" },
    { number: 4, title: "Localização + Contato" },
];

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
    { value: "", label: "Selecione a espécie..." },
    { value: "Cachorro", label: "🐶 Cachorro" },
    { value: "Gato", label: "🐱 Gato" },
    { value: "Ave", label: "🐦 Ave" },
];

const SEX_OPTIONS: { value: Sex; label: string }[] = [
    { value: "", label: "Selecione o sexo..." },
    { value: "Macho", label: "♂ Macho" },
    { value: "Fêmea", label: "♀ Fêmea" },
];

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
    disabled?: boolean;
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
    disabled = false,
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
            disabled={disabled}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={!!error}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${error
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : disabled
                    ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
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

// ─── Sub-componente: Textarea com label ──────────────────────────────────────

interface FieldTextareaProps {
    id: string;
    label: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    required?: boolean;
    error?: string;
    rows?: number;
    helpText?: string;
}

const FieldTextarea = ({
    id,
    label,
    placeholder,
    value,
    onChange,
    required = false,
    error,
    rows = 3,
    helpText,
}: FieldTextareaProps) => (
    <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
        {helpText && (
            <span className="text-xs text-gray-400">{helpText}</span>
        )}
        <textarea
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            rows={rows}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={!!error}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors resize-none ${error
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-gray-300 focus:ring-orange-300 focus:border-orange-400"
                }`}
        />
        {error && (
            <span id={`${id}-error`} role="alert" className="text-red-500 text-xs mt-0.5">
                {error}
            </span>
        )}
    </div>
);

// ─── Sub-componente: Upload de Fotos ─────────────────────────────────────────

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
                    <span className="text-sm">Clique para selecionar fotos</span>
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

            {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-1">
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            className="relative group rounded-md overflow-hidden border border-gray-200 aspect-square bg-gray-100"
                        >
                            <img
                                src={photo.previewUrl}
                                alt="Foto do pet"
                                className="w-full h-full object-cover"
                            />
                            {photo.status === "uploading" && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <svg
                                        className="animate-spin h-6 w-6 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        aria-label="Enviando..."
                                    >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                                    </svg>
                                </div>
                            )}
                            {photo.status === "done" && (
                                <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm">
                                    ✓
                                </div>
                            )}
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

// ─── Sub-componente: Indicador de Progresso ──────────────────────────────────

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                    <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep === step.number
                            ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                            : currentStep > step.number
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                    >
                        {currentStep > step.number ? "✓" : step.number}
                    </div>
                    <span
                        className={`text-[10px] mt-1 text-center leading-tight max-w-[70px] ${currentStep === step.number
                            ? "text-orange-600 font-semibold"
                            : currentStep > step.number
                                ? "text-green-600 font-medium"
                                : "text-gray-400"
                            }`}
                    >
                        {step.title}
                    </span>
                </div>
                {index < STEPS.length - 1 && (
                    <div
                        className={`flex-1 h-0.5 mx-2 mt-[-16px] transition-colors duration-300 ${currentStep > step.number ? "bg-green-400" : "bg-gray-200"
                            }`}
                    />
                )}
            </div>
        ))}
    </div>
);

// ─── Validação por Etapa ─────────────────────────────────────────────────────

const validateStep = (step: number, data: FormData, location: { lat: number; lng: number } | null): StepErrors => {
    const errors: StepErrors = {};

    if (step === 1) {
        if (!data.type) errors.type = "Selecione o tipo do anúncio.";
        if (!data.species) errors.species = "Selecione a espécie.";
        if (!data.sex) errors.sex = "Selecione o sexo.";
    }

    if (step === 2) {
        if (!data.breed.trim()) errors.breed = "A raça é obrigatória.";
        if (!data.color.trim()) errors.color = "A cor predominante é obrigatória.";
    }

    if (step === 3) {
        if (data.type === "LOST" && !data.petName.trim()) {
            errors.petName = "O nome do pet é obrigatório para animais perdidos.";
        }
    }

    if (step === 4) {
        if (!location) errors.location = "Selecione a localização no mapa.";
        if (!data.contactPhone.trim()) errors.contactPhone = "O telefone é obrigatório.";
    }

    return errors;
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const CreatePetAnnouncementForm = () => {
    const navigate = useNavigate();

    // ── Estado do formulário ────────────────────────────────────────────────
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({
        type: "",
        species: "",
        sex: "",
        selectedPetId: "",
        breed: "",
        color: "",
        eyeColor: "",
        age: "",
        distinctiveMarks: "",
        petName: "",
        description: "",
        occurredAt: "",
        contactPhone: "",
    });

    const [errors, setErrors] = useState<StepErrors>({});
    const [globalError, setGlobalError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // ── Estado de pets do usuário ────────────────────────────────────────────
    const [myPets, setMyPets] = useState<MyPetData[]>([]);
    const [loadingPets, setLoadingPets] = useState(false);

    // ── Estado de localização ────────────────────────────────────────────────
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchAddress, setSearchAddress] = useState("");
    const [searchingAddress, setSearchingAddress] = useState(false);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const marker = useRef<maplibregl.Marker | null>(null);

    // ── Estado de fotos ─────────────────────────────────────────────────────
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [createdPetId, setCreatedPetId] = useState<string | null>(null);
    const [createdAnnouncementId, setCreatedAnnouncementId] = useState<string | null>(null);
    const hasUploading = photos.some((p) => p.status === "uploading");

    // ── Fase pós-submissão (upload de fotos) ────────────────────────────────
    const [isUploadPhase, setIsUploadPhase] = useState(false);
    const doneCount = photos.filter((p) => p.status === "done").length;

    const API_KEY = import.meta.env.VITE_MAPTILER_KEY;

    // ── Carregar dados do usuário (phone) ───────────────────────────────────
    useEffect(() => {
        const user = getAuthUser();
        if (user?.phone) {
            setFormData((prev) => ({ ...prev, contactPhone: user.phone }));
        }
    }, []);

    // ── Carregar pets do usuário ao tipo LOST ────────────────────────────────
    useEffect(() => {
        if (formData.type === "LOST") {
            const fetchPets = async () => {
                setLoadingPets(true);
                try {
                    const token = getAuthToken();
                    if (!token) return;
                    const pets = await getMyPets();
                    setMyPets(pets);
                } catch {
                    // Silenciar — não impede o fluxo
                } finally {
                    setLoadingPets(false);
                }
            };
            fetchPets();
        }
    }, [formData.type]);

    // ── Auto-preencher ao selecionar pet existente ──────────────────────────
    useEffect(() => {
        if (formData.selectedPetId) {
            const pet = myPets.find((p) => p.id === formData.selectedPetId);
            if (pet) {
                setFormData((prev) => ({
                    ...prev,
                    petName: pet.name || prev.petName,
                    species: (pet.species as Species) || prev.species,
                    breed: pet.breed || prev.breed,
                    sex: (pet.sex as Sex) || prev.sex,
                    color: pet.color || prev.color,
                    eyeColor: pet.eyeColor || "",
                    age: pet.age || "",
                    distinctiveMarks: pet.distinctiveMarks || "",
                }));
            }
        }
    }, [formData.selectedPetId, myPets]);

    // ── Inicializar mapa na etapa 4 ─────────────────────────────────────────
    const initMap = useCallback(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${API_KEY}`,
            center: [-41.679051, -21.135639],
            zoom: 14,
            attributionControl: false,
        });

        map.current.addControl(new maplibregl.NavigationControl(), "top-right");

        // Ao clicar no mapa, posicionar marcador
        map.current.on("click", (e) => {
            const { lng, lat } = e.lngLat;
            setLocation({ lat, lng });
            placeMarker(lng, lat);
        });
    }, [API_KEY]);

    useEffect(() => {
        if (currentStep === 4) {
            // Pequeno delay para garantir que o container já está renderizado
            const timer = setTimeout(initMap, 100);
            return () => clearTimeout(timer);
        }
    }, [currentStep, initMap]);

    // Cleanup do mapa
    useEffect(() => {
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    const placeMarker = (lng: number, lat: number) => {
        if (!map.current) return;

        if (marker.current) {
            marker.current.setLngLat([lng, lat]);
        } else {
            marker.current = new maplibregl.Marker({
                color: "#F97316",
                draggable: true,
            })
                .setLngLat([lng, lat])
                .addTo(map.current);

            // Ao arrastar, atualizar coordenadas
            marker.current.on("dragend", () => {
                const lngLat = marker.current!.getLngLat();
                setLocation({ lat: lngLat.lat, lng: lngLat.lng });
            });
        }
    };

    // ── Buscar endereço (geocoding via MapTiler) ────────────────────────────
    const handleSearchAddress = async () => {
        if (!searchAddress.trim()) return;
        setSearchingAddress(true);
        setErrors((prev) => ({ ...prev, location: undefined }));

        try {
            const response = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(searchAddress)}.json?key=${API_KEY}&language=pt&country=BR`
            );
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                setLocation({ lat, lng });
                placeMarker(lng, lat);

                if (map.current) {
                    map.current.flyTo({ center: [lng, lat], zoom: 16 });
                }
            } else {
                setErrors((prev) => ({ ...prev, location: "Endereço não encontrado. Tente ser mais específico." }));
            }
        } catch {
            setErrors((prev) => ({ ...prev, location: "Erro ao buscar endereço. Tente novamente." }));
        } finally {
            setSearchingAddress(false);
        }
    };

    // ── Handlers do Formulário ──────────────────────────────────────────────

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        if (errors[id]) {
            setErrors((prev) => ({ ...prev, [id]: undefined }));
        }
    };

    const handleTypeChange = (type: AnnouncementType) => {
        setFormData((prev) => ({ ...prev, type, selectedPetId: "" }));
        if (errors.type) {
            setErrors((prev) => ({ ...prev, type: undefined }));
        }
    };

    // ── Navegação entre etapas ───────────────────────────────────────────────

    const handleNext = () => {
        const stepErrors = validateStep(currentStep, formData, location);
        if (Object.values(stepErrors).filter(Boolean).length > 0) {
            setErrors(stepErrors);
            return;
        }
        setErrors({});
        setCurrentStep((prev) => Math.min(prev + 1, 4));
    };

    const handleBack = () => {
        setErrors({});
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    // ── Submit Final ────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        const stepErrors = validateStep(4, formData, location);
        if (Object.values(stepErrors).filter(Boolean).length > 0) {
            setErrors(stepErrors);
            return;
        }

        const token = getAuthToken();
        if (!token) {
            setGlobalError("Você precisa estar logado para criar um anúncio.");
            return;
        }

        setLoading(true);
        setGlobalError("");

        try {
            const payload: any = {
                type: formData.type,
                description: formData.description || undefined,
                latitude: location!.lat,
                longitude: location!.lng,
                contactPhone: formData.contactPhone,
            };

            // Data do ocorrido
            if (formData.occurredAt) {
                payload.occurredAt = new Date(formData.occurredAt).toISOString();
            }

            // Pet existente ou novo
            if (formData.selectedPetId) {
                payload.petId = formData.selectedPetId;
                // Enviar também petData para atualizar campos extras
                payload.petData = {
                    name: formData.petName.trim(),
                    species: formData.species,
                    breed: formData.breed.trim(),
                    sex: formData.sex,
                    isCastrated: false,
                    color: formData.color.trim(),
                    eyeColor: formData.eyeColor.trim() || undefined,
                    age: formData.age.trim() || undefined,
                    distinctiveMarks: formData.distinctiveMarks.trim() || undefined,
                };
            } else {
                payload.petData = {
                    name: formData.petName.trim() || "Desconhecido",
                    species: formData.species,
                    breed: formData.breed.trim(),
                    sex: formData.sex,
                    isCastrated: false,
                    color: formData.color.trim(),
                    eyeColor: formData.eyeColor.trim() || undefined,
                    age: formData.age.trim() || undefined,
                    distinctiveMarks: formData.distinctiveMarks.trim() || undefined,
                };
            }

            const result = await createAnnouncement(payload);
            setCreatedPetId(result.petId);
            setCreatedAnnouncementId(result.id);

            // Se o pet já existia, busca as fotos que ele já possui no servidor
            if (formData.selectedPetId) {
                try {
                    const existingImages = await listPetImages(result.petId);
                    setPhotos(existingImages.map(img => ({
                        id: img.id,
                        previewUrl: img.url || "",
                        status: "done" as PhotoStatus,
                        uploadedImageId: img.id
                    })));
                } catch (e) {
                    console.error("Erro ao carregar fotos do pet", e);
                }
            }

            setIsUploadPhase(true);
            setSuccessMessage("Anúncio criado com sucesso! Você pode gerenciar as fotos abaixo.");
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.message ||
                "Erro ao criar anúncio. Tente novamente.";
            setGlobalError(message);
        } finally {
            setLoading(false);
        }
    };

    // ── Handle Cancelar Anúncio (Fase Upload) ───────────────────────────────

    const handleCancelAnnouncement = async () => {
        if (!createdAnnouncementId) return;
        try {
            setLoading(true);
            await deleteAnnouncement(createdAnnouncementId);
            navigate("/profile");
        } catch (err) {
            setGlobalError("Erro ao cancelar o anúncio. Tente novamente.");
            setLoading(false);
        }
    };

    // ── Handlers de Fotos (Fase de Upload) ──────────────────────────────────

    const processUpload = async (item: PhotoItem) => {
        if (!createdPetId || !item.file) return;

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
            const errorMsg = err.response?.data?.message || "Falha no upload";
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

        const remaining = 10 - photos.length;
        const filesToAdd = files.slice(0, remaining);

        const newItems: PhotoItem[] = filesToAdd.map((file) => ({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
            status: "uploading" as PhotoStatus,
        }));

        setPhotos((prev) => [...prev, ...newItems]);
        newItems.forEach((item) => processUpload(item));
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

    const handleFinish = () => {
        navigate("/profile");
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">

                {/* Cabeçalho */}
                <div className="mb-2 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isUploadPhase ? "Fotos do Animal" : "Criar Anúncio"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isUploadPhase
                            ? "Adicione fotos para facilitar a identificação."
                            : "Preencha as informações para criar o anúncio do pet."
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
                    FASE DE UPLOAD (pós-submissão)
                ═══════════════════════════════════════════════════════════ */}
                {isUploadPhase && (
                    <div className="space-y-4">
                        <div className="px-4 py-3 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-600">
                            <span className="font-medium text-gray-700">Anúncio:</span>{" "}
                            {formData.type === "LOST" ? "🔴 Animal Perdido" : "🟢 Animal Encontrado"} • {formData.petName || "Sem nome"} • {formData.species}
                        </div>

                        <PhotoUploader
                            photos={photos}
                            onFileChange={handleFileChange}
                            onRemove={handleRemovePhoto}
                            onRetry={handleRetry}
                            disabled={hasUploading}
                            maxReached={photos.length >= 10}
                        />

                        {photos.length > 0 && (
                            <p className="text-xs text-gray-400 text-center">
                                {doneCount} de {photos.length} foto(s) enviada(s)
                                {photos.length > 0 && ` • ${10 - photos.length} restante(s)`}
                            </p>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={handleCancelAnnouncement}
                                disabled={loading}
                                className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-bold py-2.5 rounded-md transition-colors"
                            >
                                Cancelar Anúncio
                            </button>
                            <button
                                type="button"
                                onClick={handleFinish}
                                disabled={hasUploading || doneCount === 0 || loading}
                                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-md transition-colors"
                            >
                                Concluir
                            </button>
                        </div>

                        {doneCount === 0 && !hasUploading && (
                            <p className="text-xs text-red-500 text-center">
                                ⚠️ Adicione pelo menos 1 foto para concluir o anúncio.
                            </p>
                        )}

                        {hasUploading && (
                            <p className="text-xs text-orange-500 text-center animate-pulse">
                                ⏳ Aguarde o envio das fotos...
                            </p>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    FORMULÁRIO MULTI-STEP
                ═══════════════════════════════════════════════════════════ */}
                {!isUploadPhase && (
                    <>
                        <StepIndicator currentStep={currentStep} />

                        {/* ── ETAPA 1: Tipo do Anúncio ──────────────────── */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                {/* Tipo (Cards) */}
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium text-gray-700">
                                        Tipo do Anúncio <span className="text-red-500">*</span>
                                    </span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleTypeChange("LOST")}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${formData.type === "LOST"
                                                ? "border-red-400 bg-red-50 shadow-sm"
                                                : "border-gray-200 hover:border-red-200 hover:bg-red-50/50"
                                                }`}
                                        >
                                            <span className="text-3xl">😿</span>
                                            <span className={`text-sm font-semibold ${formData.type === "LOST" ? "text-red-600" : "text-gray-600"}`}>
                                                Animal Perdido
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTypeChange("FOUND")}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${formData.type === "FOUND"
                                                ? "border-green-400 bg-green-50 shadow-sm"
                                                : "border-gray-200 hover:border-green-200 hover:bg-green-50/50"
                                                }`}
                                        >
                                            <span className="text-3xl">🐾</span>
                                            <span className={`text-sm font-semibold ${formData.type === "FOUND" ? "text-green-600" : "text-gray-600"}`}>
                                                Animal Encontrado
                                            </span>
                                        </button>
                                    </div>
                                    {errors.type && (
                                        <span role="alert" className="text-red-500 text-xs mt-0.5">{errors.type}</span>
                                    )}
                                </div>

                                {/* Seleção de pet existente (apenas para LOST) */}
                                {formData.type === "LOST" && (
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="selectedPetId" className="text-sm font-medium text-gray-700">
                                            Selecionar pet cadastrado
                                            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                                        </label>
                                        <select
                                            id="selectedPetId"
                                            value={formData.selectedPetId}
                                            onChange={handleChange}
                                            disabled={loadingPets}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 bg-white transition-colors"
                                        >
                                            <option value="">
                                                {loadingPets ? "Carregando seus pets..." : "Cadastrar novo pet no anúncio"}
                                            </option>
                                            {myPets.map((pet) => (
                                                <option key={pet.id} value={pet.id}>
                                                    {pet.name} — {pet.species} ({pet.breed})
                                                </option>
                                            ))}
                                        </select>
                                        <span className="text-xs text-gray-400">
                                            Se selecionar um pet, os dados serão auto-preenchidos.
                                        </span>
                                    </div>
                                )}

                                <FieldSelect
                                    id="species"
                                    label="Espécie"
                                    value={formData.species}
                                    onChange={handleChange}
                                    options={SPECIES_OPTIONS}
                                    required
                                    error={errors.species}
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
                            </div>
                        )}

                        {/* ── ETAPA 2: Características Físicas ──────────── */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <FieldInput
                                    id="breed"
                                    label="Raça"
                                    placeholder="Ex: Labrador, Siamês, Sem raça definida..."
                                    value={formData.breed}
                                    onChange={handleChange}
                                    required
                                    error={errors.breed}
                                />

                                <FieldInput
                                    id="color"
                                    label="Cor Predominante"
                                    placeholder="Ex: Caramelo, Preto e branco, Cinza..."
                                    value={formData.color}
                                    onChange={handleChange}
                                    required
                                    error={errors.color}
                                />

                                <FieldInput
                                    id="eyeColor"
                                    label="Cor dos Olhos"
                                    placeholder="Ex: Castanho, Azul, Verde..."
                                    value={formData.eyeColor}
                                    onChange={handleChange}
                                />

                                <FieldInput
                                    id="age"
                                    label="Idade Aproximada"
                                    placeholder="Ex: 2 anos, 6 meses, Filhote..."
                                    value={formData.age}
                                    onChange={handleChange}
                                />

                                <FieldTextarea
                                    id="distinctiveMarks"
                                    label="Sinais Particulares"
                                    placeholder="Ex: Rabo cortado, cicatriz na orelha, falta uma pata traseira..."
                                    value={formData.distinctiveMarks}
                                    onChange={handleChange}
                                    helpText="Descreva qualquer marca ou característica que ajude na identificação."
                                />
                            </div>
                        )}

                        {/* ── ETAPA 3: Informações Adicionais + Fotos ───── */}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <FieldInput
                                    id="petName"
                                    label="Nome do Pet"
                                    placeholder={formData.type === "FOUND" ? "Se souber o nome..." : "Ex: Rex, Bella, Thor..."}
                                    value={formData.petName}
                                    onChange={handleChange}
                                    required={formData.type === "LOST"}
                                    error={errors.petName}
                                />

                                <FieldTextarea
                                    id="description"
                                    label="Descrição"
                                    placeholder="Ex: Cachorro de porte médio, amigável, com coleira rosa escrito 'Juju', manca de uma perna..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    helpText="Descreva porte, comportamento, acessórios, qualquer detalhe relevante."
                                />
                            </div>
                        )}

                        {/* ── ETAPA 4: Localização + Contato ─────────────── */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                {/* Busca de endereço */}
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="addressSearch" className="text-sm font-medium text-gray-700">
                                        Buscar Endereço <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            id="addressSearch"
                                            placeholder="Ex: Rua das Flores, 123 - São Paulo"
                                            value={searchAddress}
                                            onChange={(e) => setSearchAddress(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleSearchAddress();
                                                }
                                            }}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSearchAddress}
                                            disabled={searchingAddress || !searchAddress.trim()}
                                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md transition-colors flex items-center gap-1"
                                        >
                                            {searchingAddress ? (
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            ) : (
                                                "🔍"
                                            )}
                                            Buscar
                                        </button>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        Busque o endereço e ajuste o ponto no mapa clicando ou arrastando o marcador.
                                    </span>
                                    {errors.location && (
                                        <span role="alert" className="text-red-500 text-xs mt-0.5">{errors.location}</span>
                                    )}
                                </div>

                                {/* Mapa */}
                                <div
                                    ref={mapContainer}
                                    className="w-full h-64 rounded-md border border-gray-300 overflow-hidden"
                                />

                                {/* Coordenadas selecionadas */}
                                {location && (
                                    <div className="px-3 py-2 rounded-md bg-green-50 border border-green-200 text-xs text-green-700 font-medium">
                                        📍 Localização selecionada: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                    </div>
                                )}

                                {/* Data do ocorrido */}
                                <FieldInput
                                    id="occurredAt"
                                    label="Data do Ocorrido"
                                    type="datetime-local"
                                    value={formData.occurredAt}
                                    onChange={handleChange}
                                    placeholder=""
                                />
                                <span className="text-xs text-gray-400 -mt-3 block">
                                    Se não informada, será considerada a data/hora atual.
                                </span>

                                {/* Telefone (preenchido e desabilitado) */}
                                <FieldInput
                                    id="contactPhone"
                                    label="Telefone para Contato"
                                    value={formData.contactPhone}
                                    onChange={handleChange}
                                    required
                                    disabled
                                    error={errors.contactPhone}
                                />
                            </div>
                        )}

                        {/* ── Botões de Navegação ────────────────────────── */}
                        <div className="flex gap-3 mt-6">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-md transition-colors"
                                >
                                    ← Anterior
                                </button>
                            )}

                            {currentStep < 4 && (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-md transition-colors"
                                >
                                    Próximo →
                                </button>
                            )}

                            {currentStep === 4 && (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    aria-busy={loading}
                                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
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
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                                            </svg>
                                            Criando anúncio...
                                        </>
                                    ) : (
                                        "Criar Anúncio"
                                    )}
                                </button>
                            )}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default CreatePetAnnouncementForm;
