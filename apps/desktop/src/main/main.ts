/**
 * Electron Main Process
 */

import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { createMenu } from './menu';

const isDev = process.env.NODE_ENV === 'development';
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
    const iconPath = isDev
        ? path.join(__dirname, '../../../../assets/logo.png')
        : path.join(process.resourcesPath, 'logo.png');

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: 'Knowledge Graph Desktop',
        icon: iconPath,
        backgroundColor: '#f6f8fa',
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        show: false,
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5174');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.once('ready-to-show', () => mainWindow?.show());
    mainWindow.on('closed', () => { mainWindow = null; });

    // ✅ Menu natif Electron (File/Edit/View/Help)
    createMenu(mainWindow);
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('dialog:openFile', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Open RDF File',
        filters: [{ name: 'RDF Files', extensions: ['ttl', 'rdf', 'owl', 'nt', 'n3', 'xml'] }],
        properties: ['openFile'],
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (_event, defaultName: string) => {
    if (!mainWindow) return null;
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export RDF',
        defaultPath: defaultName,
        filters: [
            { name: 'Turtle', extensions: ['ttl'] },
            { name: 'RDF/XML', extensions: ['rdf'] },
            { name: 'N-Triples', extensions: ['nt'] },
        ],
    });
    return result.canceled ? null : result.filePath;
});

ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
});

ipcMain.handle('file:read', async (_event, filePath: string) => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return { success: true, content };
    } catch (e) {
        return { success: false, error: String(e) };
    }
});

// ── Graph snapshot persistence ──────────────────────────────────────────────
// Stores the last loaded graph as Turtle in the Electron userData folder so it
// survives page refreshes and application restarts.
const SNAPSHOT_TTL = 'kg-last-graph.ttl';
const SNAPSHOT_META = 'kg-last-graph-meta.json';

interface GraphMeta {
    sourceName: string;
    format: string;
    savedAt: string;
    tripleCount: number;
}

ipcMain.handle('graph:saveSnapshot', async (
    _event,
    turtleContent: string,
    meta: GraphMeta
) => {
    try {
        const dir = app.getPath('userData');
        fs.writeFileSync(path.join(dir, SNAPSHOT_TTL), turtleContent, 'utf-8');
        fs.writeFileSync(path.join(dir, SNAPSHOT_META), JSON.stringify(meta), 'utf-8');
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
});

ipcMain.handle('graph:loadSnapshot', async () => {
    try {
        const dir = app.getPath('userData');
        const ttl = path.join(dir, SNAPSHOT_TTL);
        const meta = path.join(dir, SNAPSHOT_META);
        if (!fs.existsSync(ttl) || !fs.existsSync(meta)) {
            return { success: false, reason: 'no-snapshot' };
        }
        const content = fs.readFileSync(ttl, 'utf-8');
        const metadata = JSON.parse(fs.readFileSync(meta, 'utf-8')) as GraphMeta;
        return { success: true, content, metadata };
    } catch (e) {
        return { success: false, error: String(e) };
    }
});

ipcMain.handle('graph:clearSnapshot', async () => {
    try {
        const dir = app.getPath('userData');
        const ttl = path.join(dir, SNAPSHOT_TTL);
        const meta = path.join(dir, SNAPSHOT_META);
        if (fs.existsSync(ttl)) fs.unlinkSync(ttl);
        if (fs.existsSync(meta)) fs.unlinkSync(meta);
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
});