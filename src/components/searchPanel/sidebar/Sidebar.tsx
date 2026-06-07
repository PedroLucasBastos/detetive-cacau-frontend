import PetHeaderCard from './PetHeaderCard';
import SidebarMenu from './SidebarMenu';
import type { PetDetail } from '../../../services/petService';
import './Sidebar.css';

interface SidebarProps {
    pet: PetDetail | null;
    loading: boolean;
    avatarUrl: string | null;
    onMarkAsFound: () => void;
}

function Sidebar({ pet, loading, avatarUrl, onMarkAsFound }: SidebarProps) {
    return (
        <aside className="sidebar" aria-label="Menu lateral do painel">
            <PetHeaderCard
                pet={pet}
                loading={loading}
                avatarUrl={avatarUrl}
                onMarkAsFound={onMarkAsFound}
            />
            <SidebarMenu />
        </aside>
    );
}

export default Sidebar;
