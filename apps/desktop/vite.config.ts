import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
// import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react()],
    root: resolve(__dirname, 'src/renderer'),
    base: './',
    build: {
        outDir: resolve(__dirname, 'dist/renderer'),
        emptyOutDir: true,
    },
    server: {
        port: 5174,
        strictPort: true,
    },
    resolve: {
        alias: {
            '@kg/visualization': resolve(__dirname, '../../packages/visualization/src'),
            '@kg/core': resolve(__dirname, '../../packages/core/src'),
            '@kg/rdf': resolve(__dirname, '../../packages/rdf/src'),
            '@kg/sparql': resolve(__dirname, '../../packages/sparql/src'),
            '@kg/ontology': resolve(__dirname, '../../packages/ontology/src'),
            '@kg/reasoning': resolve(__dirname, '../../packages/reasoning/src'),
            '@assets': resolve(__dirname, '../../assets'),
        },
    },
    optimizeDeps: {
        include: ['cytoscape'],
    },
});