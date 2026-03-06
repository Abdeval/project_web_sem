import React, { useState, useRef } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { StatsDisplay } from './StatsDisplay';
import type { RDFStats } from './StatsDisplay';

export type { RDFStats };

interface RDFPanelProps {
    stats?: RDFStats | null;
    onFileLoad?: (file: File) => void;
    onExport?: (format: string) => void;
    isLoading?: boolean;
    error?: string | null;
}

const EXPORT_FORMATS = ['Turtle (.ttl)', 'RDF/XML (.rdf)', 'N-Triples (.nt)'];

export const RDFPanel: React.FC<RDFPanelProps> = ({
    stats, onFileLoad, onExport, isLoading = false, error,
}) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [exportFormat, setExportFormat] = useState(EXPORT_FORMATS[0]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileLoad?.(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFileLoad?.(file);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px', height: '100%', overflowY: 'auto' }}>

            {/* Import */}
            <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: c.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Import RDF
                </div>

                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragOver ? c.accent : c.border}`,
                        borderRadius: '10px',
                        padding: '24px 16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: dragOver ? `${c.accent}0a` : c.bgTertiary,
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div style={{ fontSize: '28px', marginBottom: 8 }}>📂</div>
                    <div style={{ fontSize: '13px', color: c.textPrimary, fontWeight: 500 }}>
                        Drop RDF file here
                    </div>
                    <div style={{ fontSize: '11px', color: c.textMuted, marginTop: 4 }}>
                        Supports: .ttl, .rdf, .owl, .nt, .n3
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".ttl,.rdf,.owl,.nt,.n3,.xml"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        width: '100%',
                        marginTop: 8,
                        padding: '8px',
                        background: c.accent,
                        border: 'none',
                        borderRadius: '8px',
                        color: c.textOnAccent,
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = c.accentHover}
                    onMouseLeave={e => e.currentTarget.style.background = c.accent}
                >
                    {isLoading ? '⏳ Loading...' : '📁 Browse Files'}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '10px 12px', background: `${c.error}18`, border: `1px solid ${c.error}44`, borderRadius: '8px', fontSize: '12px', color: c.error }}>
                    ⚠ {error}
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: c.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                        Graph Statistics
                    </div>
                    <StatsDisplay stats={stats} />
                </div>
            )}

            {/* Export */}
            <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: c.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Export RDF
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <select
                        value={exportFormat}
                        onChange={e => setExportFormat(e.target.value)}
                        style={{ flex: 1, background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '8px', color: c.textPrimary, fontSize: '12px', padding: '8px', cursor: 'pointer', outline: 'none' }}
                    >
                        {EXPORT_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <button
                        onClick={() => onExport?.(exportFormat)}
                        style={{ padding: '8px 16px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '8px', color: c.textPrimary, fontSize: '13px', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.color = c.accent; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textPrimary; }}
                    >
                        ↓ Export
                    </button>
                </div>
            </div>
        </div>
    );
};