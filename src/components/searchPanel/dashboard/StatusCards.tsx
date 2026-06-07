import { Skeleton } from '@mantine/core';
import './StatusCards.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface StatusCard {
    key: string;
    icon: string;
    iconBg: string;
    label: string;
    value: string;
    valueClass?: string;
}

interface StatusCardsProps {
    loading?: boolean;
    // TODO: substituir por dados reais via API quando endpoints estiverem disponíveis
    // Campos esperados: spotlightStatus, profileCompleteness, messageCount, hasFreeAd
}

// ─── Dados mockados (aguardando endpoints da API) ─────────────────────────────
// ⚠️  AFAZERES: Criar endpoints para:
//   - GET /api/pets/:petId/spotlight  → status do pet em destaque
//   - GET /api/pets/:petId/messages   → contagem de mensagens recebidas
//   - GET /api/pets/:petId/ad         → status do anúncio gratuito (Facebook etc.)
//   - perfil do pet (% de completude) → pode ser calculado no frontend com os campos do pet

const MOCK_CARDS: StatusCard[] = [
    {
        key: 'spotlight',
        icon: '☆',
        iconBg: '#f5ede4',
        label: 'PET EM DESTAQUE',
        value: 'Inativo',
    },
    {
        key: 'profile',
        icon: '🐾',
        iconBg: '#f5ede4',
        label: 'PERFIL DO PET',
        value: '100% completo',
    },
    {
        key: 'messages',
        icon: '✉️',
        iconBg: '#fef3f0',
        label: 'MENSAGENS',
        value: '0 mensagens',
        valueClass: 'status-cards__value--highlight',
    },
    {
        key: 'ad',
        icon: '📘',
        iconBg: '#eef2ff',
        label: 'ANÚNCIO GRATUITO',
        value: 'Veja no facebook',
        valueClass: 'status-cards__value--link',
    },
];

// ─── Componente ───────────────────────────────────────────────────────────────

function StatusCards({ loading = false }: StatusCardsProps) {
    return (
        <div className="status-cards" role="list" aria-label="Cards de status do pet">
            {MOCK_CARDS.map((card) => (
                <div key={card.key} className="status-cards__card" role="listitem">
                    {loading ? (
                        <>
                            <Skeleton circle height={40} width={40} mb={8} />
                            <Skeleton height={10} width={80} mb={6} />
                            <Skeleton height={14} width={60} />
                        </>
                    ) : (
                        <>
                            <div
                                className="status-cards__icon-wrap"
                                style={{ backgroundColor: card.iconBg }}
                                aria-hidden="true"
                            >
                                {card.icon}
                            </div>
                            <div className="status-cards__content">
                                <span className="status-cards__label">{card.label}</span>
                                <span className={`status-cards__value ${card.valueClass ?? ''}`}>
                                    {card.value}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}

export default StatusCards;
