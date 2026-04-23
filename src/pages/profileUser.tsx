import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthToken, getAuthUser } from "../utils/auth";
import { listPetImages } from "../services/petImageService";
import type { PetImageRecord } from "../services/petImageService";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Pet {
    id: string;
    name: string;
    species: string;
    breed: string;
    status: string;
    images: { id: string; path: string }[];
}

interface PetWithThumb {
    pet: Pet;
    thumbUrl: string | null;
    loadingThumb: boolean;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

function ProfileUser() {
    const navigate = useNavigate();
    const [pets, setPets] = useState<PetWithThumb[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = getAuthUser();

    // Redirecionar para login se não autenticado
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate("/login", { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        const fetchPets = async () => {
            const token = getAuthToken();
            if (!token) {
                setError("Você precisa estar logado para ver seus pets.");
                setLoading(false);
                return;
            }

            try {
                const { data } = await axios.get<Pet[]>(
                    `${import.meta.env.VITE_API_URL}/api/pets`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Backend já retorna apenas os pets do usuário logado
                const petsWithThumbs: PetWithThumb[] = data.map((pet) => ({
                    pet,
                    thumbUrl: null,
                    loadingThumb: pet.images.length > 0,
                }));

                setPets(petsWithThumbs);
                setLoading(false);

                // Carregar thumbnails em paralelo (apenas para pets com imagens)
                petsWithThumbs.forEach(async (item, index) => {
                    if (item.pet.images.length === 0) return;

                    try {
                        const images: PetImageRecord[] = await listPetImages(item.pet.id);
                        const firstUrl = images[0]?.url || null;

                        setPets((prev) =>
                            prev.map((p, i) =>
                                i === index
                                    ? { ...p, thumbUrl: firstUrl, loadingThumb: false }
                                    : p
                            )
                        );
                    } catch {
                        setPets((prev) =>
                            prev.map((p, i) =>
                                i === index ? { ...p, loadingThumb: false } : p
                            )
                        );
                    }
                });
            } catch {
                setError("Erro ao carregar seus pets.");
                setLoading(false);
            }
        };

        fetchPets();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">

                {/* Cabeçalho */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Meu Perfil
                    </h1>
                    {user && (
                        <p className="text-sm text-gray-500 mt-1">
                            Olá, {user.name} 👋
                        </p>
                    )}
                </div>

                {/* Botão CTA — Criar Novo Anúncio */}
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => navigate("/criar-anuncio")}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">📢</span>
                        <span className="text-base">Criar Novo Anúncio</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-1.5">
                        Perdeu ou encontrou um animal? Crie um anúncio para ajudar.
                    </p>
                </div>

                {/* Seção de Pets */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        Meus Pets
                    </h2>

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <svg
                                className="animate-spin h-6 w-6 text-orange-400"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                aria-label="Carregando..."
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

                    {/* Erro */}
                    {error && (
                        <div
                            role="alert"
                            className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm"
                        >
                            {error}
                        </div>
                    )}

                    {/* Lista vazia */}
                    {!loading && !error && pets.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-lg mb-2">🐾</p>
                            <p className="text-sm">Você ainda não cadastrou nenhum pet.</p>
                        </div>
                    )}

                    {/* Grid de Pets */}
                    {!loading && pets.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {pets.map(({ pet, thumbUrl, loadingThumb }) => (
                                <div
                                    key={pet.id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {/* Foto */}
                                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                        {loadingThumb && (
                                            <svg
                                                className="animate-spin h-5 w-5 text-gray-300"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
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
                                        )}
                                        {!loadingThumb && thumbUrl && (
                                            <img
                                                src={thumbUrl}
                                                alt={`Foto de ${pet.name}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        {!loadingThumb && !thumbUrl && (
                                            <span className="text-3xl text-gray-300">
                                                {pet.species === "Canina" ? "🐶" : pet.species === "Felina" ? "🐱" : "🐾"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Nome */}
                                    <div className="px-3 py-2 text-center">
                                        <p className="text-sm font-medium text-gray-700 truncate">
                                            {pet.name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfileUser;