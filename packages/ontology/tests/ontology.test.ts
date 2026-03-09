import { OntologyManager } from '../src/OntologyManager';
import * as fs from 'fs';
import * as path from 'path';

describe('OntologyManager Tests', () => {
    let manager: OntologyManager;
    let owlContent: string;

    beforeAll(() => {
        manager = new OntologyManager();
        // Charger myOntology.owl depuis le dossier ontologies
        const owlPath = path.join(__dirname, '../ontologies/myOntology.owl');
        owlContent = fs.readFileSync(owlPath, 'utf-8');
    });

    test('Load OWL ontology', async () => {
        await manager.loadOntology(owlContent, 'owl');
        const classes = manager.getClasses();
        const properties = manager.getProperties();

        console.log(`Classes loaded: ${classes.length}`);
        console.log(`Properties loaded: ${properties.length}`);

        expect(classes.length).toBeGreaterThan(0);
        expect(properties.length).toBeGreaterThan(0);
    });

    test('Get classes', () => {
        const classes = manager.getClasses();
        
        expect(classes.length).toBe(2); // ClassA et ClassB
        
        const classLabels = classes.map(c => c.label);
        expect(classLabels).toContain('ClassA');
        expect(classLabels).toContain('ClassB');
    });

    test('Get properties', () => {
        const properties = manager.getProperties();
        
        expect(properties.length).toBe(1); // hasPart
        
        const hasPart = properties[0];
        expect(hasPart.label).toBe('hasPart');
        expect(hasPart.type).toBe('ObjectProperty');
    });

    test('Class hierarchy', () => {
        const hierarchy = manager.getClassHierarchy();

        // Vérifier que la racine est owl:Thing
        expect(hierarchy.uri).toContain('Thing');

        // Vérifier qu'il y a des classes
        expect(hierarchy.children.length).toBeGreaterThan(0);
    });

    test('Property hierarchy', () => {
        const hierarchy = manager.getPropertyHierarchy();

        // Vérification : la racine existe
        expect(hierarchy).toBeDefined();
        expect(hierarchy.uri).toBeDefined();
    });

    test('Full structure JSON', () => {
        const structure = manager.getStructure();

        expect(structure.classes.length).toBe(2);
        expect(structure.properties.length).toBe(1);
        expect(structure.classHierarchy).toBeDefined();
        expect(structure.propertyHierarchy).toBeDefined();
    });
});