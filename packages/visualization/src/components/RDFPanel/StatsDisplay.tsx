import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export interface RDFStats {
    tripleCount: number;
    subjectCount: number;
    predicateCount: number;
    objectCount: number;
    formatDetected?: string;
}

const StatCard: React.FC<{ label: string; value: number; color: string; bg: string }> = ({ label, value, color, bg }) => (
    <div style={{ background: bg, borderRadius: '8px', padding: '10px 14px' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
            {value.toLocaleString()}
        </div>
        <div style={{ fontSize: '11px', color, opacity: 0.7, fontWeight: 500 }}>{label}</div>
    </div>
);

export const StatsDisplay: React.FC<{ stats: RDFStats }> = ({ stats }) => {
    const { theme } = useTheme();
    const c = theme.colors;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <StatCard label="Triples" value={stats.tripleCount} color={c.accent} bg={`${c.accent}12`} />
                <StatCard label="Subjects" value={stats.subjectCount} color={c.nodeResource} bg={`${c.nodeResource}12`} />
                <StatCard label="Predicates" value={stats.predicateCount} color={c.nodeClass} bg={`${c.nodeClass}12`} />
                <StatCard label="Objects" value={stats.objectCount} color={c.nodeLiteral} bg={`${c.nodeLiteral}12`} />
            </div>
            {stats.formatDetected && (
                <div style={{ padding: '6px 12px', background: c.bgTertiary, borderRadius: '6px', fontSize: '11px', color: c.textSecondary, display: 'flex', gap: 6 }}>
                    <span>Format:</span>
                    <span style={{ fontWeight: 600, color: c.success, fontFamily: "'JetBrains Mono', monospace" }}>
                        {stats.formatDetected}
                    </span>
                </div>
            )}
        </div>
    );
};