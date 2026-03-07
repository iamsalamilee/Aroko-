'use client';

import { useState } from 'react';
import { Loader2, BookOpen, Sparkles, ChevronRight, Check, AlertCircle, FileText } from 'lucide-react';
import { DOCUMENT_TEMPLATES, DocumentTemplate, getTemplateWordCount, getTemplateSectionCount } from '@/lib/templates/document-templates';
import {
    generateOutlineAction,
    generateSectionAction,
    DocumentOutline,
    GeneratedSection,
    OutlineSection
} from '@/lib/ai/generate-document';
import { compileDocument, compileOutlineOnly } from '@/lib/utils/document-compiler';
import { getKnowledgeSources, getContextFromSources } from '@/lib/storage/knowledge-store';

interface DocumentGeneratorProps {
    editor: any;
    onClose?: () => void;
}

type Step = 'config' | 'outline' | 'generating' | 'done';

export default function DocumentGenerator({ editor, onClose }: DocumentGeneratorProps) {
    const [step, setStep] = useState<Step>('config');
    const [topic, setTopic] = useState('');
    const [templateId, setTemplateId] = useState('seminar-report');
    const [academicLevel, setAcademicLevel] = useState('undergraduate');
    const [outline, setOutline] = useState<DocumentOutline | null>(null);
    const [generatedSections, setGeneratedSections] = useState<GeneratedSection[]>([]);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const selectedTemplate = DOCUMENT_TEMPLATES[templateId];

    // Step 1: Generate Outline
    const handleGenerateOutline = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await generateOutlineAction(topic, selectedTemplate);

        if (result.success && result.outline) {
            setOutline(result.outline);
            // Initialize generated sections with pending status
            setGeneratedSections(result.outline.sections.map(s => ({
                ...s,
                content: '',
                status: 'pending'
            })));
            setStep('outline');
        } else {
            setError(result.error || 'Failed to generate outline');
        }

        setIsLoading(false);
    };

    // Step 2: Generate all sections progressively
    const handleStartGeneration = async () => {
        setStep('generating');
        setCurrentSectionIndex(0);

        // IMMEDIATELY insert outline into editor
        if (editor) {
            const outlineHtml = compileOutlineOnly(topic, generatedSections);
            editor.chain().focus().insertContent(outlineHtml).run();
        }

        const previousSections: { title: string; summary: string }[] = [];

        // Helper function to add delay
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < generatedSections.length; i++) {
            setCurrentSectionIndex(i);

            // Update section status to generating
            setGeneratedSections(prev => prev.map((s, idx) =>
                idx === i ? { ...s, status: 'generating' } : s
            ));

            const section = generatedSections[i];

            // Get knowledge base context for this section
            const sources = getKnowledgeSources();
            const knowledgeContext = sources.length > 0
                ? getContextFromSources(sources, `${topic} ${section.title}`, 4000)
                : '';

            const result = await generateSectionAction(
                topic,
                section,
                previousSections,
                academicLevel,
                knowledgeContext
            );

            if (result.success && result.content) {
                // Update section with content in state
                setGeneratedSections(prev => prev.map((s, idx) =>
                    idx === i ? { ...s, content: result.content!, status: 'done' } : s
                ));

                // Update in editor - find placeholder and replace with content
                if (editor) {
                    const editorHtml = editor.getHTML();
                    // Simple text replacement - look for the unique marker
                    const placeholder = `[GENERATING_${section.id}]`;
                    if (editorHtml.includes(placeholder)) {
                        // Replace the placeholder paragraph with actual content
                        const newHtml = editorHtml.replace(
                            new RegExp(`<p><em>\\[GENERATING_${section.id}\\]</em></p>`, 'g'),
                            result.content!
                        );
                        editor.commands.setContent(newHtml);
                    }
                }

                // Add to context for next section
                previousSections.push({
                    title: section.title,
                    summary: result.summary || ''
                });
            } else {
                // Mark as error
                setGeneratedSections(prev => prev.map((s, idx) =>
                    idx === i ? { ...s, status: 'error' } : s
                ));
            }

            // Wait 7 seconds before next section to avoid rate limits
            if (i < generatedSections.length - 1) {
                await delay(7000);
            }
        }

        setStep('done');
    };

    // Step 3: Insert into editor
    const handleInsertDocument = () => {
        const html = compileDocument(topic, generatedSections);
        editor.chain().focus().insertContent(html).run();
        onClose?.();
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-teal-600 p-4 text-white">
                <div className="flex items-center gap-2">
                    <BookOpen size={20} />
                    <h3 className="font-semibold">Document Generator</h3>
                </div>
                <div className="flex gap-2 mt-2 text-xs">
                    <span className={`px-2 py-0.5 rounded ${step === 'config' ? 'bg-white/30' : 'bg-white/10'}`}>1. Configure</span>
                    <span className={`px-2 py-0.5 rounded ${step === 'outline' ? 'bg-white/30' : 'bg-white/10'}`}>2. Review Outline</span>
                    <span className={`px-2 py-0.5 rounded ${step === 'generating' || step === 'done' ? 'bg-white/30' : 'bg-white/10'}`}>3. Generate</span>
                </div>
            </div>

            <div className="p-4">
                {/* Step 1: Configuration */}
                {step === 'config' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Topic / Title</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Design of a Health Monitoring System"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-black focus:ring-2 focus:ring-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Document Template</label>
                            <select
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-black bg-white"
                            >
                                {Object.values(DOCUMENT_TEMPLATES).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">{selectedTemplate.description}</p>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Academic Level</label>
                            <select
                                value={academicLevel}
                                onChange={(e) => setAcademicLevel(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-black bg-white"
                            >
                                <option value="high_school">High School</option>
                                <option value="undergraduate">Undergraduate</option>
                                <option value="graduate">Graduate</option>
                                <option value="phd">PhD / Research</option>
                            </select>
                        </div>

                        <div className="bg-teal-50 rounded-lg p-3 text-sm">
                            <div className="flex justify-between text-teal-800">
                                <span>Chapters: {selectedTemplate.chapters.length}</span>
                                <span>Sections: {getTemplateSectionCount(selectedTemplate)}</span>
                                <span>~{Math.ceil(getTemplateWordCount(selectedTemplate) / 250)} pages</span>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button
                            onClick={handleGenerateOutline}
                            disabled={isLoading}
                            className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-teal-700 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ChevronRight size={18} />}
                            Generate Outline
                        </button>
                    </div>
                )}

                {/* Step 2: Outline Preview */}
                {step === 'outline' && outline && (
                    <div className="space-y-4">
                        <div className="text-sm text-gray-500">Review the structure below, then click Generate to create content.</div>

                        <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                            {outline.template.chapters.map(chapter => (
                                <div key={chapter.id} className="mb-3">
                                    <div className="font-semibold text-gray-800 text-sm">
                                        Chapter {chapter.number}: {chapter.title}
                                    </div>
                                    {chapter.sections.map(section => (
                                        <div key={section.id} className="ml-4 text-sm text-gray-600 flex justify-between">
                                            <span>{section.number} {section.title}</span>
                                            <span className="text-gray-400">~{section.wordCount}w</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                            <strong>Total:</strong> ~{outline.totalWords} words ({outline.estimatedPages} pages)
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setStep('config')}
                                className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleStartGeneration}
                                className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-teal-700"
                            >
                                <Sparkles size={18} />
                                Generate Content
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Generating */}
                {(step === 'generating' || step === 'done') && (
                    <div className="space-y-4">
                        <div className="text-sm text-gray-500">
                            {step === 'generating'
                                ? `Generating... (${currentSectionIndex + 1}/${generatedSections.length})`
                                : 'Generation complete!'
                            }
                        </div>

                        <div className="max-h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50 space-y-1">
                            {generatedSections.map((section, idx) => (
                                <div key={section.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded">
                                    {section.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                                    {section.status === 'generating' && <Loader2 size={16} className="animate-spin text-blue-600" />}
                                    {section.status === 'done' && <Check size={16} className="text-green-600" />}
                                    {section.status === 'error' && <AlertCircle size={16} className="text-red-600" />}
                                    <span className={section.status === 'done' ? 'text-gray-800' : 'text-gray-500'}>
                                        {section.number} {section.title}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {step === 'done' && (
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-700"
                            >
                                <Check size={18} />
                                Done - Document Added to Editor
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
