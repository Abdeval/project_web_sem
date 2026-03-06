import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, NodeSingular, EventObject } from 'cytoscape';
import { Triple, GraphMapper } from '../../graph/GraphMapper';
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

export const GraphView: React.FC<GraphViewProps> = ({
    triples,
    layout: initialLayout = 'force',
    onNodeSelect,
    maxNodes = 1000,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<Core | null>(null);
    const { theme } = useTheme();
    const c = theme.colors;

    const [currentLayout, setCurrentLayout] = useState<LayoutType>(initialLayout);
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [nodeCount, setNodeCount] = useState(0);
    const [edgeCount, setEdgeCount] = useState(0);
    const [isLargeGraph, setIsLargeGraph] = useState(false);

    const buildStylesheet = useCallback(() => [
        {
            selector: 'node',
            style: {
                'background-color': c.nodeResource,
                'border-width': 2,
                'border-color': c.border,
                label: 'data(label)',
                'font-size': '11px',
                'font-family': "'JetBrains Mono', monospace",
                color: c.textPrimary,
                'text-valign': 'bottom',
                'text-halign': 'center',
                'text-margin-y': 4,
                'min-zoomed-font-size': 8,
                width: 32,
                height: 32,
                'text-background-color': c.bgPrimary,
                'text-background-opacity': 0.7,
                'text-background-padding': '2px',
                'text-background-shape': 'roundrectangle',
            },
        },
        {
            selector: 'node.resource-node',
            style: { 'background-color': c.nodeResource, shape: 'ellipse' },
        },
        {
            selector: 'node.literal-node',
            style: { 'background-color': c.nodeLiteral, shape: 'round-rectangle', width: 40, height: 24 },
        },
        {
            selector: 'node.class-node',
            style: {
                'background-color': c.nodeClass,
                shape: 'hexagon',
                width: 36,
                height: 36,
                'border-width': 3,
                'border-color': c.nodeClass,
                'border-opacity': 0.5,
            },
        },
        {
            selector: 'node:selected',
            style: { 'background-color': c.nodeSelected, 'border-color': c.nodeSelected, 'border-width': 3 },
        },
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
                'font-family': "'JetBrains Mono', monospace",
                color: c.textSecondary,
                'text-rotation': 'autorotate',
                'text-margin-y': -8,
                'min-zoomed-font-size': 6,
                'text-background-color': c.bgPrimary,
                'text-background-opacity': 0.6,
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
    ], [c]);

    // Build/rebuild Cytoscape when triples change
    useEffect(() => {
        if (!containerRef.current) return;

        const displayTriples = triples.length > maxNodes * 3
            ? triples.slice(0, maxNodes * 3)
            : triples;

        setIsLargeGraph(triples.length > maxNodes * 3);

        const elements = GraphMapper.triplesToElements(displayTriples);
        setNodeCount(elements.nodes.length);
        setEdgeCount(elements.edges.length);

        if (cyRef.current) { cyRef.current.destroy(); cyRef.current = null; }

        const cy = cytoscape({
            container: containerRef.current,
            elements: [...elements.nodes, ...elements.edges],
            style: buildStylesheet() as cytoscape.StylesheetStyle[],
            layout: LayoutManager.getLayout(currentLayout, elements.nodes.length) as cytoscape.LayoutOptions,
            minZoom: 0.05,
            maxZoom: 4,
            wheelSensitivity: 0.3,
        });

        cy.on('tap', 'node', (evt: EventObject) => {
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
        });

        cy.on('tap', (evt: EventObject) => {
            if (evt.target === cy) {
                setSelectedNode(null);
                onNodeSelect?.(null);
            }
        });

        cyRef.current = cy;

        return () => { cy.destroy(); cyRef.current = null; };
    }, [triples, maxNodes]);

    // Update stylesheet only when theme changes
    useEffect(() => {
        if (!cyRef.current) return;
        cyRef.current.style(buildStylesheet() as cytoscape.StylesheetStyle[]);
    }, [theme, buildStylesheet]);

    const handleLayoutChange = useCallback((newLayout: LayoutType) => {
        setCurrentLayout(newLayout);
        if (!cyRef.current) return;
        cyRef.current
            .layout(LayoutManager.getLayout(newLayout, cyRef.current.nodes().length) as cytoscape.LayoutOptions)
            .run();
    }, []);

    const handleZoomIn = useCallback(() => { cyRef.current?.zoom(cyRef.current.zoom() * 1.3); }, []);
    const handleZoomOut = useCallback(() => { cyRef.current?.zoom(cyRef.current.zoom() * 0.75); }, []);
    const handleFit = useCallback(() => { cyRef.current?.fit(undefined, 40); }, []);
    const handleReset = useCallback(() => { handleLayoutChange(currentLayout); }, [currentLayout, handleLayoutChange]);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: c.bgPrimary,
                borderRadius: '8px',
                overflow: 'hidden',
                border: `1px solid ${c.border}`,
                boxShadow: theme.shadows.md,
            }}
        >
            <GraphControls
                currentLayout={currentLayout}
                onLayoutChange={handleLayoutChange}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFit={handleFit}
                onReset={handleReset}
                nodeCount={nodeCount}
                edgeCount={edgeCount}
                theme={theme}
            />

            {isLargeGraph && (
                <div style={{ padding: '8px 16px', background: `${c.warning}22`, borderBottom: `1px solid ${c.warning}44`, fontSize: '12px', color: c.warning }}>
                    ⚠ Large graph — showing first {maxNodes * 3} of {triples.length} triples
                </div>
            )}

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
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ opacity: 0.4 }}>
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

            {selectedNode && (
                <NodeDetails
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    theme={theme}
                />
            )}

            {/* Legend */}
            <div
                style={{
                    display: 'flex',
                    gap: 16,
                    padding: '8px 16px',
                    borderTop: `1px solid ${c.border}`,
                    background: c.bgSecondary,
                    fontSize: '11px',
                    color: c.textSecondary,
                    flexWrap: 'wrap',
                    flexShrink: 0,
                }}
            >
                {[
                    { color: c.nodeResource, label: 'Resource', shape: '●' },
                    { color: c.nodeLiteral, label: 'Literal', shape: '■' },
                    { color: c.nodeClass, label: 'Class', shape: '⬡' },
                    { color: c.edgeAsserted, label: 'Asserted', shape: '─' },
                    { color: c.edgeInferred, label: 'Inferred', shape: '╌' },
                ].map(({ color, label, shape }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color, fontWeight: 700 }}>{shape}</span>
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};