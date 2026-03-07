# AROKO: AI-Powered Academic Editor 🎓

AROKO is an intelligent, context-aware document editor built specifically to solve the biggest pain points for university students and academic researchers. It features integrated AI writing assistance powered entirely by **Amazon Nova** foundation models via AWS Bedrock.

## 🏆 Built for the Amazon Nova AI Hackathon

This project was built to showcase the power, speed, and cost-effectiveness of Amazon Nova models for complex, document-heavy AI tasks. 

**Powered By:**
- **Amazon Nova Lite**: Handles high-volume, rapid in-line editing (paraphrasing, improving sentences) with blazing fast latency, ensuring the editor feels responsive without breaking the bank for students.
- **Amazon Nova Pro**: Powers deep contextual reasoning when writing entire paragraphs, synthesizing multiple uploaded references, or extracting complex JSON from data tables.

## ✨ Key Features & Technical Highlights

Unlike standard ChatGPT wrappers that frequently hallucinate academic sources, AROKO is built as a complete academic workspace:

1. **Context-Aware AI Editor**: Select any text in the document or press `/` to trigger the AI menu. The system automatically reads the surrounding text and the nearest section heading to understand *exactly* where the user is in their paper, providing highly relevant completions.
2. **Strict Citation Registry**: AROKO enforces strict adherence to uploaded sources. The prompt engineering explicitly prevents the AI from fabricating fake papers or authors, instead relying on a customized in-memory citation registry built from user-uploaded PDFs.
3. **Smart Table-to-Chart Visualizations**: Researchers often struggle with visualizing data. AROKO can instantly parse markdown/HTML tables, feed the data to **Amazon Nova Pro**, and output a clean, interactive React chart (Bar, Line, Pie, Scatter) seamlessly inserted directly into the document.
4. **Tailored Tone Controls**: Built-in prompts instantly flip writing styles from "casual" to "formal scholarly publication" mode.

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router), React
- **AI Models:** Amazon Nova Lite & Nova Pro (via AWS Bedrock)
- **Editor:** Tiptap framework for customized rich text
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
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   ```
4. Start the Dev Server
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start writing!
