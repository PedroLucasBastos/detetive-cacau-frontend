import { Button, Skeleton } from '@mantine/core';
import type { PetDetail } from '../../../services/petService';
import './CampaignSection.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CampaignSectionProps {
    pet: PetDetail | null;
    loading?: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────
// ⚠️  AFAZERES: Criar endpoints para:
//   - GET /api/pets/:petId/campaign     → dados da campanha ativa (pessoas alertadas, raio, status)
//   - POST /api/pets/:petId/campaign    → criar campanha
//   - GET /api/pets/:petId/campaign/demo → dados de demonstração

function CampaignSection({ pet, loading = false }: CampaignSectionProps) {
    // Usa a última localização do pet para exibir o mapa futuramente
    const lastLocation = pet?.locations?.[0] ?? null;

    return (
        <div className="campaign-section">
            {/* Cabeçalho */}
            <div className="campaign-section__header">
                <div className="campaign-section__header-text">
                    <h2 className="campaign-section__title">Campanha de Divulgação</h2>
                    <p className="campaign-section__subtitle">
                        Alcance{' '}
                        <a
                            href="#"
                            className="campaign-section__subtitle-link"
                            onClick={(e) => e.preventDefault()}
                        >
                            milhares de pessoas próximas em poucos minutos
                        </a>{' '}
                        com anúncios patrocinados
                    </p>
                </div>
                <button
                    type="button"
                    className="campaign-section__more-btn"
                    aria-label="Mais opções"
                >
                    ···
                </button>
            </div>

            {/* Banner de demonstração */}
            <div className="campaign-section__demo-banner">
                {loading ? (
                    <Skeleton height={36} radius="sm" />
                ) : (
                    <span>Demonstração de Campanha em Andamento</span>
                )}
            </div>

            {/* Stats */}
            <div className="campaign-section__stats">
                <div className="campaign-section__stat-card">
                    {loading ? (
                        <>
                            <Skeleton circle height={36} width={36} mb={6} />
                            <Skeleton height={10} width={80} mb={4} />
                            <Skeleton height={20} width={60} />
                        </>
                    ) : (
                        <>
                            <span className="campaign-section__stat-icon" aria-hidden="true">👥</span>
                            <span className="campaign-section__stat-label">PESSOAS ALERTADAS</span>
                            <span className="campaign-section__stat-value">
                                26.640
                                <span className="campaign-section__stat-trend">↑</span>
                            </span>
                        </>
                    )}
                </div>

                <div className="campaign-section__stat-card">
                    {loading ? (
                        <>
                            <Skeleton circle height={36} width={36} mb={6} />
                            <Skeleton height={10} width={80} mb={4} />
                            <Skeleton height={20} width={60} />
                        </>
                    ) : (
                        <>
                            <span className="campaign-section__stat-icon" aria-hidden="true">🎯</span>
                            <span className="campaign-section__stat-label">RAIO DE ALCANCE</span>
                            <span className="campaign-section__stat-value">5 quilômetros</span>
                        </>
                    )}
                </div>
            </div>

            {/* Mapa placeholder */}
            <div className="campaign-section__map" aria-label="Mapa de localização da campanha">
                {loading ? (
                    <Skeleton height={200} radius="md" />
                ) : (
                    <div className="campaign-section__map-placeholder">
                        <div className="campaign-section__map-label">
                            {lastLocation
                                ? `${lastLocation.latitude.toFixed(4)}, ${lastLocation.longitude.toFixed(4)}`
                                : 'Localização não informada'}
                        </div>
                        {/* TODO: Integrar componente de mapa real (ex: LeafletMap) */}
                        <div className="campaign-section__map-bg" aria-hidden="true" />
                    </div>
                )}
            </div>

            {/* Ações */}
            <div className="campaign-section__actions">
                <Button className="campaign-section__btn-primary">
                    Criar Campanha
                </Button>
                <Button variant="outline" className="campaign-section__btn-outline">
                    Ver Demonstração
                </Button>
            </div>
        </div>
    );
}

export default CampaignSection;
