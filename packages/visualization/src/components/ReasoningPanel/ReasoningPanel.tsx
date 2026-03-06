import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { InferredTriplesView } from './InferredTriplesView';
import type { Triple } from '../../graph/GraphMapper';

export type ReasoningMode = 'RDFS' | 'OWL-RL' | 'OWL-EL' | 'OWL-QL';

interface ReasoningPanelProps {
    isEnabled?: boolean;
    mode?: ReasoningMode;
    inferredTriples?: Triple[];
    totalInferred?: number;
    isRunning?: boolean;
    onToggle?: (enabled: boolean) => void;
    onModeChange?: (mode: ReasoningMode) => void;
    onApply?: () => void;
}

const MODES: { value: ReasoningMode; label: string; description: string }[] = [
    { value: 'RDFS', label: 'RDFS', description: 'Class & property hierarchies' },
    { value: 'OWL-RL', label: 'OWL RL', description: 'Rule-based, scalable' },
    { value: 'OWL-EL', label: 'OWL EL', description: 'Polynomial time' },
    { value: 'OWL-QL', label: 'OWL QL', description: 'Query rewriting' },
];

export const ReasoningPanel: React.FC<ReasoningPanelProps> = ({
    isEnabled = false, mode = 'RDFS',
    inferredTriples = [], totalInferred = 0,
    isRunning = false, onToggle, onModeChange, onApply,
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Controls */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, background: c.bgSecondary, display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>

                {/* Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '13px', color: c.textPrimary, fontWeight: 600 }}>Reasoning Engine</div>
                        <div style={{ fontSize: '11px', color: c.textMuted, marginTop: 2 }}>
                            {isEnabled ? 'Active — deriving new knowledge' : 'Disabled — asserted triples only'}
                        </div>
                    </div>
                    <div
                        onClick={() => onToggle?.(!isEnabled)}
                        style={{ width: 44, height: 24, borderRadius: '12px', background: isEnabled ? c.success : c.bgActive, position: 'relative', cursor: 'pointer', transition: 'background 0.2s ease', flexShrink: 0 }}
                    >
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isEnabled ? 23 : 3, transition: 'left 0.2s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                    </div>
                </div>

                {/* Mode selector */}
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: c.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                        Formalism
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {MODES.map(m => (
                            <button
                                key={m.value}
                                onClick={() => onModeChange?.(m.value)}
                                style={{
                                    padding: '7px 10px',
                                    border: `1px solid ${mode === m.value ? c.accent : c.border}`,
                                    borderRadius: '8px',
                                    background: mode === m.value ? `${c.accent}18` : c.bgCard,
                                    color: mode === m.value ? c.accent : c.textSecondary,
                                    fontSize: '12px',
                                    fontWeight: mode === m.value ? 700 : 400,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <div>{m.label}</div>
                                <div style={{ fontSize: '10px', opacity: 0.65, marginTop: 1 }}>{m.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Apply button */}
                <button
                    onClick={onApply}
                    disabled={!isEnabled || isRunning}
                    style={{
                        padding: '8px',
                        background: isEnabled ? c.accent : c.bgCard,
                        border: `1px solid ${isEnabled ? c.accent : c.border}`,
                        borderRadius: '8px',
                        color: isEnabled ? c.textOnAccent : c.textMuted,
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: isEnabled && !isRunning ? 'pointer' : 'not-allowed',
                        opacity: !isEnabled || isRunning ? 0.6 : 1,
                    }}
                >
                    {isRunning ? '⏳ Reasoning...' : '🧠 Apply Reasoning'}
                </button>
            </div>

            {/* Inferred triples */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <InferredTriplesView triples={inferredTriples} totalCount={totalInferred} />
            </div>
        </div>
    );
};