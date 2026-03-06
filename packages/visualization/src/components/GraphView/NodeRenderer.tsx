import type { Theme } from '../../theme/ThemeProvider';

export type NodeType = 'resource' | 'literal' | 'class';

export function getNodeStyle(type: NodeType, colors: Theme['colors']): Record<string, unknown> {
    switch (type) {
        case 'class':
            return {
                'background-color': colors.nodeClass,
                shape: 'hexagon',
                width: 36, height: 36,
                'border-width': 3,
                'border-color': colors.nodeClass,
                'border-opacity': 0.4,
            };
        case 'literal':
            return {
                'background-color': colors.nodeLiteral,
                shape: 'round-rectangle',
                width: 40, height: 24,
            };
        case 'resource':
        default:
            return {
                'background-color': colors.nodeResource,
                shape: 'ellipse',
                width: 32, height: 32,
            };
    }
}

export function detectNodeType(uri: string, isClass: boolean): NodeType {
    if (isClass) return 'class';
    if (!uri.startsWith('http') && !uri.startsWith('_:')) return 'literal';
    return 'resource';
}

export function getNodeClass(type: NodeType): string {
    return `${type}-node`;
}