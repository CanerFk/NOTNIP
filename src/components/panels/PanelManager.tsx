import { useStore } from '../../store/useStore';
import { RetroPanel } from './RetroPanel';
import { QuickNotePanel } from './QuickNotePanel';
import { PomodoroPanel } from './PomodoroPanel';
import { CalendarPanel } from './CalendarPanel';

export function PanelManager() {
    const { panels, closePanel, updatePanelPosition } = useStore();

    const renderPanelContent = (type: string) => {
        switch (type) {
            case 'quicknote':
                return <QuickNotePanel />;
            case 'pomodoro':
                return <PomodoroPanel />;
            case 'calendar':
                return <CalendarPanel />;
            default:
                return <div className="p-4 text-muted">Unknown panel type</div>;
        }
    };

    const getPanelTitle = (type: string) => {
        switch (type) {
            case 'quicknote':
                return 'Quick Note';
            case 'pomodoro':
                return 'Pomodoro';
            case 'calendar':
                return 'Calendar & Tasks';
            default:
                return 'Panel';
        }
    };

    const getPanelSize = (type: string) => {
        switch (type) {
            case 'pomodoro':
                return { width: 280, height: 360 };
            case 'calendar':
                return { width: 280, height: 380 };
            case 'quicknote':
                return { width: 340, height: 340 };
            default:
                return { width: 320, height: 240 };
        }
    };

    return (
        <>
            {panels.map((panel) => {
                const size = getPanelSize(panel.type);
                return (
                    <RetroPanel
                        key={panel.id}
                        id={panel.id}
                        title={getPanelTitle(panel.type)}
                        initialPosition={panel.position}
                        onClose={() => closePanel(panel.id)}
                        onPositionChange={(pos) => updatePanelPosition(panel.id, pos)}
                        width={size.width}
                        height={size.height}
                    >
                        {renderPanelContent(panel.type)}
                    </RetroPanel>
                );
            })}
        </>
    );
}
