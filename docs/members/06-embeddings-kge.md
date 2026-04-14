# Module: Embeddings (KGE)

**Moteur d'Embeddings pour Graphes de Connaissances**  
**Documentation officielle du module `@kg/embeddings`**

---

## Objectif

Le module embeddings entraîne des représentations vectorielles des entités et relations RDF
pour comparer des algorithmes KGE dans le cadre du projet.

Algorithmes supportés (MVP):

- TransE
- TransH
- TransR
- DistMult
- ComplEx

---

## Responsabilités du module

1. Exposer un moteur unique `KGEEngine` conforme à l'interface `IEmbeddingEngine`.
2. Entraîner un modèle sur un `IRDFStore` avec une configuration contrôlée.
3. Comparer deux configurations d'entraînement et recommander l'algorithme le plus pertinent.
4. Produire des métriques comparables entre runs.
5. Générer une projection 2D légère pour visualisation côté UI.

---

## API publique

### Export principal

```ts
import { KGEEngine } from '@kg/embeddings';
```

### Méthodes disponibles

- `configure(config: Partial<EmbeddingTrainingConfig>): void`
- `getConfig(): Partial<EmbeddingTrainingConfig>`
- `getSupportedAlgorithms(): EmbeddingAlgorithm[]`
- `train(store: IRDFStore, config: EmbeddingTrainingConfig): Promise<EmbeddingTrainingResult>`
- `compare(store: IRDFStore, configA: EmbeddingTrainingConfig, configB: EmbeddingTrainingConfig): Promise<EmbeddingComparisonResult>`

### Configuration d'entraînement

```ts
type EmbeddingTrainingConfig = {
  algorithm: 'TransE' | 'TransH' | 'TransR' | 'DistMult' | 'ComplEx';
  dimensions: number;
  epochs: number;
  learningRate: number;
  margin?: number;
  negativeSamples?: number;
  seed?: number;
  includeLiterals?: boolean;
};
```

### Valeurs par défaut (si non précisées)

- `dimensions`: 32
- `epochs`: 40
- `learningRate`: 0.01
- `margin`: 1
- `negativeSamples`: 1
- `seed`: 42
- `includeLiterals`: false

---

## Exemple d'utilisation

```ts
import { RDFStore } from '@kg/core';
import { KGEEngine } from '@kg/embeddings';

async function run() {
  const store = new RDFStore();
  await store.load(
    `
@prefix : <http://example.org/> .
@prefix rel: <http://example.org/rel/> .

:A rel:knows :B .
:B rel:knows :C .
:C rel:knows :A .
`,
    'turtle'
  );

  const engine = new KGEEngine();

  const result = await engine.train(store, {
    algorithm: 'TransE',
    dimensions: 16,
    epochs: 10,
    learningRate: 0.02,
    seed: 42,
  });

  console.log(result.model.algorithm);
  console.log(result.finalLoss);
}
```

---

## Démo et tests

Depuis la racine du projet:

```bash
npm run demo:embeddings
```

Dans le package:

```bash
cd packages/embeddings
npm run test
```

---

## Critères d'acceptation

- `getSupportedAlgorithms()` retourne exactement `['TransE', 'TransH', 'TransR', 'DistMult', 'ComplEx']`.
- `train(...)` retourne un modèle non vide avec embeddings entités/relations cohérents.
- `compare(...)` retourne `runA`, `runB`, les métriques associées et un champ `recommended`.
- Une projection 2D est disponible via `points2D` pour chaque run de comparaison.
- Les entraînements sont reproductibles avec un `seed` identique.

---

## Limites actuelles

- Module orienté MVP pédagogique, pas benchmark SOTA.
- Pas de persistance native du modèle entraîné (save/load) dans ce package.
- Le moteur ne fait pas de link prediction avancée en sortie utilisateur (seulement structures et métriques de comparaison).

---

## Intégration recommandée

1. Charger un graphe RDF via `@kg/core` / `@kg/rdf`.
2. Exécuter `train` pour un algorithme unique, ou `compare` pour deux algorithmes.
3. Afficher `metrics` et `points2D` dans l'interface desktop.
4. Utiliser `recommended` comme aide à la décision, pas comme vérité absolue.
