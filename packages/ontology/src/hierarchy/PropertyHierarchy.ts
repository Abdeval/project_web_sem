import { PropertyNode } from '@kg/core';

export class PropertyHierarchy {
    private propertiesMap: Map<string, PropertyNode> = new Map();

    constructor(properties: PropertyNode[]) {
        properties.forEach(p => this.propertiesMap.set(p.uri, { ...p, children: [] }));
    }

    buildHierarchy(): PropertyNode {
        const allNodes = Array.from(this.propertiesMap.values());
        const roots: PropertyNode[] = [];

        allNodes.forEach(node => {
            if (node.subPropertyOf.length === 0) {
                roots.push(node); // pas de parent → racine
            } else {
                node.subPropertyOf.forEach(parentUri => {
                    const parentNode = this.propertiesMap.get(parentUri);
                    if (parentNode) {
                        parentNode.children.push(node);
                    } else {
                        roots.push(node); // parent inconnu → racine
                    }
                });
            }
        });

        // Détection de cycles
        const visited = new Set<string>();
        const stack = new Set<string>();
        const hasCycle = (node: PropertyNode): boolean => {
            if (stack.has(node.uri)) return true;
            if (visited.has(node.uri)) return false;
            visited.add(node.uri);
            stack.add(node.uri);
            for (const child of node.children) {
                if (hasCycle(child)) return true;
            }
            stack.delete(node.uri);
            return false;
        };

        roots.forEach(root => {
            if (hasCycle(root)) {
                console.warn(`Cycle détecté dans la hiérarchie des propriétés à partir de ${root.uri}`);
            }
        });

        // Si plusieurs racines, créer une racine artificielle "rdf:Property"
        if (roots.length === 1) return roots[0];
        return {
            uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property',
            label: 'Property',
            type: 'Property',
            domain: [],
            range: [],
            subPropertyOf: [],
            children: roots,
            comment: undefined,
        };
    }
}