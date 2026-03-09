import { OntologyManager } from '../src/OntologyManager';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    console.log('=== 🎯 Ontology Management Demo ===\n');

    const manager = new OntologyManager();

    // Chemin vers votre fichier OWL
    const owlPath = path.join(__dirname, '../ontologies/myOntology.owl');
    
    if (!fs.existsSync(owlPath)) {
        console.error(`❌ Fichier non trouvé: ${owlPath}`);
        console.log('\n💡 Veuillez placer votre fichier OWL dans le dossier ontologies/');
        console.log('   ou utilisez le fichier de test fourni.\n');
        return;
    }

    try {
        // 1. Charger l'ontologie
        console.log(`📂 Chargement: ${owlPath}\n`);
        const owlContent = fs.readFileSync(owlPath, 'utf-8');
        
        console.log('📄 Preview du fichier OWL (200 premiers caractères):');
        console.log(owlContent.substring(0, 200));
        console.log('...\n');

        const startTime = Date.now();
        await manager.loadOntology(owlContent, 'owl');
        const loadTime = Date.now() - startTime;
        
        console.log(`✅ Ontologie chargée avec succès`);
        console.log(`⏱️  Temps de chargement: ${loadTime}ms\n`);

        // 2. Statistiques
        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 STATISTIQUES');
        console.log('═══════════════════════════════════════════════════════');
        
        const classes = manager.getClasses();
        const properties = manager.getProperties();
        
        console.log(`Classes:      ${classes.length}`);
        console.log(`Propriétés:   ${properties.length}\n`);

        // 3. Afficher quelques classes
        console.log('═══════════════════════════════════════════════════════');
        console.log('📚 CLASSES (10 premières)');
        console.log('═══════════════════════════════════════════════════════');
        
        classes.slice(0, 10).forEach(c => {
            console.log(`\n  🔷 ${c.label || c.uri}`);
            if (c.comment) {
                console.log(`     💬 ${c.comment}`);
            }
            if (c.subClassOf.length > 0) {
                console.log(`     ⬆️  Parent(s): ${c.subClassOf.map(uri => {
                    const parent = classes.find(cl => cl.uri === uri);
                    return parent?.label || uri.split('#').pop();
                }).join(', ')}`);
            }
        });

        if (classes.length > 10) {
            console.log(`\n  ... et ${classes.length - 10} autres classes`);
        }

        // 4. Afficher quelques propriétés
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('🔗 PROPRIÉTÉS (5 premières)');
        console.log('═══════════════════════════════════════════════════════');
        
        properties.slice(0, 5).forEach(p => {
            console.log(`\n  🔸 ${p.label || p.uri} (${p.type})`);
            if (p.domain.length > 0) {
                console.log(`     📥 Domain: ${p.domain.map(d => d.split('#').pop()).join(', ')}`);
            }
            if (p.range.length > 0) {
                console.log(`     📤 Range: ${p.range.map(r => r.split('#').pop()).join(', ')}`);
            }
        });

        // 5. Hiérarchie de classes
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('🌳 HIÉRARCHIE DE CLASSES');
        console.log('═══════════════════════════════════════════════════════\n');
        
        const hierarchy = manager.getClassHierarchy();
        
        const displayHierarchy = (node: any, indent = 0) => {
            const prefix = '  '.repeat(indent);
            const icon = node.children && node.children.length > 0 ? '📁' : '📄';
            console.log(`${prefix}${icon} ${node.label || node.uri.split('#').pop()}`);
            
            if (node.children) {
                node.children.forEach((child: any) => displayHierarchy(child, indent + 1));
            }
        };

        displayHierarchy(hierarchy);

        // 6. Structure complète (optionnel)
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📋 STRUCTURE JSON (enregistrée dans structure.json)');
        console.log('═══════════════════════════════════════════════════════');
        
        const structure = manager.getStructure();
        fs.writeFileSync(
            path.join(__dirname, '../structure.json'),
            JSON.stringify(structure, null, 2)
        );
        console.log('✅ Structure exportée vers structure.json\n');

        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ Démo terminée avec succès !');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ ERREUR PENDANT LA DÉMO\n');
        console.error('Erreur:', error);
        
        if (error instanceof Error) {
            console.error('\nMessage:', error.message);
            console.error('\nStack:', error.stack);
        }
        
        console.log('\n💡 Suggestions:');
        console.log('  1. Vérifiez que le fichier OWL est valide');
        console.log('  2. Assurez-vous que tous les namespaces sont déclarés');
        console.log('  3. Testez avec university.owl fourni dans les exemples');
        
        process.exit(1);
    }
}

main();