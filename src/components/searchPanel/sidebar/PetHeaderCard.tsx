import { Avatar, Button, Skeleton } from '@mantine/core';
import type { PetDetail } from '../../../services/petService';
import './PetHeaderCard.css';

interface PetHeaderCardProps {
    pet: PetDetail | null;
    loading: boolean;
    avatarUrl: string | null;
    onMarkAsFound: () => void;
}

function PetHeaderCard({ pet, loading, avatarUrl, onMarkAsFound }: PetHeaderCardProps) {
    return (
        <div className="pet-header-card">
            <div className="pet-header-card__identity">
                {loading ? (
                    <Skeleton circle height={52} width={52} />
                ) : (
                    <Avatar
                        src={avatarUrl}
                        alt={pet?.name ?? 'Pet'}
                        size={52}
                        radius="xl"
                        className="pet-header-card__avatar"
                    >
                        🐾
                    </Avatar>
                )}

                <div className="pet-header-card__info">
                    {loading ? (
                        <>
                            <Skeleton height={14} width={80} mb={4} />
                            <Skeleton height={10} width={50} />
                        </>
                    ) : (
                        <>
                            <span className="pet-header-card__name">{pet?.name ?? '—'}</span>
                            <span className="pet-header-card__badge">
                                ★
                            </span>
                        </>
                    )}
                </div>
            </div>

            <Button
                fullWidth
                className="pet-header-card__found-btn"
                onClick={onMarkAsFound}
                disabled={loading}
            >
                <span className="pet-header-card__found-btn-icon">👤</span>
                Marcar como encontrado
            </Button>
        </div>
    );
}

export default PetHeaderCard;
