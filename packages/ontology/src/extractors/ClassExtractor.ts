import { Namespace, sym } from 'rdflib';
import { ClassNode } from '@kg/core';

const RDF = Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
const RDFS = Namespace('http://www.w3.org/2000/01/rdf-schema#');
const OWL = Namespace('http://www.w3.org/2002/07/owl#');

export class ClassExtractor {
    extractClasses(store: any): ClassNode[] {
        const classes: ClassNode[] = [];
        const processedUris = new Set<string>(); // Éviter les doublons

        // Classes OWL
        const owlClasses = store.match(null, RDF('type'), OWL('Class'));
        owlClasses.forEach((stmt: any) => {
            const uri = stmt.subject.value;
            
            // Ignorer les classes système OWL/RDFS
            if (this.isSystemClass(uri)) return;
            
            if (!processedUris.has(uri)) {
                processedUris.add(uri);
                classes.push(this.buildClassNode(store, uri));
            }
        });

        // Classes RDFS
        const rdfsClasses = store.match(null, RDF('type'), RDFS('Class'));
        rdfsClasses.forEach((stmt: any) => {
            const uri = stmt.subject.value;
            
            if (this.isSystemClass(uri)) return;
            
            if (!processedUris.has(uri)) {
                processedUris.add(uri);
                classes.push(this.buildClassNode(store, uri));
            }
        });

        return classes;
    }

    private buildClassNode(store: any, uri: string): ClassNode {
        return {
            uri,
            label: this.getLabel(store, uri),
            comment: this.getComment(store, uri),
            subClassOf: this.getSubClassOf(store, uri),
            children: [],
        };
    }

    private isSystemClass(uri: string): boolean {
        // Ignorer les classes système OWL et RDFS
        return uri.includes('http://www.w3.org/2002/07/owl#') ||
               uri.includes('http://www.w3.org/2000/01/rdf-schema#') ||
               uri.includes('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
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

    private getSubClassOf(store: any, uri: string): string[] {
        const parents = store.match(sym(uri), RDFS('subClassOf'), null);
        return parents
            .map((p: any) => p.object.value)
            .filter((parentUri: string) => !this.isSystemClass(parentUri));
    }
}