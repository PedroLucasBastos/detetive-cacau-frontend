import './SidebarMenu.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface MenuItem {
    key: string;
    label: string;
    icon: string;
    active?: boolean;
}

// ─── Itens do Menu ────────────────────────────────────────────────────────────

const MENU_ITEMS: MenuItem[] = [
    { key: 'painel',    label: 'Painel de Busca',    icon: '⊞', active: true },
    { key: 'campanhas', label: 'Campanhas',           icon: '📣' },
    { key: 'destaque',  label: 'Pet em Destaque',     icon: '☆' },
    { key: 'cartaz',    label: 'Gerador de Cartaz',   icon: '📄' },
    { key: 'imagem',    label: 'Gerador de Imagem',   icon: '🖼️' },
    { key: 'similares', label: 'Pets Similares',      icon: '🐾' },
    { key: 'carro-som', label: 'Carro de Som',        icon: '📢' },
    { key: 'descontos', label: 'Clube de Descontos',  icon: '🛒' },
    { key: 'mensagens', label: 'Mensagens',           icon: '✉️' },
    { key: 'perfil',    label: 'Perfil do Pet',       icon: '👤' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

function SidebarMenu() {
    return (
        <nav className="sidebar-menu" aria-label="Menu do painel de busca">
            <ul className="sidebar-menu__list">
                {MENU_ITEMS.map((item) => (
                    <li key={item.key}>
                        <button
                            type="button"
                            className={`sidebar-menu__item ${item.active ? 'sidebar-menu__item--active' : 'sidebar-menu__item--disabled'}`}
                            aria-current={item.active ? 'page' : undefined}
                            disabled={!item.active}
                            tabIndex={item.active ? 0 : -1}
                        >
                            <span className="sidebar-menu__icon" aria-hidden="true">
                                {item.icon}
                            </span>
                            <span className="sidebar-menu__label">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default SidebarMenu;
