import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    readUserData: () => ipcRenderer.invoke('read-user-data'),
    writeUserData: (data: any) => ipcRenderer.invoke('write-user-data', data),
});
