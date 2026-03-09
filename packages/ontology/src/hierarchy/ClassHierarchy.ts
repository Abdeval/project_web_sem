import { ClassNode } from '@kg/core';

export class ClassHierarchy {
    private classesMap: Map<string, ClassNode> = new Map();

    constructor(classes: ClassNode[]) {
        // Crée un map URI → ClassNode
        classes.forEach(cls => this.classesMap.set(cls.uri, { ...cls, children: [] }));
    }

    buildHierarchy(): ClassNode {
        // Premièrement, on attache chaque classe à ses parents
        const allNodes = Array.from(this.classesMap.values());
        const roots: ClassNode[] = [];

        allNodes.forEach(node => {
            if (node.subClassOf.length === 0) {
                roots.push(node); // pas de parent → racine
            } else {
                node.subClassOf.forEach(parentUri => {
                    const parentNode = this.classesMap.get(parentUri);
                    if (parentNode) {
                        parentNode.children.push(node);
                    } else {
                        // parent inconnu, considérer comme racine
                        roots.push(node);
                    }
                });
            }
        });

        // Détection simple de cycles
        const visited = new Set<string>();
        const stack = new Set<string>();
        const hasCycle = (node: ClassNode): boolean => {
            if (stack.has(node.uri)) return true; // cycle détecté
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
                console.warn(`Cycle détecté dans la hiérarchie à partir de ${root.uri}`);
            }
        });

        // Pour respecter OWL/RDFS, si plusieurs racines, créer une racine artificielle "owl:Thing"
        if (roots.length === 1) return roots[0];
        return {
            uri: 'http://www.w3.org/2002/07/owl#Thing',
            label: 'Thing',
            subClassOf: [],
            children: roots,
        };
    }
}