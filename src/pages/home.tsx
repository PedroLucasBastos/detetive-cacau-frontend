import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeMap from '../components/map/HomeMap';
import { getPetsNearby } from '../services/petService';
import type { PetMapData } from '../services/petService';
import { useUserLocation } from '../hooks/useUserLocation';
import './home.css';

// Coordenada padrão (mesma do HomeMap)
const DEFAULT_CENTER: [number, number] = [-41.679051, -21.135639];

type MapFilter = 'todos' | 'perdidos' | 'encontrados';

function Home() {
    const navigate = useNavigate();
    const { location: userLocation } = useUserLocation();
    const [recentPets, setRecentPets] = useState<PetMapData[]>([]);
    const [mapFilter, setMapFilter] = useState<MapFilter>('todos');
    const [searchPet, setSearchPet] = useState('');
    const [searchLocation, setSearchLocation] = useState('');

    useEffect(() => {
        const [lng, lat] = userLocation ?? DEFAULT_CENTER;
        getPetsNearby(lat, lng, 5000)
            .then(pets => setRecentPets(pets.slice(0, 6)))
            .catch(err => console.error('Erro ao carregar pets recentes:', err));
    }, [userLocation]);

    const getPetEmoji = (species: string) => {
        if (species === 'Cachorro') return '🐶';
        if (species === 'Gato') return '🐱';
        return '🐾';
    };

    const formatTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return 'Data desconhecida';
        const date = new Date(dateStr);
        const now = new Date();
        const diffHrs = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffHrs < 1) return 'Há menos de 1 hora';
        if (diffHrs === 1) return 'Há 1 hora';
        if (diffHrs < 24) return `Há ${diffHrs} horas`;
        const diffDays = Math.floor(diffHrs / 24);
        return diffDays === 1 ? 'Há 1 dia' : `Há ${diffDays} dias`;
    };

    const formatDistance = (meters: number) => {
        if (meters < 1000) return `${Math.round(meters)}m de distância`;
        return `${(meters / 1000).toFixed(1)}km de distância`;
    };

    return (
        <main className="home-page">

            {/* ══ HERO ══════════════════════════════════════════════════════ */}
            <section className="home-hero">
                <div className="home-hero__inner">

                    {/* Conteúdo (coluna esquerda) */}
                    <div className="home-hero__content">
                        <h2 className="home-hero__title">
                            Encontre seu pet perdido
                        </h2>
                        <p className="home-hero__subtitle">
                            Utilize ferramentas de busca de pets com eficácia comprovada.
                            Ajude a comunidade a trazer alegria de volta para casa e encontre seu melhor amigo.
                        </p>

                        <div className="home-hero__cta-group">
                            {/* Perdi meu Pet */}
                            <button
                                className="home-cta-btn home-cta-btn--primary"
                                onClick={() => navigate('/criar-anuncio')}
                            >
                                <div className="home-cta-btn__icon">
                                    <span className="material-symbols-outlined">search</span>
                                </div>
                                <div className="home-cta-btn__text">
                                    <p className="home-cta-btn__label">Perdi meu Pet</p>
                                    <p className="home-cta-btn__sublabel">Quero buscar meu pet</p>
                                </div>
                            </button>

                            {/* Achei um Pet */}
                            <button
                                className="home-cta-btn home-cta-btn--secondary"
                                onClick={() => navigate('/criar-anuncio')}
                            >
                                <div className="home-cta-btn__icon home-cta-btn__icon--secondary">
                                    <span className="material-symbols-outlined">person_search</span>
                                </div>
                                <div className="home-cta-btn__text">
                                    <p className="home-cta-btn__label">Achei um Pet</p>
                                    <p className="home-cta-btn__sublabel home-cta-btn__sublabel--secondary">
                                        Quero buscar o tutor
                                    </p>
                                </div>
                            </button>
                        </div>

                        <a className="home-hero__how-link" href="#como-funciona">
                            <span className="material-symbols-outlined home-hero__how-icon">help</span>
                            <span>Como a busca funciona?</span>
                            <span className="material-symbols-outlined home-hero__how-arrow">arrow_forward</span>
                        </a>
                    </div>

                    {/* Imagem (coluna direita) */}
                    <div className="home-hero__image-wrapper">
                        <div className="home-hero__image-glow" />
                        <img
                            src="./img/dogRunHome.png"
                            alt="Pessoa abraçando um cachorro feliz"
                            className="home-hero__image"
                        />
                    </div>
                </div>
            </section>

            {/* ══ BARRA DE BUSCA (visual) ═══════════════════════════════════ */}
            <section className="home-search">
                <div className="home-search__inner">
                    <div className="home-search__bar">
                        <div className="home-search__field">
                            <span className="material-symbols-outlined home-search__icon">search</span>
                            <input
                                type="text"
                                className="home-search__input"
                                placeholder="Busque por raça, cor, ou nome do pet..."
                                value={searchPet}
                                onChange={e => setSearchPet(e.target.value)}
                            />
                        </div>
                        <div className="home-search__field home-search__field--location">
                            <span className="material-symbols-outlined home-search__icon">location_on</span>
                            <input
                                type="text"
                                className="home-search__input"
                                placeholder="Cidade ou Bairro"
                                value={searchLocation}
                                onChange={e => setSearchLocation(e.target.value)}
                            />
                        </div>
                        <button className="home-search__btn">
                            Buscar no Mapa
                        </button>
                    </div>
                </div>
            </section>

            {/* ══ MAPA + RECENTES ═══════════════════════════════════════════ */}
            <section className="home-map-section">

                {/* Mapa interativo */}
                <div className="home-map-wrapper">
                    {/* Filtros sobrepostos ao mapa */}
                    <div className="home-map-filters">
                        {(['todos', 'perdidos', 'encontrados'] as MapFilter[]).map(f => (
                            <button
                                key={f}
                                className={`home-map-filter${mapFilter === f ? ' home-map-filter--active' : ''}`}
                                onClick={() => setMapFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    <HomeMap />
                </div>

                {/* Painel de Recentes */}
                <aside className="home-recent">
                    <div className="home-recent__header">
                        <h3 className="home-recent__title">Recentes</h3>
                        <a className="home-recent__see-all" href="#">
                            Ver todos
                            <span className="material-symbols-outlined home-recent__see-all-icon">arrow_forward</span>
                        </a>
                    </div>

                    <div className="home-recent__list">
                        {recentPets.length === 0 ? (
                            <p className="home-recent__empty">
                                Nenhum pet encontrado na sua região.
                            </p>
                        ) : (
                            recentPets.map(pet => (
                                <div key={pet.id} className="home-recent__card">
                                    <div className="home-recent__card-img">
                                        {pet.imageUrl ? (
                                            <img src={pet.imageUrl} alt={pet.name} />
                                        ) : (
                                            <span className="home-recent__card-emoji">
                                                {getPetEmoji(pet.species)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="home-recent__card-body">
                                        <div className="home-recent__card-header">
                                            <h4 className="home-recent__card-name">{pet.name}</h4>
                                            <span className="home-recent__badge home-recent__badge--lost">
                                                Perdido
                                            </span>
                                        </div>
                                        <p className="home-recent__card-location">
                                            {formatDistance(pet.distance_meters)}
                                        </p>
                                        <div className="home-recent__card-time">
                                            <span className="material-symbols-outlined home-recent__time-icon">
                                                schedule
                                            </span>
                                            {formatTimeAgo(pet.lostAt)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </section>
        </main>
    );
}

export default Home;
