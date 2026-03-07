// Document storage utilities with localStorage persistence

export interface DocumentVersion {
    id: string;
    content: string;
    savedAt: string;  // ISO string
    label?: string;
    starred?: boolean;
}

export interface ArokoDocument {
    id: string;
    title: string;
    content: string;
    folderId: string | null;
    createdAt: string;
    updatedAt: string;
    history: DocumentVersion[];
}

const DOCUMENTS_KEY = 'aroko_documents';
const CURRENT_DOC_KEY = 'aroko_current_doc';
const RECENT_KEY = 'aroko_recent';
const MAX_HISTORY = 50;
const MAX_RECENT = 10;

// Generate unique ID
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all documents
export function getAllDocuments(): ArokoDocument[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(DOCUMENTS_KEY);
    return data ? JSON.parse(data) : [];
}

// Save all documents
function saveAllDocuments(docs: ArokoDocument[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
}

// Get document by ID
export function getDocument(id: string): ArokoDocument | null {
    const docs = getAllDocuments();
    return docs.find(d => d.id === id) || null;
}

// Create new document
export function createDocument(title: string = 'Untitled Document', folderId: string | null = null): ArokoDocument {
    const now = new Date().toISOString();
    const doc: ArokoDocument = {
        id: generateId(),
        title,
        content: '',
        folderId,
        createdAt: now,
        updatedAt: now,
        history: []
    };

    const docs = getAllDocuments();
    docs.push(doc);
    saveAllDocuments(docs);
    setCurrentDocument(doc.id);
    addToRecent(doc.id);

    return doc;
}

// Update document content
export function updateDocument(id: string, content: string, saveHistory: boolean = false, historyLabel?: string): ArokoDocument | null {
    const docs = getAllDocuments();
    const index = docs.findIndex(d => d.id === id);

    if (index === -1) return null;

    const doc = docs[index];
    const now = new Date().toISOString();

    // Save history if requested
    if (saveHistory && doc.content !== content) {
        const version: DocumentVersion = {
            id: generateId(),
            content: doc.content,
            savedAt: now,
            label: historyLabel
        };
        doc.history.unshift(version);

        // Keep only non-starred versions within limit
        const starred = doc.history.filter(v => v.starred);
        const nonStarred = doc.history.filter(v => !v.starred).slice(0, MAX_HISTORY);
        doc.history = [...starred, ...nonStarred].sort(
            (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
    }

    doc.content = content;
    doc.updatedAt = now;
    docs[index] = doc;

    saveAllDocuments(docs);
    addToRecent(id);

    return doc;
}

// Rename document
export function renameDocument(id: string, title: string): ArokoDocument | null {
    const docs = getAllDocuments();
    const index = docs.findIndex(d => d.id === id);

    if (index === -1) return null;

    docs[index].title = title;
    docs[index].updatedAt = new Date().toISOString();
    saveAllDocuments(docs);

    return docs[index];
}

// Delete document
export function deleteDocument(id: string): boolean {
    const docs = getAllDocuments();
    const index = docs.findIndex(d => d.id === id);

    if (index === -1) return false;

    docs.splice(index, 1);
    saveAllDocuments(docs);

    // Remove from recent
    removeFromRecent(id);

    // If this was current, clear current
    if (getCurrentDocumentId() === id) {
        localStorage.removeItem(CURRENT_DOC_KEY);
    }

    return true;
}

// Move document to folder
export function moveDocumentToFolder(docId: string, folderId: string | null): boolean {
    const docs = getAllDocuments();
    const index = docs.findIndex(d => d.id === docId);

    if (index === -1) return false;

    docs[index].folderId = folderId;
    docs[index].updatedAt = new Date().toISOString();
    saveAllDocuments(docs);

    return true;
}

// Get documents in folder
export function getDocumentsInFolder(folderId: string | null): ArokoDocument[] {
    return getAllDocuments().filter(d => d.folderId === folderId);
}

// Current document management
export function getCurrentDocumentId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CURRENT_DOC_KEY);
}

export function setCurrentDocument(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CURRENT_DOC_KEY, id);
}

export function getCurrentDocument(): ArokoDocument | null {
    const id = getCurrentDocumentId();
    return id ? getDocument(id) : null;
}

// Recent documents
export function getRecentDocumentIds(): string[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(RECENT_KEY);
    return data ? JSON.parse(data) : [];
}

export function getRecentDocuments(): ArokoDocument[] {
    const ids = getRecentDocumentIds();
    const docs = getAllDocuments();
    return ids.map(id => docs.find(d => d.id === id)).filter(Boolean) as ArokoDocument[];
}

function addToRecent(id: string): void {
    if (typeof window === 'undefined') return;

    let recent = getRecentDocumentIds();
    recent = recent.filter(r => r !== id);
    recent.unshift(id);
    recent = recent.slice(0, MAX_RECENT);

    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

function removeFromRecent(id: string): void {
    if (typeof window === 'undefined') return;

    const recent = getRecentDocumentIds().filter(r => r !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

// History management
export function getDocumentHistory(docId: string): DocumentVersion[] {
    const doc = getDocument(docId);
    return doc?.history || [];
}

export function restoreVersion(docId: string, versionId: string): ArokoDocument | null {
    const doc = getDocument(docId);
    if (!doc) return null;

    const version = doc.history.find(v => v.id === versionId);
    if (!version) return null;

    // Save current as history before restoring
    return updateDocument(docId, version.content, true, 'Before restore');
}

export function toggleStarVersion(docId: string, versionId: string): boolean {
    const docs = getAllDocuments();
    const doc = docs.find(d => d.id === docId);
    if (!doc) return false;

    const version = doc.history.find(v => v.id === versionId);
    if (!version) return false;

    version.starred = !version.starred;
    saveAllDocuments(docs);

    return true;
}

export function deleteVersion(docId: string, versionId: string): boolean {
    const docs = getAllDocuments();
    const doc = docs.find(d => d.id === docId);
    if (!doc) return false;

    const index = doc.history.findIndex(v => v.id === versionId);
    if (index === -1) return false;

    doc.history.splice(index, 1);
    saveAllDocuments(docs);

    return true;
}
