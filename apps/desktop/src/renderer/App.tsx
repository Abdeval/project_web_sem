/**
 * App.tsx
 * Main application — sidebar + panels + central graph view + status bar.
 */

import React, { useState, useCallback, useEffect } from 'react';

// ── Theme
import { ThemeProvider, useTheme } from '@kg/visualization/theme/ThemeProvider';

// ── Components
import { GraphView } from '@kg/visualization/components/GraphView/GraphView';
import { RDFPanel } from '@kg/visualization/components/RDFPanel/RDFPanel';
import { OntologyPanel } from '@kg/visualization/components/OntologyPanel/OntologyPanel';
import { SPARQLPanel } from '@kg/visualization/components/SPARQLPanel/SPARQLPanel';
import { ReasoningPanel } from '@kg/visualization/components/ReasoningPanel/ReasoningPanel';

// ── Types
import type { Triple } from '@kg/visualization/graph/GraphMapper';
import type { RDFStats } from '@kg/visualization/components/RDFPanel/RDFPanel';
import type { QueryResult } from '@kg/visualization/components/SPARQLPanel/ResultsTable';
import type { ReasoningMode } from '@kg/visualization/components/ReasoningPanel/ReasoningPanel';
import type { OntologyClass, OntologyProperty } from '@kg/visualization/components/OntologyPanel/OntologyPanel';
// =============================================================================
// Sample data
// =============================================================================

const SAMPLE_TRIPLES: Triple[] = [
    {
        subject: 'http://example.org#Alice',
        predicate: 'http://xmlns.com/foaf/0.1/knows',
        object: 'http://example.org#Bob',
    },
    {
        subject: 'http://example.org#Alice',
        predicate: 'http://xmlns.com/foaf/0.1/name',
        object: 'Alice',
    },
    {
        subject: 'http://example.org#Alice',
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        object: 'http://xmlns.com/foaf/0.1/Person',
    },
    {
        subject: 'http://example.org#Bob',
        predicate: 'http://xmlns.com/foaf/0.1/knows',
        object: 'http://example.org#Carol',
    },
    {
        subject: 'http://example.org#Bob',
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        object: 'http://xmlns.com/foaf/0.1/Person',
    },
    {
        subject: 'http://example.org#Carol',
        predicate: 'http://xmlns.com/foaf/0.1/name',
        object: 'Carol',
    },
    {
        subject: 'http://example.org#Carol',
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        object: 'http://xmlns.com/foaf/0.1/Person',
    },
    {
        subject: 'http://xmlns.com/foaf/0.1/Person',
        predicate: 'http://www.w3.org/2000/01/rdf-schema#subClassOf',
        object: 'http://xmlns.com/foaf/0.1/Agent',
    },
];

const SAMPLE_CLASSES: OntologyClass[] = [
    {
        uri: 'http://xmlns.com/foaf/0.1/Agent',
        label: 'Agent',
        children: [
            {
                uri: 'http://xmlns.com/foaf/0.1/Person',
                label: 'Person',
                instanceCount: 3,
                children: [],
            },
        ],
    },
];

const SAMPLE_PROPERTIES: OntologyProperty[] = [
    {
        uri: 'http://xmlns.com/foaf/0.1/knows',
        label: 'knows',
        type: 'object',
        domain: 'Person',
        range: 'Person',
    },
    {
        uri: 'http://xmlns.com/foaf/0.1/name',
        label: 'name',
        type: 'datatype',
        domain: 'Person',
        range: 'string',
    },
];

// =============================================================================
// Types
// =============================================================================

type Panel = 'rdf' | 'ontology' | 'sparql' | 'reasoning';

const PANELS: { id: Panel; icon: string; label: string }[] = [
    { id: 'rdf', icon: '📁', label: 'RDF' },
    { id: 'ontology', icon: '📊', label: 'Ontology' },
    { id: 'sparql', icon: '🔍', label: 'SPARQL' },
    { id: 'reasoning', icon: '🧠', label: 'Reasoning' },
];

// =============================================================================
// AppInner — uses theme context
// =============================================================================

const AppInner: React.FC = () => {
    const { theme, isDark, toggleTheme } = useTheme();
    const c = theme.colors;

    // ── State ──────────────────────────────────────────────────────────────────
    const [activePanel, setActivePanel] = useState<Panel>('rdf');
    const [triples, setTriples] = useState<Triple[]>(SAMPLE_TRIPLES);
    const [rdfStats, setRdfStats] = useState<RDFStats | null>({
        tripleCount: SAMPLE_TRIPLES.length,
        subjectCount: 3,
        predicateCount: 4,
        objectCount: 6,
        formatDetected: 'Turtle',
    });
    const [rdfError, setRdfError] = useState<string | null>(null);
    const [rdfLoading, setRdfLoading] = useState(false);
    const [reasoningEnabled, setReasoningEnabled] = useState(false);
    const [reasoningMode, setReasoningMode] = useState<ReasoningMode>('RDFS');
    const [inferredTriples, setInferredTriples] = useState<Triple[]>([]);
    const [reasoningRunning, setReasoningRunning] = useState(false);
    const [status, setStatus] = useState('Ready — sample data loaded');
    const [queryHistory, setQueryHistory] = useState<string[]>([]);

    // ── Listen to Electron menu events (only in Electron, not in browser) ──────
    useEffect(() => {
        const api = (window as Window & {
            electronAPI?: {
                onOpenFile: (cb: (path: string) => void) => void;
                onExport: (cb: () => void) => void;
                onToggleTheme: (cb: () => void) => void;
                removeAllListeners: (channel: string) => void;
            }
        }).electronAPI;

        if (!api) return; // running in browser, skip

        api.onOpenFile((filePath: string) => {
            setStatus(`Opening ${filePath}...`);
            setActivePanel('rdf');
        });

        api.onExport(() => {
            setActivePanel('rdf');
        });

        api.onToggleTheme(() => {
            toggleTheme();
        });

        return () => {
            api.removeAllListeners('menu:openFile');
            api.removeAllListeners('menu:export');
            api.removeAllListeners('menu:toggleTheme');
        };
    }, [toggleTheme]);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleFileLoad = useCallback(async (file: File) => {
        setRdfLoading(true);
        setRdfError(null);
        setStatus(`Loading ${file.name}...`);
        try {
            // Integration point → RDFManager.loadFromFile(file) from @kg/rdf
            await new Promise(r => setTimeout(r, 800));
            setStatus(`Loaded ${file.name} — ${SAMPLE_TRIPLES.length} triples`);
            setRdfStats({
                tripleCount: SAMPLE_TRIPLES.length,
                subjectCount: 10,
                predicateCount: 5,
                objectCount: 20,
                formatDetected: file.name.endsWith('.ttl') ? 'Turtle' : 'RDF/XML',
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load file';
            setRdfError(msg);
            setStatus('Error loading file');
        } finally {
            setRdfLoading(false);
        }
    }, []);

    const handleExport = useCallback((format: string) => {
        // Integration point → RDFManager.export(format) from @kg/rdf
        setStatus(`Exporting as ${format}...`);
        setTimeout(() => setStatus('Export complete'), 1500);
    }, []);

    const handleExecuteQuery = useCallback(async (query: string): Promise<QueryResult> => {
        setStatus('Executing query...');
        setQueryHistory(prev => [query, ...prev.slice(0, 9)]);
        // Integration point → QueryManager.execute(query, store) from @kg/sparql
        await new Promise(r => setTimeout(r, 400));
        const isAsk = query.trim().toUpperCase().startsWith('ASK');
        if (isAsk) {
            setStatus('Query executed');
            return { type: 'ask', booleanResult: true, executionTime: 8 };
        }
        const bindings = triples.slice(0, 15).map(t => ({
            s: t.subject,
            p: t.predicate,
            o: t.object,
        }));
        setStatus(`${bindings.length} results`);
        return {
            type: 'select',
            variables: ['s', 'p', 'o'],
            bindings,
            executionTime: 21,
        };
    }, [triples]);

    const handleExportResults = useCallback((result: QueryResult, format: 'csv' | 'json' | 'xml') => {
        // Integration point → QueryManager.exportResults(result, format) from @kg/sparql
        setStatus(`Exporting results as ${format.toUpperCase()}...`);
        setTimeout(() => setStatus('Export complete'), 1000);
    }, []);

    const handleApplyReasoning = useCallback(async () => {
        setReasoningRunning(true);
        setStatus(`Running ${reasoningMode} reasoning...`);
        // Integration point → ReasoningEngine.run(mode, store) from @kg/reasoning
        await new Promise(r => setTimeout(r, 1000));
        const inferred: Triple[] = [
            {
                subject: 'http://example.org#Alice',
                predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                object: 'http://xmlns.com/foaf/0.1/Agent',
                inferred: true,
            },
            {
                subject: 'http://example.org#Bob',
                predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                object: 'http://xmlns.com/foaf/0.1/Agent',
                inferred: true,
            },
            {
                subject: 'http://example.org#Alice',
                predicate: 'http://xmlns.com/foaf/0.1/knows',
                object: 'http://example.org#Carol',
                inferred: true,
            },
        ];
        setInferredTriples(inferred);
        setTriples(prev => [...prev, ...inferred]);
        setStatus(`Reasoning done — +${inferred.length} inferred triples`);
        setReasoningRunning(false);
    }, [reasoningMode]);

    const handlePanelSwitch = (panel: Panel) => {
        setActivePanel(panel);
        const labels: Record<Panel, string> = {
            rdf: 'RDF Panel',
            ontology: 'Ontology Panel',
            sparql: 'SPARQL Panel',
            reasoning: 'Reasoning Panel',
        };
        setStatus(`Viewing ${labels[panel]}`);
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                background: c.bgPrimary,
                color: c.textPrimary,
                fontFamily: "'Inter', system-ui, sans-serif",
                overflow: 'hidden',
            }}
        >

            {/* ================================================================== */}
            {/* TITLE BAR                                                           */}
            {/* ================================================================== */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 42,
                    background: c.bgSecondary,
                    borderBottom: `1px solid ${c.border}`,
                    padding: '0 16px',
                    flexShrink: 0,
                    gap: 16,
                    WebkitAppRegion: 'drag',
                } as React.CSSProperties}
            >
                {/* Logo + Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: '6px',
                            background: `linear-gradient(135deg, ${c.accent}, ${c.nodeClass})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            color: '#fff',
                        }}
                    >
                        ⬡
                    </div>
                    <span
                        style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: c.textPrimary,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Knowledge Graph Desktop
                    </span>
                </div>

                {/* Menu items */}
                <div style={{ display: 'flex', gap: 2, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    {['File', 'Edit', 'View', 'Help'].map(item => (
                        <button
                            key={item}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: c.textSecondary,
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: '4px 10px',
                                borderRadius: '5px',
                                transition: 'all 0.1s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = c.bgHover;
                                e.currentTarget.style.color = c.textPrimary;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = c.textSecondary;
                            }}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1 }} />

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                    style={{
                        WebkitAppRegion: 'no-drag',
                        background: c.bgCard,
                        border: `1px solid ${c.border}`,
                        borderRadius: '7px',
                        color: c.textPrimary,
                        cursor: 'pointer',
                        padding: '4px 10px',
                        fontSize: '14px',
                        transition: 'border-color 0.15s ease',
                    } as React.CSSProperties}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; }}
                >
                    {isDark ? '☀' : '🌙'}
                </button>
            </div>

            {/* ================================================================== */}
            {/* MAIN LAYOUT                                                         */}
            {/* ================================================================== */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── Icon rail (sidebar) ── */}
                <div
                    style={{
                        width: 52,
                        background: c.bgSecondary,
                        borderRight: `1px solid ${c.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '10px 0',
                        gap: 4,
                        flexShrink: 0,
                    }}
                >
                    {PANELS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handlePanelSwitch(item.id)}
                            title={item.label}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: '8px',
                                border: 'none',
                                background: activePanel === item.id ? `${c.accent}22` : 'transparent',
                                color: activePanel === item.id ? c.accent : c.textMuted,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                                position: 'relative',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => {
                                if (activePanel !== item.id) {
                                    e.currentTarget.style.background = c.bgHover;
                                    e.currentTarget.style.color = c.textPrimary;
                                }
                            }}
                            onMouseLeave={e => {
                                if (activePanel !== item.id) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = c.textMuted;
                                }
                            }}
                        >
                            {/* Active indicator bar */}
                            {activePanel === item.id && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '25%',
                                        width: 3,
                                        height: '50%',
                                        background: c.accent,
                                        borderRadius: '0 3px 3px 0',
                                    }}
                                />
                            )}
                            <span style={{ fontSize: '16px', lineHeight: 1 }}>{item.icon}</span>
                            <span style={{ fontSize: '8px', fontWeight: 500, letterSpacing: '0.03em' }}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Side panel ── */}
                <div
                    style={{
                        width: 300,
                        minWidth: 260,
                        maxWidth: 400,
                        background: c.bgPanel,
                        borderRight: `1px solid ${c.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        flexShrink: 0,
                    }}
                >
                    {/* Panel header */}
                    <div
                        style={{
                            padding: '11px 16px',
                            borderBottom: `1px solid ${c.border}`,
                            background: c.bgSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexShrink: 0,
                        }}
                    >
                        <span style={{ fontSize: '15px' }}>
                            {PANELS.find(p => p.id === activePanel)?.icon}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: c.textPrimary }}>
                            {PANELS.find(p => p.id === activePanel)?.label} Panel
                        </span>
                    </div>

                    {/* Panel content */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        {activePanel === 'rdf' && (
                            <RDFPanel
                                stats={rdfStats}
                                onFileLoad={handleFileLoad}
                                onExport={handleExport}
                                isLoading={rdfLoading}
                                error={rdfError}
                            />
                        )}
                        {activePanel === 'ontology' && (
                            <OntologyPanel
                                classes={SAMPLE_CLASSES}
                                properties={SAMPLE_PROPERTIES}
                                onClassSelect={cls => setStatus(`Class: ${cls.label}`)}
                                onPropertySelect={prop => setStatus(`Property: ${prop.label}`)}
                            />
                        )}
                        {activePanel === 'sparql' && (
                            <SPARQLPanel
                                onExecute={handleExecuteQuery}
                                onExport={handleExportResults}
                                queryHistory={queryHistory}
                            />
                        )}
                        {activePanel === 'reasoning' && (
                            <ReasoningPanel
                                isEnabled={reasoningEnabled}
                                mode={reasoningMode}
                                inferredTriples={inferredTriples}
                                totalInferred={inferredTriples.length}
                                isRunning={reasoningRunning}
                                onToggle={setReasoningEnabled}
                                onModeChange={setReasoningMode}
                                onApply={handleApplyReasoning}
                            />
                        )}
                    </div>
                </div>

                {/* ── Main graph view ── */}
                <div
                    style={{
                        flex: 1,
                        padding: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                    }}
                >
                    <GraphView
                        triples={triples}
                        layout="force"
                    />
                </div>
            </div>

            {/* ================================================================== */}
            {/* STATUS BAR                                                          */}
            {/* ================================================================== */}
            <div
                style={{
                    height: 26,
                    background: c.accent,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    gap: 16,
                    flexShrink: 0,
                }}
            >
                <span style={{ fontSize: '11px', color: c.textOnAccent, opacity: 0.9 }}>
                    {status}
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: '11px', color: c.textOnAccent, opacity: 0.7 }}>
                    {triples.length} triples
                </span>
                <span style={{ fontSize: '11px', color: c.textOnAccent, opacity: 0.7 }}>
                    {inferredTriples.length} inferred
                </span>
                <span style={{ fontSize: '11px', color: c.textOnAccent, opacity: 0.7 }}>
                    {isDark ? '🌙 Dark' : '☀ Light'}
                </span>
            </div>

        </div>
    );
};

// =============================================================================
// Root App — wraps with ThemeProvider
// =============================================================================

const App: React.FC = () => (
    <ThemeProvider>
        <AppInner />
    </ThemeProvider>
);

export default App;