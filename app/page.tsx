'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, FileText, BookOpen, Quote, Zap, Shield, CheckCircle, FolderOpen, Upload, Wand2, Download, X, Check } from 'lucide-react';

// Scroll Animation Hook
function useOnScreen(ref: React.RefObject<any>, rootMargin = '0px') {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true);
          observer.disconnect(); // Only trigger once
        }
      },
      { rootMargin }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return isIntersecting;
}

const FadeIn = ({ children, delay = 0, className = '' }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref, '-50px');

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-slate-200 overflow-x-hidden font-sans">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 overflow-hidden rounded-lg">
              <Image
                src="/aroko_logo.jpg"
                alt="AROKO Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">AROKO</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/editor" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Log In</Link>
            <Link
              href="/editor"
              className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
            >
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 mb-8">
              <Sparkles size={12} className="text-blue-500" />
              <span>Powered by Advanced AI Models</span>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-slate-900">
              Write Research Papers <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">10x Faster</span> with AI
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              AROKO creates outlines, drafts sections, formats citations, and ensures academic standards in seconds. The smartest way to write your thesis.
            </p>
          </FadeIn>

          <FadeIn delay={300} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/editor"
              className="px-8 py-4 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-2 group"
            >
              Start Writing Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how-it-works" className="px-8 py-4 rounded-full bg-white border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition-all">
              See How It Works
            </a>
          </FadeIn>

          {/* Editor Mockup */}
          <FadeIn delay={500} className="mt-20 relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-xl blur-2xl opacity-50 -z-10" />
            <div className="relative rounded-xl border border-slate-200 bg-slate-50 shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[16/10] flex flex-col">
              {/* Fake Browser Chrome */}
              <div className="h-8 bg-white border-b border-slate-100 flex items-center px-4 gap-2 shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                <div className="ml-4 flex-1 max-w-xl mx-auto bg-slate-100 rounded-md h-5 text-[10px] flex items-center justify-center text-slate-400 font-medium">
                  aroko.com/editor
                </div>
              </div>

              {/* App UI Replica */}
              <div className="flex-1 flex flex-col overflow-hidden relative font-sans">
                {/* Header */}
                <div className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 shrink-0 z-20">
                  <div className="flex items-center gap-3 w-48">
                    <span className="text-lg font-bold tracking-tight text-slate-900">AROKO</span>
                    <div className="h-4 w-px bg-slate-200" />
                    <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Research Proposal</span>
                  </div>

                  {/* Floating Pill Toolbar */}
                  <div className="flex-1 flex justify-center">
                    <div className="hidden md:flex items-center gap-2 text-xs bg-white p-1 rounded-lg border border-slate-200 shadow-sm text-slate-600">
                      <div className="flex items-center px-2 py-1 gap-1">
                        <span className="font-serif">Times New Roman</span>
                        <span className="text-slate-300">▼</span>
                      </div>
                      <div className="w-px h-3 bg-slate-200" />
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="font-bold">B</span>
                        <span className="italic font-serif">I</span>
                        <span className="underline">U</span>
                      </div>
                      <div className="w-px h-3 bg-slate-200" />
                      <div className="flex items-center gap-2 px-1">
                        <span>Align</span>
                        <span>List</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-48 flex justify-end">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">JD</div>
                  </div>
                </div>

                {/* Main Workspace */}
                <div className="flex-1 flex overflow-hidden relative bg-slate-50/50">
                  {/* Sidebar Mock */}
                  <div className="w-16 bg-white border-r border-slate-100 hidden md:flex flex-col items-center py-4 gap-4 z-10">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <div className="w-8 h-8 text-slate-400 rounded-lg flex items-center justify-center">
                      <FolderOpen size={16} />
                    </div>
                  </div>

                  {/* Canvas */}
                  <div className="flex-1 overflow-hidden relative flex justify-center p-8">
                    <div className="w-full max-w-[600px] bg-white shadow-sm ring-1 ring-slate-900/5 h-[800px] p-12 text-left relative transform transition-transform hover:scale-[1.01] duration-500">
                      <h1 className="text-3xl font-bold font-serif mb-6 text-black">The Impact of Artificial Intelligence on Academic Writing Efficiency</h1>
                      <p className="font-serif text-[11px] leading-relaxed text-black mb-4 text-justify">
                        <strong>Abstract.</strong> This study explores the transformative role of AI-powered tools in enhancing the productivity of researchers and students. By automating formatting, citation management, and structural drafting, tools like AROKO are redefining the writing process.
                      </p>
                      <h2 className="text-xl font-bold font-serif mt-8 mb-4 text-black">1. Introduction</h2>
                      <p className="font-serif text-[11px] leading-relaxed text-black mb-4 text-justify">
                        Academic writing is characterized by rigorous standards of formatting, citation, and argumentation. Traditionally, these tasks consume a significant portion of a researcher's time. However, recent advancements in Natural Language Processing (NLP) have paved the way for intelligent writing assistants...
                      </p>

                      {/* AI Bubble */}
                      <div className="absolute right-[-20px] top-[260px] max-w-[240px] bg-white rounded-xl shadow-xl border border-purple-100 p-3 z-20 animate-in slide-in-from-bottom-4 duration-1000">
                        <div className="flex items-start gap-2">
                          <div className="bg-purple-100 p-1 rounded-md text-purple-600 shrink-0">
                            <Sparkles size={12} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-800 font-medium mb-1">Suggestion</p>
                            <p className="text-[10px] text-slate-500 leading-snug">
                              Consider expanding this section to cite recent studies from 2024 regarding LLM usage in universities.
                            </p>
                            <div className="mt-2 flex gap-1">
                              <button className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">Apply</button>
                              <button className="text-[10px] px-2 py-0.5 text-slate-400">Dismiss</button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Right Panel Mock */}
                  <div className="w-72 bg-white border-l border-slate-100 hidden lg:block z-10 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.05)]">
                    <div className="p-3 border-b border-slate-50 flex items-center gap-2">
                      <div className="bg-blue-100 p-1 rounded text-blue-600"><Sparkles size={12} /></div>
                      <span className="text-xs font-semibold text-slate-700">Assistant</span>
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white text-[10px] p-2 rounded-lg rounded-br-sm max-w-[80%]">
                          Analyze the methodology section.
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-slate-100 text-slate-700 text-[10px] p-2 rounded-lg rounded-bl-sm max-w-[90%]">
                          The methodology is sound but lacks detail on the sampling technique used for the survey...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FadeIn delay={0}>
              <div className="group p-8 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">AI Writing Assistant</h3>
                <p className="text-slate-500 leading-relaxed">
                  Get intelligent writing suggestions as you type. Press "/" for AI help with any section - introductions, literature reviews, methodology, and more.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="group p-8 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Smart Formatting</h3>
                <p className="text-slate-500 leading-relaxed">
                  Automatically apply specific university templates. Font sizes, line spacing, and margins are handled for you.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="group p-8 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                  <Quote size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Auto Citations</h3>
                <p className="text-slate-500 leading-relaxed">
                  Built-in citation engine supporting APA, Harvard, and Chicago styles. Search papers and cite them in one click.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-20 md:mb-32">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">How It Works</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              From blank page to submitted paper in three streamlined steps.
            </p>
          </FadeIn>

          <div className="space-y-20 md:space-y-32">

            {/* Step 1: Research (Text Left, Visual Right) */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
              <FadeIn className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200 text-sm font-bold text-blue-700 mb-6">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</div>
                  <span>Add Your Sources</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-slate-900">Stop Searching, Start Writing</h3>
                <p className="text-lg text-slate-500 mb-6 leading-relaxed">
                  Upload your PDF readings or search for 200M+ papers directly within AROKO.
                  Our AI reads every page instantly, extracting key arguments and auto-generating citations.
                </p>
                <ul className="space-y-3 text-left inline-block">
                  <li className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="text-blue-600 shrink-0" size={20} />
                    <span>Multi-PDF Upload & Analysis</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="text-blue-600 shrink-0" size={20} />
                    <span>Auto-extracted Metadata (Author, Year)</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="text-blue-600 shrink-0" size={20} />
                    <span>Intelligent Context Awareness</span>
                  </li>
                </ul>
              </FadeIn>

              <FadeIn delay={200} className="flex-1 w-full max-w-md md:max-w-none">
                {/* Visual: PDF Upload Mockup */}
                <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div className="absolute -top-4 -left-4 bg-white p-3 rounded-lg shadow-lg border border-slate-100 flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-md text-red-600"><FileText size={20} /></div>
                    <div className="text-xs">
                      <div className="font-bold text-slate-800">thesis_refs.pdf</div>
                      <div className="text-slate-400">Published 2024</div>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-8 text-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm font-semibold text-blue-900">Drag & drop research papers</p>
                    <p className="text-xs text-blue-400 mt-1">Processing citations...</p>
                  </div>

                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-300">
                          <FileText size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-24 bg-slate-200 rounded mb-1" />
                          <div className="h-1.5 w-16 bg-slate-100 rounded" />
                        </div>
                        <div className="text-green-500 text-xs font-bold">Ready</div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Step 2: Write (Text Right, Visual Left) */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24">
              <FadeIn className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/50 border border-purple-200 text-sm font-bold text-purple-700 mb-6">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">2</div>
                  <span>Let AI Help You Write</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-slate-900">Never Stare at a Blank Page Again</h3>
                <p className="text-lg text-slate-500 mb-6 leading-relaxed">
                  Stuck on the methodology? Just type "/" and ask AROKO. It drafts tailored sections,
                  suggests improvements, and maintains a strictly academic tone.
                </p>
                <ul className="space-y-3 text-left inline-block">
                  <li className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="text-purple-600 shrink-0" size={20} />
                    <span>In-text Citation Placement</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="text-purple-600 shrink-0" size={20} />
                    <span>Academic Tone Guard</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="text-purple-600 shrink-0" size={20} />
                    <span>Section-specific Templates</span>
                  </li>
                </ul>
              </FadeIn>

              <FadeIn delay={200} className="flex-1 w-full max-w-md md:max-w-none">
                {/* Visual: Editor Mockup */}
                <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 -rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div className="absolute top-10 -right-8 max-w-[200px] z-10">
                    <div className="bg-purple-600 text-white text-xs p-3 rounded-xl rounded-bl-none shadow-xl">
                      <p className="mb-2">💡 <strong>Suggestion:</strong> Keep sentences concise for better clarity.</p>
                      <div className="flex gap-2">
                        <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] cursor-pointer hover:bg-white/30">Accept</div>
                        <div className="text-white/60 px-2 py-0.5 text-[10px] cursor-pointer hover:text-white">Ignore</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 h-64 font-serif text-sm leading-relaxed text-slate-800 relative overflow-hidden">
                    <p>The impact of climate change on agricultural productivity in Nigeria is significant. <span className="bg-blue-100 text-blue-800 px-1 rounded">Okoro et al. (2023)</span> observed that rainfall variability accounts for 60% of yield fluctuations.</p>
                    <p className="mt-4">Furthermore, <span className="animate-pulse bg-slate-200 text-transparent rounded">typing...</span></p>

                    {/* Floating Action Menu */}
                    <div className="absolute top-24 left-10 bg-white shadow-lg border border-slate-100 rounded-lg py-1 px-1 flex flex-col gap-1 w-32 animate-in fade-in zoom-in duration-300">
                      <div className="px-2 py-1 text-xs hover:bg-slate-50 rounded flex gap-2 items-center text-purple-600 bg-purple-50 font-medium">
                        <Sparkles size={10} /> Expand
                      </div>
                      <div className="px-2 py-1 text-xs hover:bg-slate-50 rounded text-slate-600">Summarize</div>
                      <div className="px-2 py-1 text-xs hover:bg-slate-50 rounded text-slate-600">Rephrase</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Step 3: Export (Text Left, Visual Right) */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
              <FadeIn className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100/50 border border-green-200 text-sm font-bold text-green-700 mb-6">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">3</div>
                  <span>Export Perfect Documents</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-slate-900">Format in One Click</h3>
                <p className="text-lg text-slate-500 mb-6 leading-relaxed">
                  Don’t waste hours fighting with margins and bibliography formatting.
                  AROKO instantly formats your entire paper to APA, Harvard, or Chicago standards.
                </p>
                <ul className="space-y-3 text-left inline-block">
                  <li className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="text-green-600 shrink-0" size={20} />
                    <span>Automatic Reference List Generation</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="text-green-600 shrink-0" size={20} />
                    <span>Perfect Margins & Line Spacing</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="text-green-600 shrink-0" size={20} />
                    <span>Export to PDF & DOCX</span>
                  </li>
                </ul>
              </FadeIn>

              <FadeIn delay={200} className="flex-1 w-full max-w-md md:max-w-none">
                {/* Visual: Export Mockup */}
                <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded bg-red-100 text-red-500 flex items-center justify-center font-bold text-xs">PDF</div>
                      <div className="w-8 h-8 rounded bg-blue-100 text-blue-500 flex items-center justify-center font-bold text-xs">DOC</div>
                    </div>
                    <div className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-green-200 transition-colors cursor-pointer">
                      <Download size={14} /> Download
                    </div>
                  </div>

                  <div className="space-y-3 opacity-60 pointer-events-none">
                    <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
                    <div className="h-2 bg-slate-100 rounded w-full" />
                    <div className="h-2 bg-slate-100 rounded w-full" />
                    <div className="h-2 bg-slate-100 rounded w-5/6" />
                    <div className="h-2 bg-slate-100 rounded w-full" />
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">References</p>
                    <div className="text-[10px] text-slate-500 space-y-2 font-serif">
                      <p>Adeboye, T. (2023). <span className="italic">AI in Nigerian Education.</span> Lagos University Press.</p>
                      <p>Smith, J. & Doe, A. (2024). <span className="italic">Automated citation systems.</span> Journal of EdTech, 12(4), 45-67.</p>
                    </div>
                  </div>

                  {/* Success Badge */}
                  <div className="absolute bottom-4 right-4 bg-white border border-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                    <CheckCircle size={12} /> Format Valid
                  </div>
                </div>
              </FadeIn>
            </div>

          </div>

          <FadeIn delay={600} className="text-center mt-24">
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:scale-105 group"
            >
              Start Writing Now
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Social Proof/Showcase */}
      <section className="py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl font-bold mb-12 text-slate-900">Trusted by students from top research institutions</h2>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-70 hover:opacity-100 transition-all duration-500">
              {/* University logos */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-slate-100">
                  <Image src="/unilorin.jpg" alt="UNILORIN" width={48} height={48} className="object-contain" />
                </div>
                <span className="text-sm font-semibold text-slate-600">UNILORIN</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-slate-100">
                  <Image src="/Unilag.jpg" alt="UNILAG" width={48} height={48} className="object-contain" />
                </div>
                <span className="text-sm font-semibold text-slate-600">UNILAG</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-slate-100">
                  <Image src="/UI.jpg" alt="UI" width={48} height={48} className="object-contain" />
                </div>
                <span className="text-sm font-semibold text-slate-600">UI</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-slate-100">
                  <Image src="/UNN.png" alt="UNN" width={48} height={48} className="object-contain" />
                </div>
                <span className="text-sm font-semibold text-slate-600">UNN</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-slate-100">
                  <Image src="/BUK.jpg" alt="BUK" width={48} height={48} className="object-contain" />
                </div>
                <span className="text-sm font-semibold text-slate-600">BUK</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Start free, upgrade when you need more. No hidden fees.</p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Plan */}
            <FadeIn delay={0}>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Free</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">₦0</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Perfect for trying out</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <span><strong>5,000</strong> words/month</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    AI writing assistance
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    Paper search
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    APA citations
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    2 PDF uploads
                  </li>
                </ul>
                <Link href="/editor" className="w-full py-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all text-center block">
                  Get Started
                </Link>
              </div>
            </FadeIn>

            {/* Basic Plan */}
            <FadeIn delay={100}>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Basic</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">₦1,000</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">For regular writers</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <span><strong>12,000</strong> words/month</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    AI writing assistance
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    Paper search
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    APA & Harvard citations
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    10 PDF uploads
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    Export to DOCX
                  </li>
                </ul>
                <Link href="/editor" className="w-full py-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all text-center block">
                  Choose Basic
                </Link>
              </div>
            </FadeIn>

            {/* Pro Plan - Popular */}
            <FadeIn delay={200}>
              <div className="bg-white rounded-2xl border-2 border-blue-500 p-6 h-full flex flex-col relative shadow-lg shadow-blue-100">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                  POPULAR
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-blue-600">₦2,000</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Best for students</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-blue-500 shrink-0" />
                    <span><strong>30,000</strong> words/month</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-blue-500 shrink-0" />
                    AI writing assistance
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-blue-500 shrink-0" />
                    Unlimited paper search
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-blue-500 shrink-0" />
                    All citation styles
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-blue-500 shrink-0" />
                    50 PDF uploads
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-blue-500 shrink-0" />
                    Export to DOCX
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={16} className="text-blue-500 shrink-0" />
                    Priority support
                  </li>
                </ul>
                <Link href="/editor" className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all text-center block">
                  Choose Pro
                </Link>
              </div>
            </FadeIn>

            {/* Premium Plan */}
            <FadeIn delay={300}>
              <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-2">Premium</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">₦5,000</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">For power users</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    <span><strong>80,000</strong> words/month</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    Unlimited AI assistance
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    Unlimited paper search
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    All citation styles
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    Unlimited PDF uploads
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    Export to DOCX
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    24/7 Priority support
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    Custom templates
                  </li>
                </ul>
                <Link href="/editor" className="w-full py-3 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all text-center block">
                  Choose Premium
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto relative">
          <FadeIn className="text-center p-12 rounded-3xl border border-slate-100 bg-slate-900 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready to write your masterpiece?</h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Join thousands of researchers who are saving hours every week with AROKO.
            </p>
            <Link
              href="/editor"
              className="inline-block px-10 py-5 rounded-full bg-white text-slate-900 text-lg font-bold hover:bg-slate-50 transition-all shadow-xl hover:scale-105"
            >
              Start Writing Now - It's Free
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8 rounded overflow-hidden">
                <Image
                  src="/aroko_logo.jpg"
                  alt="AROKO Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-slate-900">AROKO</span>
            </div>
            <p>The AI-powered academic writing assistant.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-slate-900">Features</a></li>
              <li><a href="#" className="hover:text-slate-900">Templates</a></li>
              <li><a href="#" className="hover:text-slate-900">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-slate-900">Citation Guide</a></li>
              <li><a href="#" className="hover:text-slate-900">Blog</a></li>
              <li><a href="#" className="hover:text-slate-900">Help Center</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-slate-900">Privacy</a></li>
              <li><a href="#" className="hover:text-slate-900">Terms</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
