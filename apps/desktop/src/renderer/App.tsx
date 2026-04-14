/**
 * App.tsx
 * Design : Light/Dark cohérent sur toute la page
 * Accent  : Bleu électrique
 * Boutons : Gradient
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import logoUrl from '@assets/logo.png';
import {
  ThemeProvider,
  useTheme,
  GraphView,
  RDFPanel,
  OntologyPanel,
  SPARQLPanel,
  ReasoningPanel,
  shortenUri,
} from '@kg/visualization';
import type {
  Triple,
  RDFStats,
  QueryResult,
  ReasoningMode,
  OntologyClass,
  OntologyProperty,
} from '@kg/visualization';
import { RDFManager } from '@kg/rdf';
import { QueryManager } from '@kg/sparql';
import { OntologyManager } from '@kg/ontology';
import { ReasoningEngine } from '@kg/reasoning';
import { KGEEngine } from '@kg/embeddings';
import { EmbeddingsPanel } from './components/EmbeddingsPanel';
import { EmbeddingScatter } from './components/EmbeddingScatter';
import type {
  ClassNode,
  EmbeddingAlgorithm,
  EmbeddingComparisonResult,
  EmbeddingTrainingConfig,
  PropertyNode,
  Triple as CoreTriple,
  QueryResult as CoreQueryResult,
  RDFFormat,
  ReasoningMode as CoreReasoningMode,
  IRDFStore,
} from '@kg/core';

// ElectronAPI exposed via contextBridge in preload.ts
interface GraphSnapshotMeta {
  sourceName: string;
  format: string;
  savedAt: string;
  tripleCount: number;
}

interface ElectronAPI {
  openFile: () => Promise<string | null>;
  saveFile: (name: string) => Promise<string | null>;
  readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
  onOpenFile: (cb: (path: string) => void) => void;
  onSave: (cb: () => void) => void;
  onExport: (cb: () => void) => void;
  onToggleTheme: (cb: () => void) => void;
  removeAllListeners: (channel: string) => void;
  // Graph snapshot persistence
  saveSnapshot: (
    turtleContent: string,
    meta: GraphSnapshotMeta
  ) => Promise<{ success: boolean; error?: string }>;
  loadSnapshot: () => Promise<{
    success: boolean;
    content?: string;
    metadata?: GraphSnapshotMeta;
    reason?: string;
    error?: string;
  }>;
  clearSnapshot: () => Promise<{ success: boolean; error?: string }>;
}
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// Electron renderer adds a `path` property to File objects
interface ElectronFile extends File {
  path?: string;
}

// ============================================================
// Type converters between @kg/core engine types and viz types
// ============================================================
function coreTriplesToViz(triples: CoreTriple[]): Triple[] {
  return triples.map((t) => ({
    subject: t.subject?.value ?? String(t.subject),
    predicate: t.predicate?.value ?? String(t.predicate),
    object: t.object?.value ?? String(t.object),
  }));
}

function classNodeToViz(node: ClassNode): OntologyClass {
  return {
    uri: node.uri,
    label: node.label ?? shortenUri(node.uri),
    comment: node.comment,
    children: (node.children ?? []).map(classNodeToViz),
  };
}

function propertyNodeToViz(node: PropertyNode): OntologyProperty {
  return {
    uri: node.uri,
    label: node.label ?? shortenUri(node.uri),
    type:
      node.type === 'ObjectProperty'
        ? 'object'
        : node.type === 'DatatypeProperty'
          ? 'datatype'
          : 'annotation',
    domain: node.domain?.[0],
    range: node.range?.[0],
  };
}

function coreQueryResultToViz(r: CoreQueryResult): QueryResult {
  return {
    type: (r.type as string).toLowerCase() as QueryResult['type'],
    variables: r.variables,
    bindings: r.bindings,
    booleanResult: r.boolean ?? r.booleanResult,
    executionTime: r.executionTime,
  };
}

function inferredTriplesToViz(triples: CoreTriple[]): Triple[] {
  return triples.map((t) => ({
    subject: t.subject?.value ?? String(t.subject),
    predicate: t.predicate?.value ?? String(t.predicate),
    object: t.object?.value ?? String(t.object),
    inferred: true,
  }));
}

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
  /* Fonts use system stack — no CDN required for offline capability */
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

// SAMPLE_TRIPLES, SAMPLE_CLASSES and SAMPLE_PROPERTIES removed — replaced by live state from engines

type Panel = 'rdf' | 'ontology' | 'sparql' | 'reasoning' | 'embeddings';

const DEFAULT_EMBEDDING_CONFIG = (algorithm: EmbeddingAlgorithm): EmbeddingTrainingConfig => ({
  algorithm,
  dimensions: 24,
  epochs: 30,
  learningRate: 0.02,
  seed: 7,
});

const PANELS: {
  id: Panel;
  icon: string;
  label: string;
  getBadge: (t: number, i: number, h: number, o: number, hasEmbeddingResult: boolean) => string;
}[] = [
  { id: 'rdf', icon: '⬡', label: 'RDF Data', getBadge: (t) => String(t) },
  {
    id: 'ontology',
    icon: '◈',
    label: 'Ontology',
    getBadge: (_t, _i, _h, o) => (o > 0 ? String(o) : ''),
  },
  { id: 'sparql', icon: '⌕', label: 'SPARQL', getBadge: (_t, _i, h) => (h > 0 ? String(h) : '') },
  { id: 'reasoning', icon: '⟁', label: 'Reasoning', getBadge: (_t, i) => (i > 0 ? `+${i}` : '') },
  {
    id: 'embeddings',
    icon: '◍',
    label: 'Embeddings',
    getBadge: (_t, _i, _h, _o, hasEmbeddingResult) => (hasEmbeddingResult ? 'A/B' : ''),
  },
];

// =============================================================================
// AppInner
// =============================================================================
const AppInner: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const T = makeTokens(isDark);

  // ── Engine instances (stable across renders) ──
  const rdfManagerRef = useRef(new RDFManager());
  const queryManagerRef = useRef(new QueryManager());
  const ontologyManagerRef = useRef(new OntologyManager());
  const reasoningEngineRef = useRef(new ReasoningEngine());
  const kgeEngineRef = useRef(new KGEEngine());

  const [activePanel, setActivePanel] = useState<Panel>('rdf');
  const [triples, setTriples] = useState<Triple[]>([]);
  const [rdfStats, setRdfStats] = useState<RDFStats | null>(null);
  const [rdfError, setRdfError] = useState<string | null>(null);
  const [rdfLoading, setRdfLoading] = useState(false);
  const [ontologyClasses, setOntologyClasses] = useState<OntologyClass[]>([]);
  const [ontologyProperties, setOntologyProperties] = useState<OntologyProperty[]>([]);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [reasoningMode, setReasoningMode] = useState<ReasoningMode>('RDFS');
  const [inferredTriples, setInferredTriples] = useState<Triple[]>([]);
  const [reasoningRunning, setReasoningRunning] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [embeddingConfigA, setEmbeddingConfigA] = useState<EmbeddingTrainingConfig>(
    DEFAULT_EMBEDDING_CONFIG('TransE')
  );
  const [embeddingConfigB, setEmbeddingConfigB] = useState<EmbeddingTrainingConfig>(
    DEFAULT_EMBEDDING_CONFIG('ComplEx')
  );
  const [embeddingResult, setEmbeddingResult] = useState<EmbeddingComparisonResult | null>(null);
  const [embeddingRunning, setEmbeddingRunning] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [projectionSplit, setProjectionSplit] = useState(50);
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const [isResizingProjection, setIsResizingProjection] = useState(false);
  const panelResizeStartRef = useRef<{ x: number; width: number } | null>(null);
  const projectionResizeStartRef = useRef<{ x: number; split: number } | null>(null);
  const projectionAreaRef = useRef<HTMLDivElement | null>(null);

  // Inject static CSS once
  useEffect(() => {
    if (!document.getElementById('kg-static')) {
      const s = document.createElement('style');
      s.id = 'kg-static';
      s.textContent = STATIC_CSS;
      document.head.appendChild(s);
    }
  }, []);

  // Dynamic CSS (theme-dependent classes)
  useEffect(() => {
    let el = document.getElementById('kg-theme');
    if (!el) {
      el = document.createElement('style');
      el.id = 'kg-theme';
      document.head.appendChild(el);
    }
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

  useEffect(() => {
    const onMouseMove = (event: MouseEvent): void => {
      if (isResizingPanel && panelResizeStartRef.current) {
        const delta = event.clientX - panelResizeStartRef.current.x;
        const next = Math.max(230, Math.min(520, panelResizeStartRef.current.width + delta));
        setLeftPanelWidth(next);
      }

      if (isResizingProjection && projectionResizeStartRef.current && projectionAreaRef.current) {
        const delta = event.clientX - projectionResizeStartRef.current.x;
        const totalWidth = projectionAreaRef.current.clientWidth || 1;
        const deltaPct = (delta / totalWidth) * 100;
        const next = Math.max(25, Math.min(75, projectionResizeStartRef.current.split + deltaPct));
        setProjectionSplit(next);
      }
    };

    const onMouseUp = (): void => {
      setIsResizingPanel(false);
      setIsResizingProjection(false);
      panelResizeStartRef.current = null;
      projectionResizeStartRef.current = null;
    };

    if (isResizingPanel || isResizingProjection) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizingPanel, isResizingProjection]);

  // ── Factorized RDF loading logic ──────────────────────────────────────────
  // Called by handleFileLoad, onOpenFile handler, and snapshot restore.
  const loadRdfContentToState = useCallback(
    async (content: string, sourceName: string, ext: string): Promise<void> => {
      const fmt = ext === 'ttl' ? 'turtle' : ext === 'nt' ? 'n-triples' : 'rdf-xml';
      const rdf = rdfManagerRef.current;
      rdf.clear();
      await rdf.load(content, fmt as RDFFormat);
      const coreTriples = rdf.getTriples();
      const vizTriples = coreTriplesToViz(coreTriples);
      const stats = rdf.getStats();
      setTriples(vizTriples);
      setInferredTriples([]);
      setEmbeddingResult(null);
      setRdfStats({
        tripleCount: stats.totalTriples,
        subjectCount: stats.uniqueSubjects,
        predicateCount: stats.uniquePredicates,
        objectCount: stats.uniqueObjects,
        formatDetected: ext === 'ttl' ? 'Turtle' : ext === 'nt' ? 'N-Triples' : 'RDF∕XML',
      });
      setStatus(`Loaded ${sourceName} — ${vizTriples.length} triples`);
      try {
        const om = ontologyManagerRef.current;
        const fmt2: 'owl' | 'rdfs' = ext === 'owl' || ext === 'rdf' ? 'owl' : 'rdfs';
        await om.loadOntology(content, fmt2);
        const structure = om.getStructure();
        const hierarchy = om.getClassHierarchy();
        const vizClasses =
          hierarchy.children?.length > 0
            ? hierarchy.children.map(classNodeToViz)
            : structure.classes.map(classNodeToViz);
        setOntologyClasses(vizClasses);
        setOntologyProperties(structure.properties.map(propertyNodeToViz));
      } catch {
        /* non-ontology file — ignore */
      }
    },
    []
  );

  // Fire-and-forget: persist a Turtle snapshot of the current RDF graph.
  // Strategy: Electron userData file (primary) → localStorage (web fallback).
  const autoSaveSnapshot = useCallback(
    async (sourceName: string, format: string): Promise<void> => {
      try {
        const turtleContent = await rdfManagerRef.current.export('turtle');
        const tripleCount = rdfManagerRef.current.getTriples().length;
        const meta: GraphSnapshotMeta = {
          sourceName,
          format,
          savedAt: new Date().toISOString(),
          tripleCount,
        };
        const api = window.electronAPI;
        if (api?.saveSnapshot) {
          // Electron: persist in userData folder
          await api.saveSnapshot(turtleContent, meta);
        } else {
          // Web fallback: persist in localStorage (limit ~5 MB; silent on quota error)
          try {
            localStorage.setItem('kg-last-graph-ttl', turtleContent);
            localStorage.setItem('kg-last-graph-meta', JSON.stringify(meta));
          } catch {
            /* storage quota exceeded — graph too large for localStorage, ignore */
          }
        }
      } catch {
        /* never block the UI on snapshot failure */
      }
    },
    []
  );

  // Restore last graph snapshot on mount (covers refresh + app restart).
  // Strategy: Electron userData file (primary) → localStorage (web fallback).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let content: string | undefined;
        let metadata: GraphSnapshotMeta | undefined;

        const api = window.electronAPI;
        if (api?.loadSnapshot) {
          // Electron path
          const result = await api.loadSnapshot();
          if (result.success && result.content && result.metadata) {
            content = result.content;
            metadata = result.metadata;
          }
        } else {
          // Web fallback: read from localStorage
          const ttl = localStorage.getItem('kg-last-graph-ttl');
          const raw = localStorage.getItem('kg-last-graph-meta');
          if (ttl && raw) {
            content = ttl;
            metadata = JSON.parse(raw) as GraphSnapshotMeta;
          }
        }

        if (cancelled || !content || !metadata) return;
        setRdfLoading(true);
        setStatus(`Restoring "${metadata.sourceName}"…`);
        await loadRdfContentToState(content, metadata.sourceName, 'ttl');
        setStatus(`Restored "${metadata.sourceName}" (${metadata.tripleCount} triples)`);
      } catch {
        /* corrupted snapshot — start empty, never crash */
      } finally {
        if (!cancelled) setRdfLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadRdfContentToState]);

  // Electron menu events
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    api.onOpenFile(async (p: string) => {
      const filename = p.split(/[\\/]/).pop() ?? p;
      const ext = (p.split('.').pop() ?? 'ttl').toLowerCase();
      setStatus(`Opening ${filename}…`);
      setActivePanel('rdf');
      setRdfLoading(true);
      setRdfError(null);
      try {
        const result = await api.readFile(p);
        if (!result.success) throw new Error(result.error);
        await loadRdfContentToState(result.content!, filename, ext);
        void autoSaveSnapshot(filename, ext);
      } catch (e) {
        setRdfError(e instanceof Error ? e.message : 'Failed to load');
        setStatus('Error opening file');
      } finally {
        setRdfLoading(false);
      }
    });
    api.onExport(() => setActivePanel('rdf'));
    api.onToggleTheme(() => toggleTheme());
    return () => {
      api.removeAllListeners('menu:openFile');
      api.removeAllListeners('menu:export');
      api.removeAllListeners('menu:toggleTheme');
    };
  }, [toggleTheme]);

  // Handlers
  const handleFileLoad = useCallback(
    async (file: File) => {
      setRdfLoading(true);
      setRdfError(null);
      setStatus(`Loading ${file.name}…`);
      try {
        // Electron exposes the real fs path; fallback to FileReader for web context
        const api = window.electronAPI;
        let content: string;
        const filePath: string = (file as ElectronFile).path ?? '';
        if (api?.readFile && filePath) {
          const res = await api.readFile(filePath);
          if (!res.success) throw new Error(res.error);
          content = res.content!;
        } else {
          content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });
        }
        const ext = (file.name.split('.').pop() ?? 'ttl').toLowerCase();
        await loadRdfContentToState(content, file.name, ext);
        void autoSaveSnapshot(file.name, ext);
      } catch (e: unknown) {
        setRdfError(e instanceof Error ? e.message : 'Failed');
        setStatus('Error loading file');
      } finally {
        setRdfLoading(false);
      }
    },
    [loadRdfContentToState, autoSaveSnapshot]
  );

  const handleExport = useCallback(async (format: string) => {
    setStatus(`Exporting as ${format}…`);
    const fmt =
      format.toLowerCase().includes('ttl') || format.toLowerCase() === 'turtle'
        ? 'turtle'
        : format.toLowerCase().includes('nt') || format.toLowerCase() === 'n-triples'
          ? 'n-triples'
          : 'rdf-xml';
    const ext = fmt === 'turtle' ? 'ttl' : fmt === 'n-triples' ? 'nt' : 'rdf';
    const content = await rdfManagerRef.current.export(fmt as RDFFormat);
    const api = window.electronAPI;
    if (api?.saveFile && api?.writeFile) {
      const fp = await api.saveFile(`export.${ext}`);
      if (!fp) {
        setStatus('Export cancelled');
        return;
      }
      const r = await api.writeFile(fp, content);
      setStatus(r.success ? `✓ Saved to ${fp}` : `✗ ${r.error}`);
    } else {
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([content], { type: 'text/plain' })),
        download: `export.${ext}`,
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => setStatus('✓ Export complete'), 500);
    }
  }, []);

  const handleExecuteQuery = useCallback(async (query: string): Promise<QueryResult> => {
    setStatus('Executing query…');
    setQueryHistory((prev) => [query, ...prev.slice(0, 9)]);
    try {
      const coreResult = await queryManagerRef.current.execute(
        query,
        rdfManagerRef.current as unknown as IRDFStore
      );
      const vizResult = coreQueryResultToViz(coreResult);
      setStatus(
        `Done — ${coreResult.count ?? coreResult.bindings?.length ?? 0} results (${coreResult.executionTime ?? 0} ms)`
      );
      return vizResult;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Query failed';
      setStatus(`Error: ${msg}`);
      throw e;
    }
  }, []);

  const handleExportResults = useCallback((result: QueryResult, format: 'csv' | 'json' | 'xml') => {
    const vars = result.variables || [];
    let content = '',
      mime = 'text/plain';
    if (format === 'csv') {
      content = [
        vars.join(','),
        ...(result.bindings || []).map((r) =>
          vars.map((v) => `"${(r[v] || '').replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');
      mime = 'text/csv';
    } else if (format === 'json') {
      content = JSON.stringify({ results: { bindings: result.bindings || [] } }, null, 2);
      mime = 'application/json';
    } else {
      content = `<?xml version="1.0"?><sparql><results>${(result.bindings || []).map((r) => `<r>${vars.map((v) => `<binding name="${v}"><uri>${r[v] || ''}</uri></binding>`).join('')}</r>`).join('')}</results></sparql>`;
      mime = 'application/xml';
    }
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([content], { type: mime })),
      download: `results.${format}`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setStatus(`✓ Exported as ${format.toUpperCase()}`), 500);
  }, []);

  const handleApplyReasoning = useCallback(async () => {
    setReasoningRunning(true);
    setStatus(`Running ${reasoningMode} reasoning…`);
    try {
      const modeMap: Record<ReasoningMode, string> = {
        RDFS: 'RDFS',
        'OWL-RL': 'OWL_RL',
        'OWL-EL': 'RDFS',
        'OWL-QL': 'RDFS',
      };
      const engine = reasoningEngineRef.current;
      engine.configure({
        enabled: true,
        mode: modeMap[reasoningMode] as CoreReasoningMode,
        includeInferred: false,
      });
      const result = await engine.infer(rdfManagerRef.current as unknown as IRDFStore);
      const vizInferred = inferredTriplesToViz(result.inferredTriples);
      setInferredTriples(vizInferred);
      setTriples((prev) => [...prev.filter((t) => !t.inferred), ...vizInferred]);
      setStatus(`Done — +${vizInferred.length} inferred triples (${result.executionTime} ms)`);
    } catch (e: unknown) {
      setStatus(`Reasoning error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setReasoningRunning(false);
    }
  }, [reasoningMode]);

  const handleRunEmbeddings = useCallback(async () => {
    if (triples.length === 0) {
      setStatus('Load RDF data before running embeddings');
      return;
    }

    setEmbeddingRunning(true);
    setStatus(`Comparing ${embeddingConfigA.algorithm} vs ${embeddingConfigB.algorithm}...`);

    try {
      const result = await kgeEngineRef.current.compare(
        rdfManagerRef.current as unknown as IRDFStore,
        embeddingConfigA,
        embeddingConfigB
      );

      setEmbeddingResult(result);
      setStatus(
        `Embeddings done — ${result.runA.algorithm} gap ${result.runA.metrics.scoreGap.toFixed(3)} | ${result.runB.algorithm} gap ${result.runB.metrics.scoreGap.toFixed(3)} | recommended: ${result.recommended}`
      );
    } catch (e: unknown) {
      setStatus(`Embeddings error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setEmbeddingRunning(false);
    }
  }, [embeddingConfigA, embeddingConfigB, triples.length]);

  const handleStartPanelResize = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      panelResizeStartRef.current = { x: event.clientX, width: leftPanelWidth };
      setIsResizingPanel(true);
    },
    [leftPanelWidth]
  );

  const handleStartProjectionResize = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      projectionResizeStartRef.current = { x: event.clientX, split: projectionSplit };
      setIsResizingProjection(true);
    },
    [projectionSplit]
  );

  const explainEmbeddingResult = useCallback((result: EmbeddingComparisonResult): string => {
    const run = result.recommended === result.runA.algorithm ? result.runA : result.runB;
    const alt = result.recommended === result.runA.algorithm ? result.runB : result.runA;
    const delta = run.metrics.scoreGap - alt.metrics.scoreGap;

    if (delta > 0.5) {
      return `${run.algorithm} clearly separates positive and negative triples better on this graph (gap +${delta.toFixed(3)}).`;
    }
    if (delta > 0.1) {
      return `${run.algorithm} is moderately better for this dataset, but both models are close in quality.`;
    }
    return `Both models perform similarly on this dataset; choose based on interpretability or execution time.`;
  }, []);

  const activePanelInfo = PANELS.find((p) => p.id === activePanel) ?? PANELS[0];
  const isLoading = rdfLoading || reasoningRunning || embeddingRunning;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: T.bgApp,
        color: T.text1,
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          TOP BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <header
        style={
          {
            display: 'flex',
            alignItems: 'center',
            height: 52,
            flexShrink: 0,
            background: T.bgSurface,
            borderBottom: `1px solid ${T.border}`,
            padding: '0 20px',
            gap: 16,
            boxShadow: isDark ? '0 1px 0 rgba(255,255,255,0.04)' : '0 1px 3px rgba(0,0,0,0.06)',
            WebkitAppRegion: 'drag',
          } as React.CSSProperties
        }
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <img
            src={logoUrl}
            alt="Knowledge Graph"
            style={{
              width: 30,
              height: 30,
              // borderRadius: 10,
              objectFit: 'contain',
              // boxShadow: '0 2px 10px rgba(59,130,246,0.4)',
            }}
          />
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: T.text1,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Knowledge Graph
            </div>
            <div style={{ fontSize: 10, color: T.text3, letterSpacing: '0.06em', fontWeight: 500 }}>
              DESKTOP
            </div>
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: T.border, flexShrink: 0 }} />

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.text3 }}>Workspace</span>
          <span style={{ fontSize: 12, color: T.text3 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.blueText }}>
            {activePanelInfo.label}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 8, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <span
            className="stat-chip"
            style={{ background: T.blueLight, color: T.blueText, borderColor: T.blueBorder }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: T.blueText,
                flexShrink: 0,
              }}
            />
            {triples.length} triples
          </span>
          {inferredTriples.length > 0 && (
            <span
              className="stat-chip"
              style={{ background: T.greenBg, color: T.green, borderColor: 'rgba(34,197,94,0.3)' }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: T.green,
                  flexShrink: 0,
                }}
              />
              +{inferredTriples.length} inferred
            </span>
          )}
        </div>

        {/* Theme toggle */}
        <button
          className="btn-ghost"
          onClick={toggleTheme}
          style={
            {
              WebkitAppRegion: 'no-drag',
              padding: '5px 11px',
              fontSize: 15,
              borderRadius: 9,
            } as React.CSSProperties
          }
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <aside
          style={{
            width: isNavCollapsed ? 64 : 216,
            background: T.bgSurface,
            borderRight: `1px solid ${T.border}`,
            display: 'flex',
            flexDirection: 'column',
            padding: '10px 8px',
            gap: 2,
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '4px 8px 8px',
              fontSize: 10,
              fontWeight: 700,
              color: T.text3,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {isNavCollapsed ? 'Nav' : 'Navigation'}
          </div>

          <button
            className="btn-ghost"
            onClick={() => setIsNavCollapsed((prev) => !prev)}
            title={isNavCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            style={{
              margin: '0 6px 8px',
              justifyContent: isNavCollapsed ? 'center' : 'flex-start',
              padding: isNavCollapsed ? '6px' : '6px 10px',
            }}
          >
            {isNavCollapsed ? '⟩⟩' : '⟨⟨'}
            {!isNavCollapsed && <span>Collapse</span>}
          </button>

          {PANELS.map((item) => {
            const isActive = activePanel === item.id;
            const badge = item.getBadge(
              triples.length,
              inferredTriples.length,
              queryHistory.length,
              ontologyClasses.length,
              Boolean(embeddingResult)
            );
            return (
              <button
                key={item.id}
                className={`nav-item${isActive ? ' active' : ''}`}
                onClick={() => {
                  setActivePanel(item.id);
                  setStatus(`Viewing ${item.label}`);
                }}
                title={item.label}
                style={isNavCollapsed ? { justifyContent: 'center', padding: '8px' } : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isNavCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                {!isNavCollapsed && badge && <span className="nav-badge">{badge}</span>}
              </button>
            );
          })}

          {/* Bottom section */}
          {!isNavCollapsed && (
            <div style={{ marginTop: 'auto' }}>
              <div className="divider" style={{ margin: '12px 0' }} />
              <div style={{ padding: '4px 10px', fontSize: 11, color: T.text3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Format</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      color: T.blueText,
                      fontWeight: 600,
                      fontSize: 10,
                    }}
                  >
                    {rdfStats?.formatDetected ?? '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Nodes</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontWeight: 600,
                      color: T.text2,
                    }}
                  >
                    {rdfStats?.subjectCount ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── Panel ── */}
        <div
          style={{
            width: leftPanelWidth,
            background: T.bgPanel,
            borderRight: `1px solid ${T.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '13px 16px 11px',
              flexShrink: 0,
              background: T.bgSurface,
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  fontSize: 17,
                  background: T.blueLight,
                  border: `1px solid ${T.blueBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: T.blueText,
                }}
              >
                {activePanelInfo.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>
                  {activePanelInfo.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: T.text3,
                    marginTop: 2,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {activePanel === 'rdf'
                    ? `${triples.length} triples`
                    : activePanel === 'sparql'
                      ? `${queryHistory.length} queries`
                      : activePanel === 'reasoning'
                        ? `${inferredTriples.length} inferred`
                        : activePanel === 'ontology'
                          ? `${ontologyClasses.length} classes · ${ontologyProperties.length} props`
                          : embeddingResult
                            ? `${embeddingResult.runA.algorithm} vs ${embeddingResult.runB.algorithm}`
                            : 'Configure algorithm A/B'}
                </div>
              </div>
            </div>
            {isLoading && (
              <div
                className="pulse"
                style={{ width: 8, height: 8, borderRadius: '50%', background: T.blueText }}
              />
            )}
          </div>

          {/* Panel body */}
          <div className="panel-in" style={{ flex: 1, overflow: 'hidden' }}>
            {activePanel === 'rdf' && (
              <RDFPanel
                stats={rdfStats}
                triples={triples}
                onFileLoad={handleFileLoad}
                onExport={handleExport}
                isLoading={rdfLoading}
                error={rdfError}
              />
            )}
            {activePanel === 'ontology' && (
              <OntologyPanel
                classes={ontologyClasses}
                properties={ontologyProperties}
                onClassSelect={(cls) => setStatus(`Class: ${cls.label}`)}
                onPropertySelect={(prop) => setStatus(`Property: ${prop.label}`)}
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
            {activePanel === 'embeddings' && (
              <EmbeddingsPanel
                isDark={isDark}
                configA={embeddingConfigA}
                configB={embeddingConfigB}
                onConfigAChange={setEmbeddingConfigA}
                onConfigBChange={setEmbeddingConfigB}
                onCompare={handleRunEmbeddings}
                isRunning={embeddingRunning}
                result={embeddingResult}
              />
            )}
          </div>
        </div>

        <div
          onMouseDown={handleStartPanelResize}
          style={{
            width: 6,
            cursor: 'col-resize',
            background: isResizingPanel ? T.blueLight : 'transparent',
            borderRight: `1px solid ${T.borderSub}`,
            borderLeft: `1px solid ${T.borderSub}`,
            flexShrink: 0,
          }}
          title="Drag to resize the active panel"
        />

        {/* ── Graph ── */}
        <div
          style={{ flex: 1, padding: 16, overflow: 'hidden', display: 'flex', background: T.bgApp }}
        >
          {activePanel === 'embeddings' && embeddingResult ? (
            <div
              ref={projectionAreaRef}
              style={{
                display: 'grid',
                gridTemplateRows: '1fr auto',
                gap: 12,
                width: '100%',
                minWidth: 0,
              }}
            >
              <div style={{ display: 'flex', gap: 8, minWidth: 0 }}>
                <div style={{ flex: `0 0 ${projectionSplit}%`, minWidth: 0 }}>
                  <EmbeddingScatter
                    isDark={isDark}
                    title={`${embeddingResult.runA.algorithm} projection`}
                    points={embeddingResult.runA.points2D}
                    highlightColor="#2563eb"
                  />
                </div>

                <div
                  onMouseDown={handleStartProjectionResize}
                  style={{
                    width: 8,
                    cursor: 'col-resize',
                    borderRadius: 8,
                    background: isResizingProjection ? T.blueLight : T.bgSurface,
                    border: `1px solid ${T.border}`,
                    flexShrink: 0,
                  }}
                  title="Drag to resize projection panes"
                />

                <div style={{ flex: `1 1 ${100 - projectionSplit}%`, minWidth: 0 }}>
                  <EmbeddingScatter
                    isDark={isDark}
                    title={`${embeddingResult.runB.algorithm} projection`}
                    points={embeddingResult.runB.points2D}
                    highlightColor="#dc2626"
                  />
                </div>
              </div>

              <div
                style={{
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: 12,
                  background: T.bgSurface,
                  color: T.text2,
                  display: 'grid',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>
                  Evaluation and Interpretation
                </div>
                <div style={{ fontSize: 12 }}>
                  Recommended model:{' '}
                  <strong style={{ color: T.blueText }}>{embeddingResult.recommended}</strong>
                </div>
                <div style={{ fontSize: 12 }}>
                  {embeddingResult.runA.algorithm}: gap{' '}
                  {embeddingResult.runA.metrics.scoreGap.toFixed(4)}, loss{' '}
                  {embeddingResult.runA.metrics.finalLoss.toFixed(4)}, time{' '}
                  {embeddingResult.runA.metrics.executionTime} ms.
                </div>
                <div style={{ fontSize: 12 }}>
                  {embeddingResult.runB.algorithm}: gap{' '}
                  {embeddingResult.runB.metrics.scoreGap.toFixed(4)}, loss{' '}
                  {embeddingResult.runB.metrics.finalLoss.toFixed(4)}, time{' '}
                  {embeddingResult.runB.metrics.executionTime} ms.
                </div>
                <div
                  style={{
                    fontSize: 12,
                    borderTop: `1px dashed ${T.border}`,
                    paddingTop: 8,
                    color: T.text1,
                  }}
                >
                  {explainEmbeddingResult(embeddingResult)}
                </div>
              </div>
            </div>
          ) : activePanel === 'embeddings' ? (
            <div
              style={{
                width: '100%',
                border: `1px dashed ${T.border}`,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: T.text2,
                fontSize: 14,
              }}
            >
              Run an embeddings comparison to visualize the two projections.
            </div>
          ) : (
            <GraphView triples={triples} layout="force" />
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          STATUS BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <footer
        style={{
          height: 30,
          flexShrink: 0,
          background: T.bgSurface,
          borderTop: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              transition: 'all 0.3s',
              background: isLoading ? T.amber : T.green,
              boxShadow: isLoading
                ? `0 0 0 2px ${isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)'}`
                : `0 0 0 2px ${isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)'}`,
            }}
          />
          <span style={{ fontSize: 11, color: T.text3, fontFamily: "'JetBrains Mono',monospace" }}>
            {status}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            `${triples.length} triples`,
            `${inferredTriples.length} inferred`,
            embeddingResult ? `rec ${embeddingResult.recommended}` : 'no compare',
            isDark ? 'Dark' : 'Light',
          ].map((txt) => (
            <span
              key={txt}
              style={{ fontSize: 11, color: T.text3, fontFamily: "'JetBrains Mono',monospace" }}
            >
              {txt}
            </span>
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
  <ThemeProvider>
    <AppInner />
  </ThemeProvider>
);

export default App;
