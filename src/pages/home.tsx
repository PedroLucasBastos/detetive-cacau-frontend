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

const SearchIcon = ({ color = "currentColor", className }: { color?: string, className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={color}><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" /></svg>
);

const PersonSearchIcon = ({ color = "#E6BC47" }: { color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={color}><path d="M440-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T520-640q0-33-23.5-56.5T440-720q-33 0-56.5 23.5T360-640q0 33 23.5 56.5T440-560ZM884-20 756-148q-21 12-45 20t-51 8q-75 0-127.5-52.5T480-300q0-75 52.5-127.5T660-480q75 0 127.5 52.5T840-300q0 27-8 51t-20 45L940-76l-56 56ZM731-229q29-29 29-71t-29-71q-29-29-71-29t-71 29q-29 29-29 71t29 71q29 29 71 29t71-29Zm-611 69v-111q0-34 17-63t47-44q51-26 115-44t142-18q-12 18-20.5 38.5T407-359q-60 5-107 20.5T221-306q-10 5-15.5 14.5T200-271v31h207q5 22 13.5 42t20.5 38H120Zm320-480Zm-33 400Z" /></svg>
);

const ArrowForwardIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" /></svg>
);

const LocationOnIcon = ({ color = "currentColor", className }: { color?: string, className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={color}><path d="M536.5-503.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5ZM480-186q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" /></svg>
);

const ScheduleIcon = ({ color = "currentColor", className }: { color?: string, className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={color}><path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" /></svg>
);

const HelpIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M513.5-254.5Q528-269 528-290t-14.5-35.5Q499-340 478-340t-35.5 14.5Q428-311 428-290t14.5 35.5Q457-240 478-240t35.5-14.5ZM442-394h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>
);

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
                                    <SearchIcon color="#FFFFFF" />
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
                                    <PersonSearchIcon />
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
                            <HelpIcon className="home-hero__how-icon" />
                            <span>Como a busca funciona?</span>
                            <ArrowForwardIcon className="home-hero__how-arrow" />
                        </a>
                    </div>

                    {/* Imagem (coluna direita) */}
                    <div className="home-hero__image-wrapper">
                        <div className="home-hero__image-glow" />
                        <img
                            src="./img/dogRunHome.png"
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
                            <SearchIcon className="home-search__icon" color="#9CA3AF" />
                            <input
                                type="text"
                                className="home-search__input"
                                placeholder="Busque por raça, cor, ou nome do pet..."
                                value={searchPet}
                                onChange={e => setSearchPet(e.target.value)}
                            />
                        </div>
                        <div className="home-search__field home-search__field--location">
                            <LocationOnIcon className="home-search__icon" color="#9CA3AF" />
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
                            <ArrowForwardIcon className="home-recent__see-all-icon" />
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
                                            <ScheduleIcon className="home-recent__time-icon" color="#9CA3AF" />
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
