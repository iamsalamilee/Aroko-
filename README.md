# AROKO: AI-Powered Academic Editor 🎓

AROKO is an intelligent, context-aware document editor built specifically to solve the biggest pain points for university students and academic researchers. It features integrated AI writing assistance that acts as a pair-programmer for your thesis, paper, or assignment.

## 🏆 Hackathon Project

This project was built to showcase the power of Agentic AI workflows in text editing. Rather than just slapping a generic chat window next to a text box, AROKO deeply integrates the AI into the editing process itself to create a tailored workspace for academics.

## ✨ Key Features & Technical Highlights

Unlike standard AI wrappers that frequently hallucinate academic sources or force you to copy/paste endlessly, AROKO is built as a complete academic workspace:

1. **Context-Aware Research Chat**: A dedicated AI assistant in the right panel that remembers your conversation history across the session. It acts as a research mentor to help you outline, brainstorm, and refine ideas without ever hallucinating.
2. **Contextual Highlight-to-Edit**: Select any block of text in your document and press `Ctrl+Q` (or use the AI tools in the sidebar). The AI reads the surrounding text to understand exactly where you are in your paper, providing highly relevant and contextually accurate rewrites or expansions.
3. **Smart Table-to-Chart Visualizations**: Researchers often struggle with visualizing data. AROKO can instantly parse markdown/HTML tables and output a clean, interactive React chart (Bar, Line, Pie, Scatter) seamlessly inserted directly into the document.
4. **Strict Citation Registry**: AROKO enforces strict adherence to uploaded sources. The prompt engineering explicitly prevents the AI from fabricating fake papers or authors, instead relying on a customized in-memory citation registry built from user-uploaded PDFs and DOCXs.
5. **Dynamic Templating**: Auto-format your messy draft into perfect APA, Harvard, or IEEE structures with a single click.

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router), React
- **AI Integration:** Vercel AI SDK
- **Editor Engine:** Tiptap / ProseMirror (for precise cursor positioning and rich text)
- **Styling:** Tailwind CSS

## 🚀 Getting Started

To run AROKO locally:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your environment variables in `.env.local`
   ```env
   # Add your API keys for the chosen LLM provider
   ```
4. Start the Dev Server
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start writing!
