import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetById, type PetDetail } from '../services/petService';
import { listPetImages, type PetImageRecord } from '../services/petImageService';
import { getAuthToken } from '../utils/auth';
import Sidebar from '../components/searchPanel/sidebar/Sidebar';
import SearchDashboard from '../components/searchPanel/dashboard/SearchDashboard';
import './SearchPanel.css';

// ─── Página principal do Painel de Busca ─────────────────────────────────────

function SearchPanel() {
    const { petId } = useParams<{ petId: string }>();
    const navigate = useNavigate();

    const [pet, setPet] = useState<PetDetail | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Autenticação ────────────────────────────────────────────────────────────
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    // ── Buscar dados do pet ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!petId) {
            setError('Pet não identificado.');
            setLoading(false);
            return;
        }

        const fetchPet = async () => {
            try {
                setLoading(true);
                const petData = await getPetById(petId);
                setPet(petData);

                // Buscar imagem principal do pet (avatar da sidebar)
                if (petData.images.length > 0) {
                    const images: PetImageRecord[] = await listPetImages(petId);
                    const mainImage = images.find((img) => img.order === 0) ?? images[0];
                    setAvatarUrl(mainImage?.url ?? null);
                }
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : '';
                if (errorMessage === 'FORBIDDEN') {
                    setError('Você não tem permissão para acessar este pet.');
                } else if (errorMessage === 'PET_NOT_FOUND') {
                    setError('Pet não encontrado.');
                } else {
                    setError('Erro ao carregar dados do pet. Tente novamente.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPet();
    }, [petId]);

    // ── Marcar como encontrado ──────────────────────────────────────────────────
    const handleMarkAsFound = () => {
        // TODO: Implementar chamada ao endpoint PUT /api/pets/:petId com status "FOUND"
        console.log('Marcar como encontrado:', petId);
    };

    // ── Erro de carregamento ────────────────────────────────────────────────────
    if (!loading && error) {
        return (
            <div className="search-panel__error" role="alert">
                <span>⚠️</span>
                <p>{error}</p>
                <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="search-panel__error-btn"
                >
                    Voltar ao perfil
                </button>
            </div>
        );
    }

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="search-panel">
            <Sidebar
                pet={pet}
                loading={loading}
                avatarUrl={avatarUrl}
                onMarkAsFound={handleMarkAsFound}
            />
            <SearchDashboard pet={pet} loading={loading} />
        </div>
    );
}

export default SearchPanel;