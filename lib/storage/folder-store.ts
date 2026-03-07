// Folder storage utilities with localStorage persistence

export interface Folder {
    id: string;
    name: string;
    createdAt: string;
    color?: string; // Optional color for visual distinction
}

const FOLDERS_KEY = 'aroko_folders';

// Generate unique ID
function generateId(): string {
    return `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all folders
export function getAllFolders(): Folder[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(FOLDERS_KEY);
    return data ? JSON.parse(data) : [];
}

// Save all folders
function saveAllFolders(folders: Folder[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

// Get folder by ID
export function getFolder(id: string): Folder | null {
    const folders = getAllFolders();
    return folders.find(f => f.id === id) || null;
}

// Create new folder
export function createFolder(name: string, color?: string): Folder {
    const folder: Folder = {
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
        color
    };

    const folders = getAllFolders();
    folders.push(folder);
    saveAllFolders(folders);

    return folder;
}

// Rename folder
export function renameFolder(id: string, name: string): Folder | null {
    const folders = getAllFolders();
    const index = folders.findIndex(f => f.id === id);

    if (index === -1) return null;

    folders[index].name = name;
    saveAllFolders(folders);

    return folders[index];
}

// Update folder color
export function updateFolderColor(id: string, color: string): Folder | null {
    const folders = getAllFolders();
    const index = folders.findIndex(f => f.id === id);

    if (index === -1) return null;

    folders[index].color = color;
    saveAllFolders(folders);

    return folders[index];
}

// Delete folder
export function deleteFolder(id: string): boolean {
    const folders = getAllFolders();
    const index = folders.findIndex(f => f.id === id);

    if (index === -1) return false;

    folders.splice(index, 1);
    saveAllFolders(folders);

    // Note: Documents in this folder should be moved to "no folder" (null)
    // This is handled by the caller

    return true;
}

// Default folder colors for picker
export const FOLDER_COLORS = [
    '#EF4444', // red
    '#F97316', // orange
    '#EAB308', // yellow
    '#22C55E', // green
    '#14B8A6', // teal
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#6B7280', // gray
];
