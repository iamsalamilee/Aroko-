// University/School formatting templates

export interface UniversityTemplate {
    id: string;
    name: string;
    bodyText: {
        fontFamily: string;
        fontSize: number;
        lineSpacing: number;
    };
    titlePage: {
        fontFamily: string;
        fontSize: number;
        bold: boolean;
    };
    sectionHeading: {
        fontFamily: string;
        fontSize: number;
        bold: boolean;
    };
    margins?: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
}

// User's University Template (First Template!)
export const USER_UNIVERSITY: UniversityTemplate = {
    id: 'user-university',
    name: 'My University (Final Year)',
    bodyText: {
        fontFamily: 'Times New Roman',
        fontSize: 12,
        lineSpacing: 1.5,
    },
    titlePage: {
        fontFamily: 'Times New Roman',
        fontSize: 16,
        bold: true,
    },
    sectionHeading: {
        fontFamily: 'Times New Roman',
        fontSize: 14,
        bold: true,
    },
    margins: {
        top: 1,      // inches
        bottom: 1,
        left: 1.5,   // wider for binding
        right: 1,
    },
};

// List of all templates
export const TEMPLATES: UniversityTemplate[] = [
    USER_UNIVERSITY,
];

// Helper to get template by ID
export function getTemplateById(id: string): UniversityTemplate | undefined {
    return TEMPLATES.find(t => t.id === id);
}
