"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const path_1 = require("path");
// import tailwindcss from '@tailwindcss/vite'
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    root: (0, path_1.resolve)(__dirname, 'src/renderer'),
    base: './',
    build: {
        outDir: (0, path_1.resolve)(__dirname, 'dist/renderer'),
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        strictPort: true,
    },
    resolve: {
        alias: {
            '@kg/visualization': (0, path_1.resolve)(__dirname, '../../packages/visualization/src'),
            '@kg/core': (0, path_1.resolve)(__dirname, '../../packages/core/src'),
        },
    },
    optimizeDeps: {
        include: ['cytoscape'],
    },
});
//# sourceMappingURL=vite.config.js.map