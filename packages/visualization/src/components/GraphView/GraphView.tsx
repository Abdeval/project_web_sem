import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import cytoscape, { Core, NodeSingular, EventObject } from 'cytoscape';
import { Triple, GraphMapper, shortenUri } from '../../graph/GraphMapper';
import { LayoutManager, LayoutType } from '../../graph/LayoutManager';
import { useTheme } from '../../theme/ThemeProvider';
import { GraphControls } from './GraphControls';
import { NodeDetails } from './NodeDetails';

interface GraphViewProps {
  triples: Triple[];
  layout?: LayoutType;
  onNodeSelect?: (node: NodeData | null) => void;
  maxNodes?: number;
}

export interface NodeData {
  id: string;
  label: string;
  type: string;
  uri: string;
  degree?: number;
  inEdges?: string[];
  outEdges?: string[];
}

/** Return triples covering the top `maxNodeCount` most-connected nodes (smart sampling) */
function smartSample(triples: Triple[], maxNodeCount: number): Triple[] {
  const degrees = new Map<string, number>();
  for (const t of triples) {
    degrees.set(t.subject, (degrees.get(t.subject) ?? 0) + 1);
    degrees.set(t.object, (degrees.get(t.object) ?? 0) + 1);
  }
  const topNodes = new Set(
    Array.from(degrees.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxNodeCount)
      .map(([node]) => node)
  );
  return triples.filter((t) => topNodes.has(t.subject) && topNodes.has(t.object));
}

export const GraphView: React.FC<GraphViewProps> = ({
  triples,
  layout: initialLayout = 'force',
  onNodeSelect,
  maxNodes = 400,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { theme } = useTheme();
  const c = theme.colors;

  const [currentLayout, setCurrentLayout] = useState<LayoutType>(initialLayout);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedPredicate, setSelectedPredicate] = useState('');

  // Unique sorted predicates for the filter dropdown
  const allPredicates = useMemo(
    () => Array.from(new Set(triples.map((t) => t.predicate))).sort(),
    [triples]
  );

  // Filter triples by search/predicate, then smart-sample if still too large
  const displayTriples = useMemo(() => {
    let result = triples;
    if (selectedPredicate) {
      result = result.filter((t) => t.predicate === selectedPredicate);
    }
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(term) ||
          t.object.toLowerCase().includes(term) ||
          shortenUri(t.subject).toLowerCase().includes(term) ||
          shortenUri(t.object).toLowerCase().includes(term)
      );
    }
    if (result.length > maxNodes * 2) {
      result = smartSample(result, maxNodes);
    }
    return result;
  }, [triples, selectedPredicate, searchText, maxNodes]);

  // Cytoscape stylesheet (theme-aware)
  const buildStylesheet = useCallback(
    () => [
      {
        selector: 'node',
        style: {
          'background-color': c.nodeResource,
          'border-width': 2,
          'border-color': c.border,
          label: 'data(label)',
          'font-size': '11px',
          'font-family': 'system-ui, sans-serif',
          color: c.textPrimary,
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 4,
          'min-zoomed-font-size': 8,
          width: 32,
          height: 32,
          'text-background-color': c.bgPrimary,
          'text-background-opacity': 0.75,
          'text-background-padding': '3px',
          'text-background-shape': 'roundrectangle',
        },
      },
      {
        selector: 'node.resource-node',
        style: { 'background-color': c.nodeResource, shape: 'ellipse' },
      },
      {
        selector: 'node.literal-node',
        style: {
          'background-color': c.nodeLiteral,
          shape: 'round-rectangle',
          width: 40,
          height: 24,
        },
      },
      {
        selector: 'node.class-node',
        style: {
          'background-color': c.nodeClass,
          shape: 'hexagon',
          width: 38,
          height: 38,
          'border-width': 3,
          'border-color': c.nodeClass,
          'border-opacity': 0.6,
        },
      },
      {
        selector: 'node:selected',
        style: {
          'background-color': c.nodeSelected,
          'border-color': c.nodeSelected,
          'border-width': 3,
        },
      },
      {
        selector: 'node.highlighted',
        style: { 'border-width': 3, 'border-color': c.accent, 'background-color': `${c.accent}cc` },
      },
      { selector: 'node.dimmed', style: { opacity: 0.1 } },
      {
        selector: 'edge',
        style: {
          width: 1.5,
          'line-color': c.edgeAsserted,
          'target-arrow-color': c.edgeAsserted,
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          label: 'data(label)',
          'font-size': '9px',
          'font-family': 'system-ui, sans-serif',
          color: c.textSecondary,
          'text-rotation': 'autorotate',
          'text-margin-y': -8,
          'min-zoomed-font-size': 6,
          'text-background-color': c.bgPrimary,
          'text-background-opacity': 0.65,
          'text-background-padding': '1px',
        },
      },
      {
        selector: 'edge.inferred-edge',
        style: {
          'line-color': c.edgeInferred,
          'target-arrow-color': c.edgeInferred,
          'line-style': 'dashed',
          'line-dash-pattern': [6, 3],
          width: 1.5,
        },
      },
      {
        selector: 'edge:selected',
        style: { width: 3, 'line-color': c.accent, 'target-arrow-color': c.accent },
      },
      { selector: 'edge.dimmed', style: { opacity: 0.05 } },
    ],
    [c]
  );

  // Rebuild Cytoscape whenever filtered triples change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!containerRef.current) return;
    const elements = GraphMapper.triplesToElements(displayTriples);
    setNodeCount(elements.nodes.length);
    setEdgeCount(elements.edges.length);
    if (cyRef.current) {
      try {
        cyRef.current.stop();
        cyRef.current.destroy();
      } catch (_) {}
      cyRef.current = null;
    }
    let destroyed = false;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...elements.nodes, ...elements.edges],
      style: buildStylesheet() as cytoscape.StylesheetStyle[],
      minZoom: 0.02,
      maxZoom: 5,
    });
    const layoutOptions = LayoutManager.getLayout(
      currentLayout,
      elements.nodes.length
    ) as cytoscape.LayoutOptions;
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      if (destroyed || !cyRef.current) return;
      try {
        cy.layout(layoutOptions).run();
      } catch (_) {}
    });

    cy.on('tap', 'node', (evt: EventObject) => {
      if (destroyed) return;
      const node = evt.target as NodeSingular;
      const data: NodeData = {
        id: node.id(),
        label: node.data('label'),
        type: node.data('type'),
        uri: node.data('uri'),
        degree: node.degree(false),
        inEdges: node.incomers('edge').map((e: cytoscape.EdgeSingular) => e.data('label')),
        outEdges: node.outgoers('edge').map((e: cytoscape.EdgeSingular) => e.data('label')),
      };
      setSelectedNode(data);
      onNodeSelect?.(data);
      // Dim everything outside the closed neighbourhood
      cy.elements().removeClass('dimmed highlighted');
      const neighbourhood = node.closedNeighborhood();
      cy.elements().not(neighbourhood).addClass('dimmed');
      node.addClass('highlighted');
    });

    cy.on('tap', (evt: EventObject) => {
      if (destroyed) return;
      if (evt.target === cy) {
        setSelectedNode(null);
        onNodeSelect?.(null);
        cy.elements().removeClass('dimmed highlighted');
      }
    });

    cyRef.current = cy;
    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      try {
        cy.stop();
        cy.destroy();
      } catch (_) {}
      cyRef.current = null;
    };
  }, [displayTriples]); // intentionally omits currentLayout & buildStylesheet — handled separately

  // Stylesheet-only update on theme change
  useEffect(() => {
    if (!cyRef.current) return;
    try {
      cyRef.current.style(buildStylesheet() as cytoscape.StylesheetStyle[]);
    } catch (_) {}
  }, [theme, buildStylesheet]);

  // ESC exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  const handleLayoutChange = useCallback((newLayout: LayoutType) => {
    setCurrentLayout(newLayout);
    if (!cyRef.current) return;
    try {
      cyRef.current
        .layout(
          LayoutManager.getLayout(
            newLayout,
            cyRef.current.nodes().length
          ) as cytoscape.LayoutOptions
        )
        .run();
    } catch (_) {}
  }, []);
  const handleZoomIn = useCallback(() => {
    try {
      cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
    } catch (_) {}
  }, []);
  const handleZoomOut = useCallback(() => {
    try {
      cyRef.current?.zoom(cyRef.current.zoom() * 0.75);
    } catch (_) {}
  }, []);
  const handleFit = useCallback(() => {
    try {
      cyRef.current?.fit(undefined, 40);
    } catch (_) {}
  }, []);
  const handleReset = useCallback(() => {
    handleLayoutChange(currentLayout);
  }, [currentLayout, handleLayoutChange]);

  const handleExportPng = useCallback(() => {
    if (!cyRef.current) return;
    try {
      const png = cyRef.current.png({
        output: 'blob',
        bg: c.bgPrimary,
        scale: 2,
      }) as unknown as Blob;
      const url = URL.createObjectURL(png);
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: 'knowledge-graph.png',
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (_) {}
  }, [c.bgPrimary]);

  const clearHighlights = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
    if (cyRef.current) cyRef.current.elements().removeClass('dimmed highlighted');
  }, [onNodeSelect]);

  const isTruncated = !searchText && !selectedPredicate && triples.length > maxNodes * 2;
  const isNoMatch = triples.length > 0 && displayTriples.length === 0;
  const fsStyle: React.CSSProperties = isFullscreen
    ? { position: 'fixed', inset: 0, zIndex: 9999, borderRadius: 0 }
    : {};

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: c.bgPrimary,
        borderRadius: isFullscreen ? 0 : '8px',
        overflow: 'hidden',
        border: `1px solid ${c.border}`,
        boxShadow: theme.shadows.md,
        ...fsStyle,
      }}
    >
      <GraphControls
        currentLayout={currentLayout}
        onLayoutChange={handleLayoutChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onReset={handleReset}
        onExportPng={handleExportPng}
        onFullscreen={() => setIsFullscreen((f) => !f)}
        isFullscreen={isFullscreen}
        nodeCount={nodeCount}
        edgeCount={edgeCount}
        totalTriples={triples.length}
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedPredicate={selectedPredicate}
        predicates={allPredicates}
        onPredicateChange={setSelectedPredicate}
        theme={theme}
      />

      {/* Large-graph truncation notice */}
      {isTruncated && (
        <div
          style={{
            padding: '5px 14px',
            background: `${c.warning}14`,
            borderBottom: `1px solid ${c.warning}40`,
            fontSize: '11px',
            color: c.warning,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span>⚠</span>
          <span>
            Large graph — showing top <strong>{nodeCount}</strong> most-connected nodes from{' '}
            {triples.length.toLocaleString()} triples. Use search or predicate filter to explore a
            subset.
          </span>
        </div>
      )}

      {/* No filter match */}
      {isNoMatch && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: c.textMuted,
            gap: 12,
            background: c.bgPrimary,
          }}
        >
          <span style={{ fontSize: '40px', opacity: 0.2 }}>⌕</span>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>No matching triples</div>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>
            Try a different search term or clear the filter
          </div>
        </div>
      )}

      {/* Empty state */}
      {triples.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: c.textMuted,
            gap: 16,
            zIndex: 5,
          }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ opacity: 0.3 }}>
            <circle cx="20" cy="32" r="8" stroke="currentColor" strokeWidth="2" />
            <circle cx="44" cy="16" r="8" stroke="currentColor" strokeWidth="2" />
            <circle cx="44" cy="48" r="8" stroke="currentColor" strokeWidth="2" />
            <line x1="28" y1="29" x2="36" y2="19" stroke="currentColor" strokeWidth="2" />
            <line x1="28" y1="35" x2="36" y2="45" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>No graph data</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Load an RDF file to visualize</div>
        </div>
      )}

      <div
        ref={containerRef}
        style={{ flex: 1, width: '100%', background: c.bgPrimary, cursor: 'grab' }}
      />

      {selectedNode && <NodeDetails node={selectedNode} onClose={clearHighlights} theme={theme} />}

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          padding: '6px 14px',
          borderTop: `1px solid ${c.border}`,
          background: c.bgSecondary,
          fontSize: '11px',
          color: c.textSecondary,
          flexWrap: 'wrap',
          flexShrink: 0,
          alignItems: 'center',
        }}
      >
        {[
          { color: c.nodeResource, label: 'Resource', shape: '●' },
          { color: c.nodeLiteral, label: 'Literal', shape: '■' },
          { color: c.nodeClass, label: 'Class', shape: '⬡' },
          { color: c.edgeAsserted, label: 'Asserted', shape: '—' },
          { color: c.edgeInferred, label: 'Inferred', shape: '╌' },
        ].map(({ color, label, shape }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color, fontWeight: 700 }}>{shape}</span>
            <span>{label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        {isFullscreen && (
          <span style={{ fontSize: '10px', color: c.textMuted, fontStyle: 'italic' }}>
            Press Esc to exit fullscreen
          </span>
        )}
      </div>
    </div>
  );
};
