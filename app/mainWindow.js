import path from 'path';
import * as electron from 'electron';
import * as remoteMain from '@electron/remote/main';
remoteMain.initialize();

let mainWindow;

export default function showMainWindow() {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  mainWindow = new electron.BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  remoteMain.enable(mainWindow.webContents);

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.webContents.on('context-menu', (event, params) => {
    const { Menu, MenuItem } = electron;
    const menu = new Menu();

    if (params.isEditable) {
      menu.append(new MenuItem({ role: 'undo' }));
      menu.append(new MenuItem({ role: 'redo' }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ role: 'cut' }));
    }

    if (params.isEditable || params.selectionText.trim().length > 0) {
      menu.append(new MenuItem({ role: 'copy' }));
    }

    if (params.isEditable) {
      menu.append(new MenuItem({ role: 'paste' }));
      menu.append(new MenuItem({ role: 'selectAll' }));
    }

    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({
      label: 'Inspect Element',
      click: () => {
        mainWindow.webContents.inspectElement(params.x, params.y);
      }
    }));

    menu.popup({ window: mainWindow, x: params.x, y: params.y });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;

    // need to quit the entire app (i.e., including
    // the HSD window) once the main window is closed
    // on Windows
    if (process.platform === 'win32') {
      electron.app.quit();
    }
  });
}

export function getMainWindow() {
  return mainWindow;
}

export function dispatchToMainWindow(reduxAction) {
  mainWindow.webContents.send('ipcToRedux', reduxAction);
}

export function sendDeeplinkToMainWindow(url) {
  mainWindow.webContents.send('deeplink', url);
}
