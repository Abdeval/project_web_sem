# Architecture Overview

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Desktop Application                       │
│                      (Electron + React)                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Visualization│      │    SPARQL    │     │  Reasoning   │     │  Embeddings  │
│   Package    │      │   Package    │     │   Package    │     │   Package    │
└──────────────┘      └──────────────┘     └──────────────┘     └──────────────┘
  │                     │                     │                     │
  └─────────────────────┼─────────────────────┼─────────────────────┘
            ▼
          ┌──────────────┐
          │     Core     │
          │   Package    │
          └──────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│     RDF      │      │   Ontology   │     │   External   │
│   Package    │      │   Package    │     │  Libraries   │
│              │      │              │     │ (rdflib.js)  │
└──────────────┘      └──────────────┘     └──────────────┘
```

## Module Responsibilities

### Core Package (`@kg/core`)

- **Owner**: Responsable du projet
- **Purpose**: Shared types, interfaces, and base implementations
- **Key Components**:
  - TypeScript type definitions (RDF, OWL, SPARQL, Reasoning)
  - Interface contracts (IRDFStore, IOntologyStore, IQueryEngine, IReasoningEngine)
  - Base RDFStore implementation
  - Utility functions (namespaces, URI handling)

### RDF Package (`@kg/rdf`)

- **Owner**: Membre A
- **Purpose**: RDF data I/O and statistics
- **Key Components**:
  - RDF loaders (Turtle, RDF/XML, N-Triples)
  - RDF exporters
  - Graph statistics calculator
  - Auto-format detection

### Ontology Package (`@kg/ontology`)

- **Owner**: Membre B
- **Purpose**: OWL/RDFS ontology management
- **Key Components**:
  - Ontology loader (OWL, RDFS)
  - Class and property extractors
  - Hierarchy builders (classes, properties)
  - Structure serializer for UI

### SPARQL Package (`@kg/sparql`)

- **Owner**: Membre C
- **Purpose**: SPARQL query execution
- **Key Components**:
  - Query parser and validator
  - Query executors (SELECT, CONSTRUCT, ASK)
  - Result formatters
  - Query history manager
  - Result exporters (CSV, JSON, XML)

### Reasoning Package (`@kg/reasoning`)

- **Owner**: Responsable du projet
- **Purpose**: Semantic reasoning and inference
- **Key Components**:
  - RDFS reasoner
  - OWL RL reasoner
  - Configuration manager
  - Inference tracker
  - Consistency checker

### Embeddings Package (`@kg/embeddings`)

- **Owner**: Module dédié Embeddings
- **Purpose**: Knowledge Graph Embeddings training and algorithm comparison
- **Key Components**:
  - `KGEEngine` (train + compare)
  - Multi-model support (TransE, TransH, TransR, DistMult, ComplEx)
  - Deterministic training via `seed`
  - Lightweight 2D projection for UI comparison
  - Comparison metrics and recommended algorithm

### Visualization Package (`@kg/visualization`)

- **Owner**: Membre D
- **Purpose**: Graph visualization and UI components
- **Key Components**:
  - GraphMapper (RDF → Cytoscape)
  - React components (GraphView, panels)
  - Layout managers
  - Theme provider (dark/light)

## Data Flow

### Loading RDF Data

```
User → File Select → RDF Package → Core Store → Visualization
```

### Executing SPARQL Query

```
User → Query Editor → SPARQL Package → Core Store → Results Display
```

### Performing Reasoning

```
User → Enable Reasoning → Reasoning Package → Core Store →
  Inferred Triples → Visualization (highlighted)
```

### Training / Comparing Embeddings

```
User → Embeddings Config (algorithm, dimensions, epochs...) → Embeddings Package →
Core Store → Metrics + 2D Points → Visualization / Recommendation UI
```

## Technology Stack

### Desktop Framework

- **Electron**: Cross-platform desktop application
- **React**: UI components
- **TypeScript**: Type-safe development

### RDF/Semantic Web

- **rdflib.js**: RDF store and I/O
- **sparqljs**: SPARQL parsing
- **N3.js**: High-performance Turtle parsing

### Machine Learning (KGE)

- **Custom TS implementations**: TransE, TransH, TransR, DistMult, ComplEx
- **Seeded random utilities**: deterministic experiments for comparison

### Visualization

- **Cytoscape.js**: Graph rendering
- **Monaco Editor**: SPARQL editor with syntax highlighting

### Build & Development

- **npm workspaces**: Monorepo management
- **TypeScript**: Compilation
- **electron-builder**: Application packaging

## Design Principles

### 1. Module Independence

- Each module depends only on `@kg/core`
- No direct dependencies between student modules
- Integration happens through core interfaces

### 2. Type Safety

- Strict TypeScript configuration
- All public APIs are typed
- No `any` types in interfaces

### 3. Testability

- Each module has standalone demo
- Unit tests for core functionality
- Integration tests for complete workflows

### 4. Extensibility

- Plugin-like architecture
- New reasoners can be added
- Additional RDF formats can be supported

## Security Considerations

- No remote code execution
- File system access through Electron APIs
- Input validation for SPARQL queries
- Sanitization of RDF data before display

## Performance Targets

- Load 10,000 triples: < 2 seconds
- Execute simple SPARQL query: < 1 second
- RDFS reasoning on 10,000 triples: < 5 seconds
- Render graph with 1,000 nodes: < 3 seconds

## Future Enhancements

- SPARQL UPDATE support
- Remote SPARQL endpoint support
- RDF-star support
- Advanced OWL reasoning (DL)
- Collaborative editing
- Cloud synchronization
