import { Button, Progress } from '@mantine/core';
import './ChecklistSection.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ChecklistItem {
    key: string;
    label: string;
    done: boolean;
}

// ─── Dados mockados (aguardando endpoints da API) ─────────────────────────────
// ⚠️  AFAZERES: Criar endpoints para:
//   - GET /api/pets/:petId/checklist → retornar o estado de cada item do checklist
//   - PUT /api/pets/:petId/checklist/:itemKey → marcar/desmarcar item

const MOCK_CHECKLIST: ChecklistItem[] = [
    { key: 'campaign',      label: 'Ativar Campanha de Divulgação', done: false },
    { key: 'posters',       label: 'Espalhar cartazes',              done: false },
    { key: 'spotlight',     label: 'Colocar Pet em Destaque',        done: false },
    { key: 'search-area',   label: 'Buscar pessoalmente nas redondezas', done: false },
    { key: 'social',        label: 'Publicar em redes sociais',      done: false },
    { key: 'extension',     label: 'Instalar Extensor',              done: false },
    { key: 'mobilize',      label: 'Mobilizar pessoas da região',    done: false },
    { key: 'services',      label: 'Contatar serviços locais',       done: false },
    { key: 'free-ad',       label: 'Criar anúncio gratuito',         done: true  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

function ChecklistSection() {
    const totalItems = MOCK_CHECKLIST.length;
    const doneItems = MOCK_CHECKLIST.filter((item) => item.done).length;
    const progressValue = Math.round((doneItems / totalItems) * 100);

    return (
        <div className="checklist-section">
            {/* Perfil do Pet */}
            <div className="checklist-section__profile-block">
                <h3 className="checklist-section__block-title">Complete o perfil do pet</h3>
                <p className="checklist-section__block-subtitle">
                    100% completo — perfis completos aumentam suas chances
                </p>

                <Progress
                    value={100}
                    color="#2c1f14"
                    size="sm"
                    radius="xl"
                    className="checklist-section__progress"
                />

                <p className="checklist-section__profile-status">
                    <span className="checklist-section__check-icon">✅</span>
                    Perfil completo!
                </p>
            </div>

            <div className="checklist-section__divider" />

            {/* Checklist de Busca */}
            <div className="checklist-section__checklist-block">
                <h3 className="checklist-section__block-title">Checklist de Busca</h3>
                <p className="checklist-section__block-subtitle">
                    Siga os passos sugeridos para aumentar suas chances de reencontro
                </p>

                {/* Barra de progresso do checklist */}
                <div className="checklist-section__progress-row">
                    <Progress
                        value={progressValue}
                        color="#2c1f14"
                        size="sm"
                        radius="xl"
                        className="checklist-section__progress"
                    />
                    <span className="checklist-section__progress-pct">{progressValue}%</span>
                </div>

                <p className="checklist-section__counter">({doneItems}/{totalItems})</p>

                {/* Lista de itens */}
                <ul className="checklist-section__list" role="list">
                    {MOCK_CHECKLIST.map((item) => (
                        <li key={item.key} className="checklist-section__item">
                            <input
                                type="checkbox"
                                id={`checklist-${item.key}`}
                                className="checklist-section__checkbox"
                                defaultChecked={item.done}
                                readOnly
                                aria-label={item.label}
                            />
                            <label
                                htmlFor={`checklist-${item.key}`}
                                className={`checklist-section__item-label ${item.done ? 'checklist-section__item-label--done' : ''}`}
                            >
                                {item.label}
                            </label>
                        </li>
                    ))}
                </ul>

                <Button
                    fullWidth
                    variant="outline"
                    className="checklist-section__expand-btn"
                >
                    Ver todos os passos
                </Button>
            </div>
        </div>
    );
}

export default ChecklistSection;
