/**
 * App.tsx
 * Design : Light/Dark cohérent sur toute la page
 * Accent  : Bleu électrique
 * Boutons : Gradient
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ThemeProvider, useTheme } from '@kg/visualization/theme/ThemeProvider';
import { GraphView } from '@kg/visualization/components/GraphView/GraphView';
import { RDFPanel } from '@kg/visualization/components/RDFPanel/RDFPanel';
import { OntologyPanel } from '@kg/visualization/components/OntologyPanel/OntologyPanel';
import { SPARQLPanel } from '@kg/visualization/components/SPARQLPanel/SPARQLPanel';
import { ReasoningPanel } from '@kg/visualization/components/ReasoningPanel/ReasoningPanel';
import type { Triple } from '@kg/visualization/graph/GraphMapper';
import type { RDFStats } from '@kg/visualization/components/RDFPanel/RDFPanel';
import type { QueryResult } from '@kg/visualization/components/SPARQLPanel/ResultsTable';
import type { ReasoningMode } from '@kg/visualization/components/ReasoningPanel/ReasoningPanel';
import type { OntologyClass, OntologyProperty } from '@kg/visualization/components/OntologyPanel/OntologyPanel';

// =============================================================================
// Theme tokens — light & dark
// =============================================================================
const makeTokens = (isDark: boolean) => ({
    // Backgrounds
    bgApp: isDark ? '#0d1117' : '#f4f6fb',
    bgSurface: isDark ? '#161b27' : '#ffffff',
    bgPanel: isDark ? '#131929' : '#f8fafc',
    bgHover: isDark ? '#1e2840' : '#f1f5f9',
    bgActive: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.07)',
    bgInput: isDark ? '#1a2236' : '#f8fafc',

    // Borders
    border: isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0',
    borderSub: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',

    // Text
    text1: isDark ? '#e2e8f0' : '#0f172a',
    text2: isDark ? '#8892a4' : '#64748b',
    text3: isDark ? '#4e5a6e' : '#94a3b8',

    // Accent blue
    blue: '#2563eb',
    blueLight: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)',
    blueBorder: isDark ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.25)',
    blueText: isDark ? '#60a5fa' : '#2563eb',

    // Status
    green: '#22c55e',
    greenBg: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)',
    amber: '#f59e0b',
});

// =============================================================================
// Static CSS (classes indépendantes du thème)
// =============================================================================
const STATIC_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.25); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.45); }

  /* Gradient primary button */
  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 7px 16px; border: none; border-radius: 8px; outline: none;
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: #fff;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    box-shadow: 0 1px 3px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
    cursor: pointer; white-space: nowrap;
    transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .btn-primary:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    box-shadow: 0 4px 14px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
    transform: translateY(-1px);
  }
  .btn-primary:active { transform: translateY(0px); box-shadow: 0 1px 4px rgba(37,99,235,0.3); }
  .btn-primary:disabled { opacity: 0.45; pointer-events: none; }

  /* Slide-in animation */
  @keyframes panelIn {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .panel-in { animation: panelIn 0.2s cubic-bezier(0.16,1,0.3,1) both; }

  /* Pulse dot */
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
  .pulse { animation: pulse 2s ease-in-out infinite; }
`;

// =============================================================================
// Sample data
// =============================================================================
const SAMPLE_TRIPLES: Triple[] = [
    { subject: 'http://example.org#Alice', predicate: 'http://xmlns.com/foaf/0.1/knows', object: 'http://example.org#Bob' },
    { subject: 'http://example.org#Alice', predicate: 'http://xmlns.com/foaf/0.1/name', object: 'Alice' },
    { subject: 'http://example.org#Alice', predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', object: 'http://xmlns.com/foaf/0.1/Person' },
    { subject: 'http://example.org#Bob', predicate: 'http://xmlns.com/foaf/0.1/knows', object: 'http://example.org#Carol' },
    { subject: 'http://example.org#Bob', predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', object: 'http://xmlns.com/foaf/0.1/Person' },
    { subject: 'http://example.org#Carol', predicate: 'http://xmlns.com/foaf/0.1/name', object: 'Carol' },
    { subject: 'http://example.org#Carol', predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', object: 'http://xmlns.com/foaf/0.1/Person' },
    { subject: 'http://xmlns.com/foaf/0.1/Person', predicate: 'http://www.w3.org/2000/01/rdf-schema#subClassOf', object: 'http://xmlns.com/foaf/0.1/Agent' },
];
const SAMPLE_CLASSES: OntologyClass[] = [
    {
        uri: 'http://xmlns.com/foaf/0.1/Agent', label: 'Agent', children: [
            { uri: 'http://xmlns.com/foaf/0.1/Person', label: 'Person', instanceCount: 3, children: [] },
        ]
    },
];
const SAMPLE_PROPERTIES: OntologyProperty[] = [
    { uri: 'http://xmlns.com/foaf/0.1/knows', label: 'knows', type: 'object', domain: 'Person', range: 'Person' },
    { uri: 'http://xmlns.com/foaf/0.1/name', label: 'name', type: 'datatype', domain: 'Person', range: 'string' },
];

type Panel = 'rdf' | 'ontology' | 'sparql' | 'reasoning';
const PANELS: { id: Panel; icon: string; label: string; getBadge: (t: number, i: number, h: number) => string }[] = [
    { id: 'rdf', icon: '⬡', label: 'RDF Data', getBadge: t => String(t) },
    { id: 'ontology', icon: '◈', label: 'Ontology', getBadge: () => '2' },
    { id: 'sparql', icon: '⌕', label: 'SPARQL', getBadge: (_t, _i, h) => h > 0 ? String(h) : '' },
    { id: 'reasoning', icon: '⟁', label: 'Reasoning', getBadge: (_t, i) => i > 0 ? `+${i}` : '' },
];

// =============================================================================
// AppInner
// =============================================================================
const AppInner: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();
    const T = makeTokens(isDark);

    const [activePanel, setActivePanel] = useState<Panel>('rdf');
    const [triples, setTriples] = useState<Triple[]>(SAMPLE_TRIPLES);
    const [rdfStats, setRdfStats] = useState<RDFStats | null>({ tripleCount: 8, subjectCount: 3, predicateCount: 4, objectCount: 6, formatDetected: 'Turtle' });
    const [rdfError, setRdfError] = useState<string | null>(null);
    const [rdfLoading, setRdfLoading] = useState(false);
    const [reasoningEnabled, setReasoningEnabled] = useState(false);
    const [reasoningMode, setReasoningMode] = useState<ReasoningMode>('RDFS');
    const [inferredTriples, setInferredTriples] = useState<Triple[]>([]);
    const [reasoningRunning, setReasoningRunning] = useState(false);
    const [status, setStatus] = useState('Ready — sample data loaded');
    const [queryHistory, setQueryHistory] = useState<string[]>([]);

    // Inject static CSS once
    useEffect(() => {
        if (!document.getElementById('kg-static')) {
            const s = document.createElement('style');
            s.id = 'kg-static'; s.textContent = STATIC_CSS;
            document.head.appendChild(s);
        }
    }, []);

    // Dynamic CSS (theme-dependent classes)
    useEffect(() => {
        let el = document.getElementById('kg-theme');
        if (!el) { el = document.createElement('style'); el.id = 'kg-theme'; document.head.appendChild(el); }
        el.textContent = `
      body { background: ${T.bgApp}; color: ${T.text1}; }
      ::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'}; }

      .btn-ghost {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 12px; border-radius: 8px; outline: none; cursor: pointer;
        font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
        background: transparent;
        color: ${T.text2};
        border: 1px solid ${T.border};
        transition: all 0.12s ease;
      }
      .btn-ghost:hover { background: ${T.bgHover}; color: ${T.text1}; border-color: ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}; }

      .nav-item {
        width: 100%; display: flex; align-items: center; gap: 10px;
        padding: 8px 10px; border: none; border-radius: 9px; outline: none; cursor: pointer;
        font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500;
        text-align: left; transition: all 0.12s ease;
        background: transparent; color: ${T.text2};
      }
      .nav-item:hover { background: ${T.bgHover}; color: ${T.text1}; }
      .nav-item.active { background: ${T.bgActive}; color: ${T.blueText}; font-weight: 600; }
      .nav-icon {
        width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center; font-size: 14px;
        background: ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'};
        transition: background 0.12s;
      }
      .nav-item.active .nav-icon { background: ${T.blueLight}; }
      .nav-badge {
        margin-left: auto; padding: 1px 7px; border-radius: 99px;
        font-size: 10px; font-weight: 600; font-family: 'JetBrains Mono', monospace;
        background: ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'};
        color: ${T.text2};
      }
      .nav-item.active .nav-badge { background: ${T.blueLight}; color: ${T.blueText}; }

      .stat-chip {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 10px; border-radius: 99px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px; font-weight: 500; border: 1px solid transparent;
      }

      .divider { height: 1px; background: ${T.border}; }
    `;
    }, [isDark, T]);

    // Electron
    useEffect(() => {
        const api = (window as any).electronAPI;
        if (!api) return;
        api.onOpenFile((p: string) => { setStatus(`Opening ${p}…`); setActivePanel('rdf'); });
        api.onExport(() => setActivePanel('rdf'));
        api.onToggleTheme(() => toggleTheme());
        return () => {
            api.removeAllListeners('menu:openFile');
            api.removeAllListeners('menu:export');
            api.removeAllListeners('menu:toggleTheme');
        };
    }, [toggleTheme]);

    // Handlers
    const handleFileLoad = useCallback(async (file: File) => {
        setRdfLoading(true); setRdfError(null); setStatus(`Loading ${file.name}…`);
        try {
            await new Promise(r => setTimeout(r, 800));
            setStatus(`Loaded ${file.name} — ${SAMPLE_TRIPLES.length} triples`);
            setRdfStats({ tripleCount: SAMPLE_TRIPLES.length, subjectCount: 10, predicateCount: 5, objectCount: 20, formatDetected: file.name.endsWith('.ttl') ? 'Turtle' : 'RDF/XML' });
        } catch (e: unknown) {
            setRdfError(e instanceof Error ? e.message : 'Failed'); setStatus('Error loading file');
        } finally { setRdfLoading(false); }
    }, []);

    const handleExport = useCallback(async (format: string) => {
        setStatus(`Exporting as ${format}…`);
        const ext = format.toLowerCase().includes('ttl') ? 'ttl' : format.toLowerCase().includes('rdf') ? 'rdf' : 'nt';
        const content = triples.map(t => t.object.startsWith('http') ? `<${t.subject}> <${t.predicate}> <${t.object}> .` : `<${t.subject}> <${t.predicate}> "${t.object}" .`).join('\n');
        const api = (window as any).electronAPI;
        if (api?.saveFile && api?.writeFile) {
            const fp = await api.saveFile(`export.${ext}`);
            if (!fp) { setStatus('Export cancelled'); return; }
            const r = await api.writeFile(fp, content);
            setStatus(r.success ? `✓ Saved to ${fp}` : `✗ ${r.error}`);
        } else {
            const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([content], { type: 'text/plain' })), download: `export.${ext}` });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(() => setStatus('✓ Export complete'), 500);
        }
    }, [triples]);

    const handleExecuteQuery = useCallback(async (query: string): Promise<QueryResult> => {
        setStatus('Executing query…');
        setQueryHistory(prev => [query, ...prev.slice(0, 9)]);
        await new Promise(r => setTimeout(r, 400));
        if (query.trim().toUpperCase().startsWith('ASK')) { setStatus('Query executed'); return { type: 'ask', booleanResult: true, executionTime: 8 }; }
        const bindings = triples.slice(0, 15).map(t => ({ s: t.subject, p: t.predicate, o: t.object }));
        setStatus(`${bindings.length} results`);
        return { type: 'select', variables: ['s', 'p', 'o'], bindings, executionTime: 21 };
    }, [triples]);

    const handleExportResults = useCallback((result: QueryResult, format: 'csv' | 'json' | 'xml') => {
        const vars = result.variables || [];
        let content = '', mime = 'text/plain';
        if (format === 'csv') { content = [vars.join(','), ...(result.bindings || []).map(r => vars.map(v => `"${(r[v] || '').replace(/"/g, '""')}"`).join(','))].join('\n'); mime = 'text/csv'; }
        else if (format === 'json') { content = JSON.stringify({ results: { bindings: result.bindings || [] } }, null, 2); mime = 'application/json'; }
        else { content = `<?xml version="1.0"?><sparql><results>${(result.bindings || []).map(r => `<r>${vars.map(v => `<binding name="${v}"><uri>${r[v] || ''}</uri></binding>`).join('')}</r>`).join('')}</results></sparql>`; mime = 'application/xml'; }
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([content], { type: mime })), download: `results.${format}` });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => setStatus(`✓ Exported as ${format.toUpperCase()}`), 500);
    }, []);

    const handleApplyReasoning = useCallback(async () => {
        setReasoningRunning(true); setStatus(`Running ${reasoningMode} reasoning…`);
        await new Promise(r => setTimeout(r, 1000));
        const inferred: Triple[] = [
            { subject: 'http://example.org#Alice', predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', object: 'http://xmlns.com/foaf/0.1/Agent', inferred: true },
            { subject: 'http://example.org#Bob', predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', object: 'http://xmlns.com/foaf/0.1/Agent', inferred: true },
            { subject: 'http://example.org#Alice', predicate: 'http://xmlns.com/foaf/0.1/knows', object: 'http://example.org#Carol', inferred: true },
        ];
        setInferredTriples(inferred);
        setTriples(prev => [...prev, ...inferred]);
        setStatus(`Done — +${inferred.length} inferred triples`);
        setReasoningRunning(false);
    }, [reasoningMode]);

    const activePanelInfo = PANELS.find(p => p.id === activePanel) ?? PANELS[0];
    const isLoading = rdfLoading || reasoningRunning;

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: T.bgApp, color: T.text1, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', transition: 'background 0.2s, color 0.2s' }}>

            {/* ═══════════════════════════════════════════════════════════════════
          TOP BAR
      ═══════════════════════════════════════════════════════════════════ */}
            <header style={{
                display: 'flex', alignItems: 'center', height: 52, flexShrink: 0,
                background: T.bgSurface,
                borderBottom: `1px solid ${T.border}`,
                padding: '0 20px', gap: 16,
                boxShadow: isDark ? '0 1px 0 rgba(255,255,255,0.04)' : '0 1px 3px rgba(0,0,0,0.06)',
                WebkitAppRegion: 'drag',
            } as React.CSSProperties}>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 10, fontSize: 16, color: '#fff', fontWeight: 700,
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(59,130,246,0.4)',
                    }}>⬡</div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Knowledge Graph</div>
                        <div style={{ fontSize: 10, color: T.text3, letterSpacing: '0.06em', fontWeight: 500 }}>DESKTOP</div>
                    </div>
                </div>

                <div style={{ width: 1, height: 24, background: T.border, flexShrink: 0 }} />

                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: T.text3 }}>Workspace</span>
                    <span style={{ fontSize: 12, color: T.text3 }}>/</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.blueText }}>{activePanelInfo.label}</span>
                </div>

                <div style={{ flex: 1 }} />

                {/* Stat chips */}
                <div style={{ display: 'flex', gap: 8, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <span className="stat-chip" style={{ background: T.blueLight, color: T.blueText, borderColor: T.blueBorder }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.blueText, flexShrink: 0 }} />
                        {triples.length} triples
                    </span>
                    {inferredTriples.length > 0 && (
                        <span className="stat-chip" style={{ background: T.greenBg, color: T.green, borderColor: 'rgba(34,197,94,0.3)' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, flexShrink: 0 }} />
                            +{inferredTriples.length} inferred
                        </span>
                    )}
                </div>

                {/* Theme toggle */}
                <button className="btn-ghost" onClick={toggleTheme}
                    style={{ WebkitAppRegion: 'no-drag', padding: '5px 11px', fontSize: 15, borderRadius: 9 } as React.CSSProperties}>
                    {isDark ? '☀️' : '🌙'}
                </button>
            </header>

            {/* ═══════════════════════════════════════════════════════════════════
          MAIN
      ═══════════════════════════════════════════════════════════════════ */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── Sidebar ── */}
                <aside style={{
                    width: 216, background: T.bgSurface, borderRight: `1px solid ${T.border}`,
                    display: 'flex', flexDirection: 'column', padding: '10px 8px',
                    gap: 2, flexShrink: 0, overflowY: 'auto',
                }}>
                    <div style={{ padding: '4px 8px 8px', fontSize: 10, fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Navigation
                    </div>

                    {PANELS.map(item => {
                        const isActive = activePanel === item.id;
                        const badge = item.getBadge(triples.length, inferredTriples.length, queryHistory.length);
                        return (
                            <button key={item.id} className={`nav-item${isActive ? ' active' : ''}`}
                                onClick={() => { setActivePanel(item.id); setStatus(`Viewing ${item.label}`); }}>
                                <span className="nav-icon">{item.icon}</span>
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {badge && <span className="nav-badge">{badge}</span>}
                            </button>
                        );
                    })}

                    {/* Bottom section */}
                    <div style={{ marginTop: 'auto' }}>
                        <div className="divider" style={{ margin: '12px 0' }} />
                        <div style={{ padding: '4px 10px', fontSize: 11, color: T.text3 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span>Format</span>
                                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T.blueText, fontWeight: 600, fontSize: 10 }}>
                                    {rdfStats?.formatDetected ?? '—'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Nodes</span>
                                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: T.text2 }}>
                                    {rdfStats?.subjectCount ?? 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── Panel ── */}
                <div style={{
                    width: 320, background: T.bgPanel, borderRight: `1px solid ${T.border}`,
                    display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
                    transition: 'background 0.2s',
                }}>
                    {/* Panel header */}
                    <div style={{
                        padding: '13px 16px 11px', flexShrink: 0,
                        background: T.bgSurface, borderBottom: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 34, height: 34, borderRadius: 10, fontSize: 17,
                                background: T.blueLight, border: `1px solid ${T.blueBorder}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: T.blueText,
                            }}>{activePanelInfo.icon}</div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{activePanelInfo.label}</div>
                                <div style={{ fontSize: 10, color: T.text3, marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
                                    {activePanel === 'rdf' ? `${triples.length} triples`
                                        : activePanel === 'sparql' ? `${queryHistory.length} queries`
                                            : activePanel === 'reasoning' ? `${inferredTriples.length} inferred`
                                                : '2 classes · 2 props'}
                                </div>
                            </div>
                        </div>
                        {isLoading && (
                            <div className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: T.blueText }} />
                        )}
                    </div>

                    {/* Panel body */}
                    <div key={activePanel} className="panel-in" style={{ flex: 1, overflow: 'hidden' }}>
                        {activePanel === 'rdf' && <RDFPanel stats={rdfStats} onFileLoad={handleFileLoad} onExport={handleExport} isLoading={rdfLoading} error={rdfError} />}
                        {activePanel === 'ontology' && <OntologyPanel classes={SAMPLE_CLASSES} properties={SAMPLE_PROPERTIES} onClassSelect={cls => setStatus(`Class: ${cls.label}`)} onPropertySelect={prop => setStatus(`Property: ${prop.label}`)} />}
                        {activePanel === 'sparql' && <SPARQLPanel onExecute={handleExecuteQuery} onExport={handleExportResults} queryHistory={queryHistory} />}
                        {activePanel === 'reasoning' && <ReasoningPanel isEnabled={reasoningEnabled} mode={reasoningMode} inferredTriples={inferredTriples} totalInferred={inferredTriples.length} isRunning={reasoningRunning} onToggle={setReasoningEnabled} onModeChange={setReasoningMode} onApply={handleApplyReasoning} />}
                    </div>
                </div>

                {/* ── Graph ── */}
                <div style={{ flex: 1, padding: 16, overflow: 'hidden', display: 'flex', background: T.bgApp }}>
                    <GraphView triples={triples} layout="force" />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
          STATUS BAR
      ═══════════════════════════════════════════════════════════════════ */}
            <footer style={{
                height: 30, flexShrink: 0,
                background: T.bgSurface, borderTop: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 7, height: 7, borderRadius: '50%', transition: 'all 0.3s',
                        background: isLoading ? T.amber : T.green,
                        boxShadow: isLoading ? `0 0 0 2px ${isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)'}` : `0 0 0 2px ${isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)'}`,
                    }} />
                    <span style={{ fontSize: 11, color: T.text3, fontFamily: "'JetBrains Mono',monospace" }}>{status}</span>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: 20 }}>
                    {[`${triples.length} triples`, `${inferredTriples.length} inferred`, isDark ? 'Dark' : 'Light'].map(txt => (
                        <span key={txt} style={{ fontSize: 11, color: T.text3, fontFamily: "'JetBrains Mono',monospace" }}>{txt}</span>
                    ))}
                </div>
            </footer>
        </div>
    );
};

// =============================================================================
// Root
// =============================================================================
const App: React.FC = () => (
    <ThemeProvider><AppInner /></ThemeProvider>
);

export default App;