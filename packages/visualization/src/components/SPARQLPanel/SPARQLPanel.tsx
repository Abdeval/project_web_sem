import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { QueryEditor } from './QueryEditor';
import { ResultsTable } from './ResultsTable';
import type { QueryResult } from './ResultsTable';

export type { QueryResult };

interface SPARQLPanelProps {
    onExecute?: (query: string) => Promise<QueryResult>;
    onExport?: (result: QueryResult, format: 'csv' | 'json' | 'xml') => void;
    queryHistory?: string[];
}

export const SPARQLPanel: React.FC<SPARQLPanelProps> = ({
    onExecute, onExport, queryHistory = [],
}) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const [query, setQuery] = useState('SELECT ?s ?p ?o WHERE {\n  ?s ?p ?o .\n}\nLIMIT 25');
    const [result, setResult] = useState<QueryResult | null>(null);
    const [isExecuting, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setHistory] = useState(false);

    const handleExecute = async () => {
        if (!onExecute || !query.trim()) return;
        setExecuting(true); setError(null);
        try { setResult(await onExecute(query)); }
        catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); setResult(null); }
        finally { setExecuting(false); }
    };

    const btn = (primary = false): React.CSSProperties => ({
        padding: '6px 14px',
        border: `1px solid ${primary ? c.accent : c.border}`,
        borderRadius: '7px',
        background: primary ? c.accent : 'transparent',
        color: primary ? c.textOnAccent : c.textPrimary,
        fontSize: '12px',
        fontWeight: primary ? 700 : 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Editor section */}
            <div style={{ flexShrink: 0, borderBottom: `1px solid ${c.border}` }}>

                {/* History bar */}
                {queryHistory.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: c.bgSecondary, borderBottom: `1px solid ${c.borderSubtle}` }}>
                        <button onClick={() => setHistory(!showHistory)} style={btn()}>
                            ⏱ History ({queryHistory.length})
                        </button>
                    </div>
                )}

                {showHistory && (
                    <div style={{ background: c.bgCard, borderBottom: `1px solid ${c.border}`, maxHeight: 150, overflowY: 'auto' }}>
                        {queryHistory.map((q, i) => (
                            <div key={i}
                                onClick={() => { setQuery(q); setHistory(false); }}
                                style={{ padding: '6px 16px', fontSize: '11px', color: c.textSecondary, cursor: 'pointer', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: `1px solid ${c.borderSubtle}` }}
                                onMouseEnter={e => e.currentTarget.style.background = c.bgHover}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {q}
                            </div>
                        ))}
                    </div>
                )}

                <QueryEditor value={query} onChange={setQuery} onExecute={handleExecute} />

                {/* Execute bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: c.bgSecondary }}>
                    <button onClick={handleExecute} disabled={isExecuting}
                        style={{ ...btn(true), opacity: isExecuting ? 0.7 : 1, cursor: isExecuting ? 'not-allowed' : 'pointer' }}>
                        {isExecuting ? '⏳ Executing...' : '▶ Execute'}
                    </button>
                    <button onClick={() => { setQuery(''); setResult(null); setError(null); }} style={btn()}>
                        ✕ Clear
                    </button>
                </div>
            </div>

            {/* Results section */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <ResultsTable
                    result={result}
                    error={error}
                    onExport={result && onExport ? (fmt) => onExport(result, fmt) : undefined}
                />
            </div>
        </div>
    );
};