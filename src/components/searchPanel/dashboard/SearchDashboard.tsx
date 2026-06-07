import { Skeleton } from '@mantine/core';
import StatusCards from './StatusCards';
import CampaignSection from './CampaignSection';
import ChecklistSection from './ChecklistSection';
import type { PetDetail } from '../../../services/petService';
import './SearchDashboard.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SearchDashboardProps {
    pet: PetDetail | null;
    loading: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

function SearchDashboard({ pet, loading }: SearchDashboardProps) {
    return (
        <main className="search-dashboard" aria-label="Painel de busca principal">
            {/* Título da seção */}
            <div className="search-dashboard__header">
                {loading ? (
                    <>
                        <Skeleton height={20} width={160} mb={6} />
                        <Skeleton height={13} width={240} />
                    </>
                ) : (
                    <>
                        <h1 className="search-dashboard__title">
                            <span className="search-dashboard__title-icon" aria-hidden="true">⊞</span>
                            Painel de Busca
                        </h1>
                        <p className="search-dashboard__subtitle">
                            Ferramentas para encontrar seu pet perdido
                        </p>
                    </>
                )}
            </div>

            <div className="search-dashboard__divider" />

            {/* Cards de status superiores */}
            <StatusCards loading={loading} />

            {/* Área de conteúdo principal: campanha + checklist */}
            <div className="search-dashboard__content">
                <div className="search-dashboard__campaign">
                    <CampaignSection pet={pet} loading={loading} />
                </div>
                <div className="search-dashboard__checklist">
                    <ChecklistSection />
                </div>
            </div>
        </main>
    );
}

export default SearchDashboard;
