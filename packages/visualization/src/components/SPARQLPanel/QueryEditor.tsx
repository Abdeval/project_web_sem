import React, { useRef } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

interface QueryEditorProps {
    value: string;
    onChange: (value: string) => void;
    onExecute: () => void;
}

const SAMPLES = [
    { label: 'All triples', query: 'SELECT ?s ?p ?o WHERE {\n  ?s ?p ?o .\n}\nLIMIT 25' },
    { label: 'All classes', query: 'SELECT ?class WHERE {\n  ?class a owl:Class .\n}' },
    { label: 'Subclasses', query: 'SELECT ?sub ?super WHERE {\n  ?sub rdfs:subClassOf ?super .\n}' },
    { label: 'ASK example', query: 'ASK {\n  ?s a owl:Class .\n}' },
];

export const QueryEditor: React.FC<QueryEditorProps> = ({ value, onChange, onExecute }) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const ref = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            onExecute();
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            const ta = ref.current!;
            const s = ta.selectionStart;
            const end = ta.selectionEnd;
            onChange(value.substring(0, s) + '  ' + value.substring(end));
            requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: `1px solid ${c.borderSubtle}`, background: c.bgSecondary }}>
                <span style={{ fontSize: '10px', color: c.textMuted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    SPARQL Editor
                </span>
                <div style={{ flex: 1 }} />
                <select
                    defaultValue=""
                    onChange={e => { const q = SAMPLES.find(s => s.label === e.target.value); if (q) onChange(q.query); e.target.value = ''; }}
                    style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '6px', color: c.textSecondary, fontSize: '11px', padding: '3px 8px', cursor: 'pointer', outline: 'none' }}
                >
                    <option value="" disabled>Samples…</option>
                    {SAMPLES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                </select>
                <span style={{ fontSize: '10px', color: c.textMuted }}>Ctrl+Enter to run</span>
            </div>

            {/* Textarea */}
            <textarea
                ref={ref}
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                aria-label="SPARQL query editor"
                style={{
                    width: '100%',
                    minHeight: 140,
                    maxHeight: 240,
                    resize: 'vertical',
                    background: c.editorBg,
                    border: 'none',
                    borderBottom: `1px solid ${c.border}`,
                    color: c.textPrimary,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: '13px',
                    lineHeight: 1.6,
                    padding: '12px 16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                }}
            />
        </div>
    );
};