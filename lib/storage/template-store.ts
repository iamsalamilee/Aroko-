// Custom template storage
// Saves and loads user-defined formatting templates from localStorage

export interface CustomTemplate {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    bodyText: {
        fontFamily: string;
        fontSize: number;
        lineSpacing: number;
    };
    sectionHeading: {
        fontFamily: string;
        fontSize: number;
        bold: boolean;
    };
    chapterTitle: {
        fontFamily: string;
        fontSize: number;
        bold: boolean;
        centered: boolean;
    };
    margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
}

const STORAGE_KEY = 'aroko-user-templates';

// Default template that comes pre-installed
export const DEFAULT_TEMPLATE: CustomTemplate = {
    id: 'default',
    name: 'Standard Academic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bodyText: {
        fontFamily: 'Times New Roman',
        fontSize: 12,
        lineSpacing: 1.5,
    },
    sectionHeading: {
        fontFamily: 'Times New Roman',
        fontSize: 14,
        bold: true,
    },
    chapterTitle: {
        fontFamily: 'Times New Roman',
        fontSize: 16,
        bold: true,
        centered: true,
    },
    margins: {
        top: 1,
        bottom: 1,
        left: 1.5,
        right: 1,
    },
};

// Get all templates
export function getTemplates(): CustomTemplate[] {
    if (typeof window === 'undefined') return [DEFAULT_TEMPLATE];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        // Initialize with default
        saveTemplates([DEFAULT_TEMPLATE]);
        return [DEFAULT_TEMPLATE];
    }

    try {
        const templates = JSON.parse(stored);
        // Ensure default template is always present
        if (!templates.find((t: CustomTemplate) => t.id === 'default')) {
            templates.unshift(DEFAULT_TEMPLATE);
        }
        return templates;
    } catch {
        return [DEFAULT_TEMPLATE];
    }
}

// Save all templates
export function saveTemplates(templates: CustomTemplate[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

// Get a single template by ID
export function getTemplateById(id: string): CustomTemplate | undefined {
    const templates = getTemplates();
    return templates.find(t => t.id === id);
}

// Save or update a template
export function saveTemplate(template: CustomTemplate): void {
    const templates = getTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);

    if (existingIndex >= 0) {
        templates[existingIndex] = {
            ...template,
            updatedAt: new Date().toISOString(),
        };
    } else {
        templates.push({
            ...template,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    saveTemplates(templates);
}

// Delete a template (can't delete default)
export function deleteTemplate(id: string): boolean {
    if (id === 'default') return false;

    const templates = getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    saveTemplates(filtered);
    return true;
}

// Create a new blank template
export function createNewTemplate(name: string): CustomTemplate {
    return {
        id: `template-${Date.now()}`,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bodyText: {
            fontFamily: 'Times New Roman',
            fontSize: 12,
            lineSpacing: 1.5,
        },
        sectionHeading: {
            fontFamily: 'Times New Roman',
            fontSize: 14,
            bold: true,
        },
        chapterTitle: {
            fontFamily: 'Times New Roman',
            fontSize: 16,
            bold: true,
            centered: true,
        },
        margins: {
            top: 1,
            bottom: 1,
            left: 1.5,
            right: 1,
        },
    };
}

// Get the currently selected template ID
export function getSelectedTemplateId(): string {
    if (typeof window === 'undefined') return 'default';
    return localStorage.getItem('aroko-selected-template') || 'default';
}

// Set the currently selected template
export function setSelectedTemplateId(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('aroko-selected-template', id);
}

// Get the currently selected template
export function getSelectedTemplate(): CustomTemplate {
    const id = getSelectedTemplateId();
    return getTemplateById(id) || DEFAULT_TEMPLATE;
}
