# Getting Started

Guide de démarrage rapide pour le projet Knowledge Graph Desktop.

## 📋 Prérequis

### Logiciels requis

- **Node.js** 18.x ou supérieur ([télécharger](https://nodejs.org/))
- **npm** 9.x ou supérieur (inclus avec Node.js)
- **Git** ([télécharger](https://git-scm.com/))
- **VS Code** (recommandé) ([télécharger](https://code.visualstudio.com/))

### Vérifier l'installation

```bash
node --version  # doit afficher v18.x ou supérieur
npm --version   # doit afficher 9.x ou supérieur
git --version   # doit afficher 2.x ou supérieur
```

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd project
```

### 2. Installer les dépendances

```bash
npm install
```

Cette commande va :

- Installer toutes les dépendances du workspace racine
- Installer les dépendances de tous les packages (`core`, `rdf`, etc.)
- Créer les liens entre les packages (workspaces)

### 3. Compiler les packages

```bash
npm run build
```

Cela compile tous les packages TypeScript en JavaScript.

## 🧪 Tester l'installation

### Démos par module

1. **Core + RDF Demo**

   ```bash
   npm run demo:rdf
   ```

   Doit afficher :

   ```
   === RDF I/O & Statistics Demo ===
   1. Loading Turtle data...
      ✓ Loaded
   ...
   ```

2. **Ontology Demo**

   ```bash
   npm run demo:ontology
   ```

3. **SPARQL Demo**

   ```bash
   npm run demo:sparql
   ```

4. **Reasoning Demo**

   ```bash
   npm run demo:reasoning
   ```

5. **Embeddings Demo**

   ```bash
   npm run demo:embeddings
   ```

### Lancer l'application Electron

```bash
npm run dev
```

Une fenêtre Electron devrait s'ouvrir avec l'interface de l'application.

## 📂 Structure du projet

```
project/
├── packages/              # Modules du projet
│   ├── core/             # Types et interfaces partagés
│   ├── rdf/              # Gestion RDF
│   ├── ontology/         # Gestion ontologies
│   ├── sparql/           # Moteur SPARQL
│   ├── reasoning/        # Moteur de raisonnement
│   ├── embeddings/       # Embeddings KGE (TransE/TransH/TransR/DistMult/ComplEx)
│   └── visualization/    # Visualisation
├── apps/
│   └── desktop/          # Application Electron
├── assets/
│   └── samples/          # Fichiers RDF d'exemple
├── docs/
│   ├── members/          # Documentation par membre
│   ├── architecture.md   # Architecture du système
│   └── CONTRIBUTING.md   # Guide de contribution
├── package.json          # Configuration workspace
└── README.md             # Documentation principale
```

## 👥 Organisation de l'équipe

Voir [README.md](../README.md) pour le tableau de répartition des modules.

Chaque membre a un README dédié dans `docs/members/` :

- [01-core-reasoning.md](./members/01-core-reasoning.md) - Responsable
- [02-rdf-io-stats.md](./members/02-rdf-io-stats.md) - Membre A
- [03-ontology-management.md](./members/03-ontology-management.md) - Membre B
- [04-sparql-engine.md](./members/04-sparql-engine.md) - Membre C
- [05-visualization-ui.md](./members/05-visualization-ui.md) - Membre D
- [06-embeddings-kge.md](./members/06-embeddings-kge.md) - Module Embeddings

## 🔧 Développement

### Travailler sur un module

1. **Naviguer vers le package**

   ```bash
   cd packages/rdf  # par exemple
   ```

2. **Modifier le code**
   - Éditer les fichiers dans `src/`
   - Respecter les interfaces définies dans `@kg/core`

3. **Tester en local**

   ```bash
   npm run demo
   ```

4. **Compiler**
   ```bash
   npm run build
   ```

### Workflow Git

1. **Créer une branche**

   ```bash
   git checkout -b feature/rdf/turtle-parser
   ```

2. **Commit régulièrement**

   ```bash
   git add .
   git commit -m "feat(rdf): implement Turtle parser"
   ```

3. **Push vers remote**

   ```bash
   git push origin feature/rdf/turtle-parser
   ```

4. **Créer une Pull Request** sur GitHub

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour plus de détails.

## 📚 Documentation

### Documentation technique

- [Architecture](./architecture.md) - Vue d'ensemble du système
- [Contributing](./CONTRIBUTING.md) - Guide de contribution

### Spécifications RDF/OWL/SPARQL

- [RDF 1.1 Primer](https://www.w3.org/TR/rdf11-primer/)
- [OWL 2 Primer](https://www.w3.org/TR/owl2-primer/)
- [SPARQL 1.1 Query](https://www.w3.org/TR/sparql11-query/)

### Bibliothèques utilisées

- [rdflib.js](https://linkeddata.github.io/rdflib.js/doc/)
- [sparqljs](https://github.com/RubenVerborgh/SPARQL.js)
- [Cytoscape.js](https://js.cytoscape.org/)
- [Electron](https://www.electronjs.org/docs/latest)

## ❓ Problèmes courants

### `npm install` échoue

**Solution** : Supprimer `node_modules/` et `package-lock.json`, puis réessayer :

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur TypeScript `Cannot find module '@kg/core'`

**Solution** : Reconstruire les packages :

```bash
npm run build --workspaces
```

### Electron ne démarre pas

**Solution** : Vérifier que tous les packages sont compilés :

```bash
npm run build
cd apps/desktop
npm run dev
```

### Conflit Git

**Solution** : Toujours pull avant de push :

```bash
git pull origin main --rebase
git push
```

## 🎯 Prochaines étapes

1. **Lire votre documentation membre** dans `docs/members/`
2. **Explorer les samples** dans `assets/samples/`
3. **Tester les démos** de chaque module
4. **Commencer l'implémentation** de votre module

## 📞 Support

- **Issues GitHub** : pour signaler des bugs ou demander des features
- **Discussions GitHub** : pour poser des questions générales
- **Responsable** : [Nom] - [Email/Contact]

---

Bon développement ! 🚀
