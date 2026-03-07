/**
 * OWL RL Reasoner - Implements a subset of OWL 2 RL entailment rules
 *
 * Rules implemented:
 * - owl:inverseOf      : X P Y, P owl:inverseOf Q  -> Y Q X
 * - owl:SymmetricProperty : X P Y, P type SymmetricProperty -> Y P X
 * - owl:TransitiveProperty: X P Y, Y P Z, P type TransitiveProperty -> X P Z
 * - owl:equivalentClass   : A equivalentClass B -> A subClassOf B AND B subClassOf A
 * - owl:equivalentProperty: P equivalentProperty Q -> P subPropertyOf Q AND Q subPropertyOf P
 * - owl:sameAs            : X sameAs Y, X P O -> Y P O (and symmetric)
 */

import { InferredTriple, Triple, NamedNode } from '@kg/core';

const URI = {
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    subClassOf: 'http://www.w3.org/2000/01/rdf-schema#subClassOf',
    subPropertyOf: 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf',
    inverseOf: 'http://www.w3.org/2002/07/owl#inverseOf',
    symmetricProperty: 'http://www.w3.org/2002/07/owl#SymmetricProperty',
    transitiveProperty: 'http://www.w3.org/2002/07/owl#TransitiveProperty',
    equivalentClass: 'http://www.w3.org/2002/07/owl#equivalentClass',
    equivalentProperty: 'http://www.w3.org/2002/07/owl#equivalentProperty',
    sameAs: 'http://www.w3.org/2002/07/owl#sameAs',
} as const;

function nn(uri: string): NamedNode {
    return { type: 'NamedNode', value: uri };
}

function tripleKey(s: string, p: string, o: string): string {
    return `${s}|${p}|${o}`;
}

function makeInferred(
    subject: Triple['subject'],
    predicate: NamedNode,
    object: Triple['object'],
    rule: string,
    sources: Triple[],
): InferredTriple {
    return { subject, predicate, object, inferred: true, rule, source: sources };
}

export class OWLRLReasoner {
    /**
     * Perform OWL RL reasoning using forward-chaining until fixed-point.
     * Returns all newly inferred triples (not present in baseTriples).
     */
    reason(baseTriples: Triple[]): InferredTriple[] {
        const known = new Set<string>(
            baseTriples.map((t) => tripleKey(t.subject.value, t.predicate.value, t.object.value)),
        );

        const allInferred: InferredTriple[] = [];
        let workset: Triple[] = [...baseTriples];

        let changed = true;
        while (changed) {
            changed = false;
            const round: InferredTriple[] = [];

            const byPred = this.groupByPredicate(workset);

            const tryAdd = (inf: InferredTriple) => {
                const key = tripleKey(inf.subject.value, inf.predicate.value, inf.object.value);
                if (!known.has(key)) {
                    known.add(key);
                    round.push(inf);
                    changed = true;
                }
            };

            // ── owl:inverseOf ──────────────────────────────────────────────────
            // P owl:inverseOf Q, X P Y -> Y Q X
            for (const inv of byPred.get(URI.inverseOf) ?? []) {
                if (inv.object.type !== 'NamedNode') continue;
                const P = inv.subject.value;
                const Q = inv.object as NamedNode;
                for (const usage of byPred.get(P) ?? []) {
                    if (usage.object.type !== 'Literal') {
                        tryAdd(makeInferred(
                            usage.object as NamedNode, Q, usage.subject,
                            'owl:inverseOf', [inv, usage],
                        ));
                    }
                }
                // Also: Q owl:inverseOf P (symmetric relation), X Q Y -> Y P X
                for (const usage of byPred.get(Q.value) ?? []) {
                    if (usage.object.type !== 'Literal') {
                        tryAdd(makeInferred(
                            usage.object as NamedNode, nn(P), usage.subject,
                            'owl:inverseOf (symmetric)', [inv, usage],
                        ));
                    }
                }
            }

            // ── owl:SymmetricProperty ──────────────────────────────────────────
            // P type SymmetricProperty, X P Y -> Y P X
            const symmetricProps = new Set<string>();
            for (const t of byPred.get(URI.type) ?? []) {
                if (t.object.value === URI.symmetricProperty) {
                    symmetricProps.add(t.subject.value);
                }
            }
            for (const prop of symmetricProps) {
                for (const usage of byPred.get(prop) ?? []) {
                    if (usage.object.type !== 'Literal') {
                        tryAdd(makeInferred(
                            usage.object as NamedNode, nn(prop), usage.subject,
                            'owl:SymmetricProperty', [usage],
                        ));
                    }
                }
            }

            // ── owl:TransitiveProperty ─────────────────────────────────────────
            // P type TransitiveProperty, X P Y, Y P Z -> X P Z
            const transitiveProps = new Set<string>();
            for (const t of byPred.get(URI.type) ?? []) {
                if (t.object.value === URI.transitiveProperty) {
                    transitiveProps.add(t.subject.value);
                }
            }
            for (const prop of transitiveProps) {
                const edges = byPred.get(prop) ?? [];
                for (const t1 of edges) {
                    for (const t2 of edges) {
                        if (t1.object.value === t2.subject.value && t1.subject.value !== t2.object.value) {
                            tryAdd(makeInferred(
                                t1.subject, nn(prop), t2.object,
                                'owl:TransitiveProperty', [t1, t2],
                            ));
                        }
                    }
                }
            }

            // ── owl:equivalentClass ────────────────────────────────────────────
            // A equivalentClass B -> A subClassOf B AND B subClassOf A
            for (const eq of byPred.get(URI.equivalentClass) ?? []) {
                if (eq.object.type !== 'NamedNode') continue;
                tryAdd(makeInferred(eq.subject, nn(URI.subClassOf), eq.object,
                    'owl:equivalentClass -> subClassOf', [eq]));
                tryAdd(makeInferred(eq.object as NamedNode, nn(URI.subClassOf), eq.subject,
                    'owl:equivalentClass -> subClassOf (reverse)', [eq]));
            }

            // ── owl:equivalentProperty ─────────────────────────────────────────
            // P equivalentProperty Q -> P subPropertyOf Q AND Q subPropertyOf P
            for (const eq of byPred.get(URI.equivalentProperty) ?? []) {
                if (eq.object.type !== 'NamedNode') continue;
                tryAdd(makeInferred(eq.subject, nn(URI.subPropertyOf), eq.object,
                    'owl:equivalentProperty -> subPropertyOf', [eq]));
                tryAdd(makeInferred(eq.object as NamedNode, nn(URI.subPropertyOf), eq.subject,
                    'owl:equivalentProperty -> subPropertyOf (reverse)', [eq]));
            }

            // ── owl:sameAs ─────────────────────────────────────────────────────
            // X sameAs Y, X P O -> Y P O (and Y P O -> X P O)
            for (const same of byPred.get(URI.sameAs) ?? []) {
                if (same.object.type !== 'NamedNode') continue;
                const X = same.subject.value;
                const Y = same.object as NamedNode;
                // Forward: copy all triples where subject=X to subject=Y
                for (const [pred, triples] of byPred) {
                    if (pred === URI.sameAs) continue;
                    for (const t of triples) {
                        if (t.subject.value === X) {
                            tryAdd(makeInferred(Y, nn(pred), t.object, 'owl:sameAs', [same, t]));
                        }
                        if (t.subject.value === Y.value) {
                            tryAdd(makeInferred(same.subject, nn(pred), t.object, 'owl:sameAs (reverse)', [same, t]));
                        }
                    }
                }
            }

            allInferred.push(...round);
            workset = [...workset, ...round];
        }

        return allInferred;
    }

    private groupByPredicate(triples: Triple[]): Map<string, Triple[]> {
        const map = new Map<string, Triple[]>();
        for (const t of triples) {
            const p = t.predicate.value;
            if (!map.has(p)) map.set(p, []);
            map.get(p)!.push(t);
        }
        return map;
    }
}
