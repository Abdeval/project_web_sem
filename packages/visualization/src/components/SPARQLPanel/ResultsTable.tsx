import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export interface QueryResult {
    type: 'select' | 'construct' | 'ask';
    variables?: string[];
    bindings?: Record<string, string>[];
    triples?: Array<{ subject: string; predicate: string; object: string }>;
    booleanResult?: boolean;
    executionTime?: number;
}

interface ResultsTableProps {
    result: QueryResult | null;
    error?: string | null;
    onExport?: (format: 'csv' | 'json' | 'xml') => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ result, error, onExport }) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const [fmt, setFmt] = useState<'csv' | 'json' | 'xml'>('csv');

    if (error) {
        return (
            <div style={{ margin: '12px', padding: '12px', background: `${c.error}12`, border: `1px solid ${c.error}44`, borderRadius: '8px', color: c.error, fontSize: '12px', fontFamily: 'monospace' }}>
                ⚠ {error}
            </div>
        );
    }

    if (!result) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 100, color: c.textMuted, gap: 8, fontSize: '12px' }}>
                <span style={{ fontSize: '24px', opacity: 0.4 }}>🔍</span>
                Execute a query to see results
            </div>
        );
    }

    if (result.type === 'ask') {
        return (
            <div style={{ padding: '16px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: '10px', background: result.booleanResult ? `${c.success}18` : `${c.error}18`, border: `1px solid ${result.booleanResult ? c.success : c.error}44` }}>
                    <span style={{ fontSize: '24px' }}>{result.booleanResult ? '✓' : '✗'}</span>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: result.booleanResult ? c.success : c.error }}>
                            {result.booleanResult ? 'TRUE' : 'FALSE'}
                        </div>
                        <div style={{ fontSize: '11px', color: c.textMuted }}>ASK result</div>
                    </div>
                </div>
            </div>
        );
    }

    if (result.type === 'select' && result.variables && result.bindings) {
        return (
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 14px', background: c.bgTertiary, borderBottom: `1px solid ${c.border}`, fontSize: '11px', color: c.textSecondary }}>
                    <span><span style={{ color: c.accent, fontWeight: 600 }}>{result.bindings.length}</span> results</span>
                    {result.executionTime && <span>in <span style={{ color: c.success, fontWeight: 600 }}>{result.executionTime}ms</span></span>}
                    <div style={{ flex: 1 }} />
                    {onExport && (
                        <>
                            <select value={fmt} onChange={e => setFmt(e.target.value as 'csv' | 'json' | 'xml')}
                                style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '5px', color: c.textSecondary, fontSize: '10px', padding: '2px 6px', cursor: 'pointer', outline: 'none' }}>
                                <option value="csv">CSV</option>
                                <option value="json">JSON</option>
                                <option value="xml">XML</option>
                            </select>
                            <button onClick={() => onExport(fmt)}
                                style={{ padding: '2px 8px', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: '5px', color: c.textPrimary, fontSize: '10px', cursor: 'pointer' }}>
                                ↓ Export
                            </button>
                        </>
                    )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'monospace' }}>
                        <thead>
                            <tr style={{ background: c.bgCard }}>
                                {result.variables.map(v => (
                                    <th key={v} style={{ padding: '8px 14px', textAlign: 'left', color: c.accent, fontWeight: 600, fontSize: '11px', borderBottom: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>?{v}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {result.bindings.map((row, i) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${c.borderSubtle}` }}
                                    onMouseEnter={e => e.currentTarget.style.background = c.bgHover}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    {result.variables!.map(v => (
                                        <td key={v} style={{ padding: '6px 14px', color: c.textPrimary, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row[v]}>
                                            {row[v] || ''}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return null;
};