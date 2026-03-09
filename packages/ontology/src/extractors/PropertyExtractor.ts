import { Namespace, sym } from 'rdflib';
import { PropertyNode } from '@kg/core';

const RDF = Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
const RDFS = Namespace('http://www.w3.org/2000/01/rdf-schema#');
const OWL = Namespace('http://www.w3.org/2002/07/owl#');

export class PropertyExtractor {
    extractProperties(store: any): PropertyNode[] {
        const properties: PropertyNode[] = [];
        const processedUris = new Set<string>(); // Éviter les doublons

        // ObjectProperty
        const objectProps = store.match(null, RDF('type'), OWL('ObjectProperty'));
        objectProps.forEach((stmt: any) => {
            const uri = stmt.subject.value;
            if (!processedUris.has(uri)) {
                processedUris.add(uri);
                properties.push(this.buildPropertyNode(store, uri, 'ObjectProperty'));
            }
        });

        // DatatypeProperty
        const datatypeProps = store.match(null, RDF('type'), OWL('DatatypeProperty'));
        datatypeProps.forEach((stmt: any) => {
            const uri = stmt.subject.value;
            if (!processedUris.has(uri)) {
                processedUris.add(uri);
                properties.push(this.buildPropertyNode(store, uri, 'DatatypeProperty'));
            }
        });

        // AnnotationProperty
        const annotationProps = store.match(null, RDF('type'), OWL('AnnotationProperty'));
        annotationProps.forEach((stmt: any) => {
            const uri = stmt.subject.value;
            if (!processedUris.has(uri)) {
                processedUris.add(uri);
                properties.push(this.buildPropertyNode(store, uri, 'AnnotationProperty'));
            }
        });

        // RDF Property générique
        const rdfProps = store.match(null, RDF('type'), RDF('Property'));
        rdfProps.forEach((stmt: any) => {
            const uri = stmt.subject.value;
            if (!processedUris.has(uri)) {
                processedUris.add(uri);
                properties.push(this.buildPropertyNode(store, uri, 'Property'));
            }
        });

        return properties;
    }

    private buildPropertyNode(
        store: any, 
        uri: string, 
        type: 'ObjectProperty' | 'DatatypeProperty' | 'AnnotationProperty' | 'Property'
    ): PropertyNode {
        return {
            uri,
            label: this.getLabel(store, uri),
            comment: this.getComment(store, uri),
            type,
            domain: this.getDomain(store, uri),
            range: this.getRange(store, uri),
            subPropertyOf: this.getSubPropertyOf(store, uri),
            children: [],
        };
    }

    private getLabel(store: any, uri: string): string | undefined {
        const labels = store.match(sym(uri), RDFS('label'), null);
        if (labels.length > 0) return labels[0].object.value;
        // Fallback: extraire le nom local de l'URI
        const localName = uri.split('#').pop() || uri.split('/').pop();
        return localName || uri;
    }

    private getComment(store: any, uri: string): string | undefined {
        const comments = store.match(sym(uri), RDFS('comment'), null);
        if (comments.length > 0) return comments[0].object.value;
        return undefined;
    }

    private getDomain(store: any, uri: string): string[] {
        const domains = store.match(sym(uri), RDFS('domain'), null);
        return domains.map((d: any) => d.object.value);
    }

    private getRange(store: any, uri: string): string[] {
        const ranges = store.match(sym(uri), RDFS('range'), null);
        return ranges.map((r: any) => r.object.value);
    }

    private getSubPropertyOf(store: any, uri: string): string[] {
        const parents = store.match(sym(uri), RDFS('subPropertyOf'), null);
        return parents.map((p: any) => p.object.value);
    }
}