export type LayoutType = 'force' | 'hierarchical' | 'grid' | 'circle' | 'concentric';

export interface LayoutConfig {
    name: string;
    [key: string]: unknown;
}

export class LayoutManager {
    static getLayout(type: LayoutType, nodeCount: number): LayoutConfig {
        switch (type) {
            case 'force':
                return {
                    name: 'cose',
                    animate: true,
                    animationDuration: 500,
                    randomize: false,
                    nodeRepulsion: () => 400000,
                    idealEdgeLength: () => 100,
                    edgeElasticity: () => 100,
                    gravity: 80,
                    numIter: nodeCount > 200 ? 100 : 250,
                    initialTemp: 200,
                    coolingFactor: 0.95,
                    minTemp: 1.0,
                    fit: true,
                    padding: 30,
                };
            case 'hierarchical':
                return {
                    name: 'breadthfirst',
                    directed: true,
                    animate: true,
                    animationDuration: 500,
                    spacingFactor: 1.5,
                    fit: true,
                    padding: 30,
                    avoidOverlap: true,
                };
            case 'grid':
                return {
                    name: 'grid',
                    animate: true,
                    animationDuration: 400,
                    fit: true,
                    padding: 30,
                    avoidOverlap: true,
                };
            case 'circle':
                return {
                    name: 'circle',
                    animate: true,
                    animationDuration: 400,
                    fit: true,
                    padding: 30,
                    startAngle: (3 / 2) * Math.PI,
                };
            case 'concentric':
                return {
                    name: 'concentric',
                    animate: true,
                    animationDuration: 400,
                    fit: true,
                    padding: 30,
                    concentric: (node: { degree: () => number }) => node.degree(),
                    levelWidth: (nodes: { maxDegree: () => number }) => nodes.maxDegree() / 4,
                };
            default:
                return { name: 'cose', fit: true, padding: 30 };
        }
    }

    static getLayoutLabel(type: LayoutType): string {
        const labels: Record<LayoutType, string> = {
            force: 'Force-Directed',
            hierarchical: 'Hierarchical',
            grid: 'Grid',
            circle: 'Circle',
            concentric: 'Concentric',
        };
        return labels[type] || type;
    }

    static getAllLayouts(): LayoutType[] {
        return ['force', 'hierarchical', 'grid', 'circle', 'concentric'];
    }
}