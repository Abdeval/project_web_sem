/**
 * Graph Types - For visualization
 */
/**
 * Graph Node (for visualization)
 */
export interface GraphNode {
    id: string;
    label: string;
    type: 'resource' | 'literal' | 'class' | 'property';
    uri?: string;
    properties?: Record<string, string[]>;
    inferred?: boolean;
}
/**
 * Graph Edge (for visualization)
 */
export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    label: string;
    predicate: string;
    inferred?: boolean;
}
/**
 * Graph Data (for visualization libraries like Cytoscape)
 */
export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
/**
 * Layout Algorithm
 */
export type LayoutAlgorithm = 'force' | 'hierarchical' | 'grid' | 'circular' | 'breadthfirst';
/**
 * Graph View Configuration
 */
export interface GraphViewConfig {
    layout: LayoutAlgorithm;
    showLiterals: boolean;
    showInferred: boolean;
    maxNodes?: number;
    highlightedNodes?: string[];
}
//# sourceMappingURL=graph.d.ts.map