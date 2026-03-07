'use client';

import { useState } from 'react';
import { generateDocumentAction } from '@/lib/ai/actions';
import { Loader2, Sparkles, Send } from 'lucide-react';

interface AgentCommandBarProps {
    onDataReceived: (data: any) => void;
}

export default function AgentCommandBar({ onDataReceived }: AgentCommandBarProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setIsLoading(true);

        // Call the Server Action
        const result = await generateDocumentAction(input);

        if (result.success) {
            onDataReceived(result.data); // Send JSON up to parent
        } else {
            alert("AI Error: " + result.error);
        }

        setIsLoading(false);
        setInput('');
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative flex items-center bg-white/90 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl p-2 pl-4">
                    <Sparkles className="w-5 h-5 text-blue-500 mr-3 animate-pulse" />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask AROKO (e.g., 'Write an essay on AI with 1.5 spacing')..."
                        className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 font-medium"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="ml-2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
