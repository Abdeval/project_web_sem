import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import type { Triple } from '../../graph/GraphMapper';

interface InferredTriplesViewProps {
    triples: Triple[];
    totalCount: number;
}

const shorten = (uri: string): string =>
    uri.includes('#') ? uri.split('#').pop()! : uri.split('/').pop() ?? uri;

export const InferredTriplesView: React.FC<InferredTriplesViewProps> = ({ triples, totalCount }) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const [filter, setFilter] = useState('');

    const filtered = triples.filter(t =>
        [t.subject, t.predicate, t.object].some(v => v.toLowerCase().includes(filter.toLowerCase()))
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: `1px solid ${c.border}` }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: c.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Inferred Triples
                </span>
                {totalCount > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: 700, color: c.success, background: `${c.success}18`, padding: '2px 7px', borderRadius: '10px', fontFamily: 'monospace' }}>
                        +{totalCount}
                    </span>
                )}
                <div style={{ flex: 1 }} />
                {triples.length > 0 && (
                    <input
                        type="text"
                        placeholder="Filter..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        aria-label="Filter inferred triples"
                        style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '6px', color: c.textPrimary, fontSize: '11px', padding: '3px 8px', outline: 'none', width: 110 }}
                    />
                )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
                {triples.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80px', color: c.textMuted, gap: 6, fontSize: '12px' }}>
                        <span style={{ fontSize: '20px', opacity: 0.4 }}>🧠</span>
                        No inferred triples yet
                    </div>
                ) : (
                    filtered.map((t, i) => (
                        <div key={i}
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, padding: '5px 8px', borderRadius: '6px', marginBottom: 2, border: `1px solid ${c.edgeInferred}22`, background: `${c.edgeInferred}06`, fontSize: '10px', fontFamily: 'monospace' }}
                            onMouseEnter={e => e.currentTarget.style.background = `${c.edgeInferred}12`}
                            onMouseLeave={e => e.currentTarget.style.background = `${c.edgeInferred}06`}
                        >
                            <span style={{ color: c.nodeResource, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.subject}>{shorten(t.subject)}</span>
                            <span style={{ color: c.nodeClass, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.predicate}>{shorten(t.predicate)}</span>
                            <span style={{ color: c.nodeLiteral, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.object}>{shorten(t.object)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};