
export interface ElectronAPI {
    readUserData: () => Promise<{ cards: any[] }>;
    writeUserData: (data: { cards: any[] }) => Promise<{ success: boolean; error?: string }>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
