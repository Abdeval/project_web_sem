// packages/ontology/src/OntologyManager.ts
import { OWLLoader } from './loaders/OWLLoader';
import { RDFSLoader } from './loaders/RDFSLoader';
import { ClassExtractor } from './extractors/ClassExtractor';
import { PropertyExtractor } from './extractors/PropertyExtractor';
import { ClassHierarchy } from './hierarchy/ClassHierarchy';
import { PropertyHierarchy } from './hierarchy/PropertyHierarchy';
import { Store } from 'rdflib';
import { IOntologyStore, ClassNode, PropertyNode, OntologyStructure } from '@kg/core';

export class OntologyManager implements IOntologyStore {
  private store!: Store;
  private classes: ClassNode[] = [];
  private properties: PropertyNode[] = [];

  async loadOntology(data: string, format: 'owl' | 'rdfs'): Promise<void> {
    const loader = format === 'owl' ? new OWLLoader() : new RDFSLoader();
    this.store = await loader.load(data);

    this.classes = new ClassExtractor().extractClasses(this.store);
    this.properties = new PropertyExtractor().extractProperties(this.store);
  }

  getClasses(): ClassNode[] { return this.classes; }
  getProperties(): PropertyNode[] { return this.properties; }
  getClassHierarchy(): ClassNode { return new ClassHierarchy(this.classes).buildHierarchy(); }
  getPropertyHierarchy(): PropertyNode { return new PropertyHierarchy(this.properties).buildHierarchy(); }
  getStructure(): OntologyStructure {
    return {
      imports: [],
      classes: this.classes,
      properties: this.properties,
      classHierarchy: this.getClassHierarchy(),
      propertyHierarchy: this.getPropertyHierarchy()
    };
  }
  findClass(uri: string): ClassNode | undefined { return this.classes.find(c => c.uri === uri); }
  findProperty(uri: string): PropertyNode | undefined { return this.properties.find(p => p.uri === uri); }
}