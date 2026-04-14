/**
 * Graph Mapper - Convert RDF triples to Cytoscape graph format
 */

export interface Triple {
    subject: string;
    predicate: string;
    object: string;
    inferred?: boolean;
}

export interface CytoscapeNode {
    data: {
        id: string;
        label: string;
        type: 'resource' | 'literal' | 'class';
        uri: string;
    };
    classes?: string;
}

export interface CytoscapeEdge {
    data: {
        id: string;
        source: string;
        target: string;
        label: string;
        predicate: string;
        inferred: boolean;
    };
    classes?: string;
}

export interface CytoscapeElements {
    nodes: CytoscapeNode[];
    edges: CytoscapeEdge[];
}

const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

export function shortenUri(uri: string): string {
    if (!uri) return '';
    if (!uri.startsWith('http') && !uri.startsWith('_:')) return uri;
    const hashIdx = uri.lastIndexOf('#');
    if (hashIdx !== -1) return uri.slice(hashIdx + 1);
    const slashIdx = uri.lastIndexOf('/');
    if (slashIdx !== -1) return uri.slice(slashIdx + 1);
    return uri;
}

function detectNodeType(uri: string, isClass: boolean): CytoscapeNode['data']['type'] {
    if (isClass) return 'class';
    if (!uri.startsWith('http') && !uri.startsWith('_:')) return 'literal';
    return 'resource';
}

export class GraphMapper {
    static triplesToElements(triples: Triple[]): CytoscapeElements {
        const nodesMap = new Map<string, CytoscapeNode>();
        const edges: CytoscapeEdge[] = [];
        const classSubjects = new Set<string>();
        // Deduplicate edges: an RDF triple (subject, predicate, object) is a set element —
        // the same combination must never produce two visual arrows.
        const seenEdges = new Set<string>();

        for (const triple of triples) {
            if (triple.predicate === RDF_TYPE) classSubjects.add(triple.object);
        }

        for (const { subject, predicate, object, inferred = false } of triples) {
            // Build a stable, collision-resistant key using a null-byte separator
            // (URIs never contain \x00, so the key is unambiguous).
            const edgeKey = `${subject}\x00${predicate}\x00${object}`;
            if (seenEdges.has(edgeKey)) continue;
            seenEdges.add(edgeKey);

            if (!nodesMap.has(subject)) {
                nodesMap.set(subject, {
                    data: {
                        id: subject,
                        label: shortenUri(subject),
                        type: detectNodeType(subject, classSubjects.has(subject)),
                        uri: subject,
                    },
                    classes: classSubjects.has(subject) ? 'class-node' : 'resource-node',
                });
            }

            if (!nodesMap.has(object)) {
                const isLiteral = !object.startsWith('http') && !object.startsWith('_:');
                nodesMap.set(object, {
                    data: {
                        id: object,
                        label: shortenUri(object),
                        type: detectNodeType(object, classSubjects.has(object) && predicate === RDF_TYPE),
                        uri: object,
                    },
                    classes: isLiteral
                        ? 'literal-node'
                        : classSubjects.has(object) && predicate === RDF_TYPE
                            ? 'class-node'
                            : 'resource-node',
                });
            }

            // Stable, human-readable edge ID derived from the triple content (not an index).
            const edgeId = `${shortenUri(subject)}__${shortenUri(predicate)}__${shortenUri(object)}`;
            edges.push({
                data: {
                    id: edgeId,
                    source: subject,
                    target: object,
                    label: shortenUri(predicate),
                    predicate,
                    inferred,
                },
                classes: inferred ? 'inferred-edge' : 'asserted-edge',
            });
        }

        return { nodes: Array.from(nodesMap.values()), edges };
    }
}