# @kg/rdf — Module RDF I/O & Statistics

> **Membre A** — Gestion des Graphes RDF  
> Projet Web Sémantique — Système de Gestion de Base de Connaissances

---

## Description

Ce module est responsable de toute la couche I/O RDF du système.  
Il permet de charger, exporter et calculer des statistiques sur des graphes RDF.  
Il sert de base aux modules SPARQL, Raisonnement et Visualisation.

---

## Formats supportés

| Format    | Extension             | Chargement | Export |
|-----------|-----------------------|:----------:|:------:|
| Turtle    | .ttl                  |     OK     |   OK   |
| RDF/XML   | .rdf  .owl  .xml      |     OK     |   OK   |
| N-Triples | .nt                   |     OK     |   OK   |

---

## Installation

Depuis le dossier packages/rdf :

    npm install --ignore-scripts

---

## Utilisation

### Charger un fichier RDF

    import { RDFManager } from './src';

    const manager = new RDFManager();

    // Chargement automatique selon l'extension
    await manager.loadFromFile('samples/pizza.ttl');

    // Chargement depuis une chaine de caracteres
    await manager.load(turtleString, 'turtle');
    await manager.load(rdfxmlString, 'rdfxml');
    await manager.load(ntriplesString, 'ntriples');

### Obtenir les statistiques

    const stats = manager.getStats();

    console.log(stats.totalTriples);      // Nombre total de triplets
    console.log(stats.uniqueSubjects);    // Sujets uniques
    console.log(stats.uniquePredicates);  // Predicats uniques
    console.log(stats.uniqueObjects);     // Objets uniques
    console.log(stats.literalCount);      // Nombre de litteraux
    console.log(stats.iriCount);          // Nombre d'IRIs
    console.log(stats.topPredicates);     // Top 10 predicats les plus frequents

### Exporter vers un autre format

    const turtle   = await manager.export('turtle');
    const rdfxml   = await manager.export('rdfxml');
    const ntriples = await manager.export('ntriples');

### Acceder aux triplets

    const triples = manager.getTriples();
    // Retourne un tableau de Triple :
    // { subject: string, predicate: string, object: string, isLiteral: boolean }

### Vider le store

    manager.clear();

---

## Lancer la demonstration

    npx ts-node demo/index.ts

Resultat attendu :

    === RDF I/O & Statistics Demo ===

    1. Loading Turtle file: samples/pizza.ttl
       OK Loaded in 25ms

    2. Graph Statistics:
       - Total triples:     31
       - Unique subjects:   11
       - Unique predicates: 4
       - Unique objects:    20
       - Literals:          11
       - IRIs:              20
       Top predicates:
         1. rdf:type (11 occurrences)
         2. rdfs:label (11 occurrences)
         3. pizza:hasTopping (8 occurrences)

    3. Exporting to RDF/XML...
       OK Exported in 79ms

    4. Re-importing exported RDF/XML...
       OK Loaded in 16ms

    5. Verifying round-trip...
       OK Graph structure preserved (31 triples)

    === Demo completed successfully ===

---

## Lancer les tests

    npx jest --testPathPattern=tests/rdf.test.ts --no-coverage

Resultats :

    Tests:  15 passed, 15 total

### Liste des tests

    Load
      - loads Turtle from string
      - loads Turtle from file
      - auto-detects .ttl extension
      - throws on malformed Turtle
      - throws on missing file
      - throws on unknown extension

    Statistics
      - counts total triples
      - counts unique subjects
      - counts unique predicates
      - counts literals vs IRIs
      - returns topPredicates sorted by frequency

    Export & Round-trip
      - Turtle round-trip preserves triple count
      - N-Triples round-trip preserves triple count
      - clear() resets the store
      - getTriples() returns a defensive copy

---

## Structure du module

    packages/rdf/
    src/
      types.ts                    Types partages (Triple, GraphStats, RDFFormat, IRDFStore)
      loaders/
        TurtleLoader.ts           Parseur Turtle (via N3.js)
        NTriplesLoader.ts         Parseur N-Triples (via N3.js)
        RDFXMLLoader.ts           Parseur RDF/XML (via rdflib)
      exporters/
        TurtleExporter.ts         Serialiseur Turtle (via N3.js)
        NTriplesExporter.ts       Serialiseur N-Triples (via N3.js)
        RDFXMLExporter.ts         Serialiseur RDF/XML (via rdflib)
      stats/
        GraphStatistics.ts        Calcul des statistiques du graphe
      RDFManager.ts               Classe principale (point d'entree)
      index.ts                    Exports publics
    demo/
      index.ts                    Script de demonstration
    tests/
      rdf.test.ts                 Tests unitaires (Jest)
    samples/
      pizza.ttl                   Ontologie Pizza (fichier de test)

---

## Interfaces fournies aux autres modules

Ce module exporte l'interface IRDFStore utilisee par :

- Module SPARQL (Membre C)  : getTriples() pour executer les requetes
- Module Reasoning           : getTriples() pour inferer de nouveaux triplets
- Module Visualization (Membre D) : getTriples() pour afficher le graphe

---

## Dependances

| Bibliotheque | Version  | Usage                        |
|--------------|----------|------------------------------|
| n3           | ^1.17.2  | Parseur/serialiseur Turtle et N-Triples |
| rdflib       | ^2.2.33  | Parseur/serialiseur RDF/XML  |
| typescript   | ^5.0.0   | Langage                      |
| ts-node      | ^10.9.1  | Execution TypeScript         |
| jest         | ^29.5.0  | Tests unitaires              |

---

## Garanties techniques

- Round-trip fiable : charger puis exporter donne un graphe isomorphe
- Gestion d'erreurs : fichier mal forme produit un message d'erreur clair
- Performance : 10 000 triplets charges en moins de 2 secondes
- Encodage : UTF-8 pour tous les fichiers
- Grands fichiers : avertissement automatique si plus de 1 000 000 triplets

---

## Auteur

Membre A — Module RDF I/O & Statistics  
Projet Web Semantique — Master Informatique
