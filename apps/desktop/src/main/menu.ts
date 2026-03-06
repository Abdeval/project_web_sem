import { Menu, BrowserWindow, app, shell, dialog } from 'electron';

export function createMenu(win: BrowserWindow): void {
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open RDF...',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(win, {
                            title: 'Open RDF File',
                            filters: [{ name: 'RDF Files', extensions: ['ttl', 'rdf', 'owl', 'nt', 'n3'] }],
                            properties: ['openFile'],
                        });
                        if (!result.canceled && result.filePaths[0]) {
                            win.webContents.send('menu:openFile', result.filePaths[0]);
                        }
                    },
                },
                { type: 'separator' },
                { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => win.webContents.send('menu:save') },
                { label: 'Export...', accelerator: 'CmdOrCtrl+E', click: () => win.webContents.send('menu:export') },
                { type: 'separator' },
                { label: 'Quit', accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4', click: () => app.quit() },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { label: 'Toggle Dark/Light Theme', accelerator: 'CmdOrCtrl+T', click: () => win.webContents.send('menu:toggleTheme') },
                { type: 'separator' },
                { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
                { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                { type: 'separator' },
                { label: 'Toggle DevTools', accelerator: 'F12', role: 'toggleDevTools' },
                { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
            ],
        },
        {
            label: 'Help',
            submenu: [
                { label: 'Documentation', click: () => shell.openExternal('https://github.com/Abdeval/project_web_sem') },
                { type: 'separator' },
                {
                    label: 'About',
                    click: () => dialog.showMessageBox(win, {
                        title: 'About',
                        message: 'Knowledge Graph Desktop',
                        detail: 'v1.0.0\nProjet Pratique — Web Sémantique',
                        buttons: ['OK'],
                    }),
                },
            ],
        },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}