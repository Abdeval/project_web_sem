import React, { useState, useRef, useMemo } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { StatsDisplay } from './StatsDisplay';
import type { RDFStats } from './StatsDisplay';
import { shortenUri } from '../../graph/GraphMapper';
import type { Triple } from '../../graph/GraphMapper';

export type { RDFStats };

const PAGE_SIZE = 50;

interface RDFPanelProps {
  stats?: RDFStats | null;
  triples?: Triple[];
  onFileLoad?: (file: File) => void;
  onExport?: (format: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const EXPORT_FORMATS = ['Turtle (.ttl)', 'RDF/XML (.rdf)', 'N-Triples (.nt)'];

export const RDFPanel: React.FC<RDFPanelProps> = ({
  stats,
  triples = [],
  onFileLoad,
  onExport,
  isLoading = false,
  error,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [exportFormat, setExportFormat] = useState(EXPORT_FORMATS[0]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);

  const filteredTriples = useMemo(() => {
    if (!searchTerm.trim()) return triples;
    const t = searchTerm.toLowerCase();
    return triples.filter(
      (tr) =>
        tr.subject.toLowerCase().includes(t) ||
        tr.predicate.toLowerCase().includes(t) ||
        tr.object.toLowerCase().includes(t) ||
        shortenUri(tr.subject).toLowerCase().includes(t) ||
        shortenUri(tr.predicate).toLowerCase().includes(t) ||
        shortenUri(tr.object).toLowerCase().includes(t)
    );
  }, [triples, searchTerm]);

  const pageCount = Math.ceil(filteredTriples.length / PAGE_SIZE);
  const pageTriples = filteredTriples.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '16px',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Import */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: c.textMuted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Import RDF
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
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
          onMouseEnter={(e) => (e.currentTarget.style.background = c.accentHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = c.accent)}
        >
          {isLoading ? '⏳ Loading...' : '📁 Browse Files'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '10px 12px',
            background: `${c.error}18`,
            border: `1px solid ${c.error}44`,
            borderRadius: '8px',
            fontSize: '12px',
            color: c.error,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: c.textMuted,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Graph Statistics
          </div>
          <StatsDisplay stats={stats} />
        </div>
      )}

      {/* Export */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: c.textMuted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Export RDF
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            style={{
              flex: 1,
              background: c.bgCard,
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              color: c.textPrimary,
              fontSize: '12px',
              padding: '8px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {EXPORT_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            onClick={() => onExport?.(exportFormat)}
            style={{
              padding: '8px 16px',
              background: c.bgCard,
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              color: c.textPrimary,
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = c.accent;
              e.currentTarget.style.color = c.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = c.border;
              e.currentTarget.style.color = c.textPrimary;
            }}
          >
            ↓ Export
          </button>
        </div>
      </div>

      {/* Triple Browser */}
      {triples.length > 0 && (
        <div>
          <button
            onClick={() => setShowBrowser((b) => !b)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: c.bgCard,
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              color: c.textPrimary,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 600,
            }}
          >
            <span>🔍 Triple Browser ({triples.length.toLocaleString()})</span>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>
              {showBrowser ? '▲ Hide' : '▼ Show'}
            </span>
          </button>

          {showBrowser && (
            <div
              style={{
                marginTop: 8,
                border: `1px solid ${c.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
                background: c.bgCard,
              }}
            >
              {/* Search */}
              <div style={{ padding: '8px', borderBottom: `1px solid ${c.border}` }}>
                <input
                  type="text"
                  placeholder="Filter triples…"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    boxSizing: 'border-box',
                    background: c.bgTertiary,
                    border: `1px solid ${c.border}`,
                    borderRadius: '6px',
                    color: c.textPrimary,
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Header row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  padding: '6px 8px',
                  background: c.bgTertiary,
                  borderBottom: `1px solid ${c.border}`,
                  fontSize: '10px',
                  fontWeight: 700,
                  color: c.textMuted,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <span>Subject</span>
                <span>Predicate</span>
                <span>Object</span>
              </div>

              {/* Triple rows */}
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {pageTriples.length === 0 && (
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: c.textMuted,
                      fontSize: '12px',
                    }}
                  >
                    No matching triples
                  </div>
                )}
                {pageTriples.map((tr, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderBottom: `1px solid ${c.border}22`,
                      background: i % 2 === 0 ? 'transparent' : `${c.bgTertiary}88`,
                    }}
                  >
                    {[tr.subject, tr.predicate, tr.object].map((val, j) => (
                      <span
                        key={j}
                        title={val}
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: j === 1 ? c.accent : c.textPrimary,
                          paddingRight: 6,
                        }}
                      >
                        {shortenUri(val)}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pageCount > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderTop: `1px solid ${c.border}`,
                    fontSize: '11px',
                    color: c.textMuted,
                    background: c.bgTertiary,
                  }}
                >
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: page === 0 ? 'default' : 'pointer',
                      color: page === 0 ? c.textMuted : c.accent,
                      opacity: page === 0 ? 0.3 : 1,
                    }}
                  >
                    ← Prev
                  </button>
                  <span>
                    {page + 1} / {pageCount} ({filteredTriples.length.toLocaleString()} results)
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: page >= pageCount - 1 ? 'default' : 'pointer',
                      color: page >= pageCount - 1 ? c.textMuted : c.accent,
                      opacity: page >= pageCount - 1 ? 0.3 : 1,
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
