import { contextBridge, ipcRenderer } from 'electron';

interface GraphSnapshotMeta {
    sourceName: string;
    format: string;
    savedAt: string;
    tripleCount: number;
}

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    saveFile: (name: string) => ipcRenderer.invoke('dialog:saveFile', name),
    readFile: (path: string) => ipcRenderer.invoke('file:read', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('file:write', path, content),
    onOpenFile: (cb: (path: string) => void) => ipcRenderer.on('menu:openFile', (_e, p) => cb(p)),
    onSave: (cb: () => void) => ipcRenderer.on('menu:save', cb),
    onExport: (cb: () => void) => ipcRenderer.on('menu:export', cb),
    onToggleTheme: (cb: () => void) => ipcRenderer.on('menu:toggleTheme', cb),
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
    // Graph snapshot persistence
    saveSnapshot: (turtleContent: string, meta: GraphSnapshotMeta) =>
        ipcRenderer.invoke('graph:saveSnapshot', turtleContent, meta),
    loadSnapshot: () => ipcRenderer.invoke('graph:loadSnapshot'),
    clearSnapshot: () => ipcRenderer.invoke('graph:clearSnapshot'),
});