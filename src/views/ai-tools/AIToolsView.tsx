import React, { useState, useEffect } from 'react';
import { 
  Sparkles, PenTool, Workflow, LineChart, Code2, 
  ArrowRight, Copy, Check, RefreshCw, Zap, Shield, Cpu, MessageSquare 
} from 'lucide-react';
import { aiToolsData } from '../../data/aiTools';
import { AITool } from '../../types';

interface AIToolsViewProps {
  onStartInquiry: (category?: string) => void;
  onNavigateHome: () => void;
  initialToolId?: string | null;
}

export const AIToolsView: React.FC<AIToolsViewProps> = ({
  onStartInquiry,
  onNavigateHome,
  initialToolId,
}) => {
  const [selectedToolId, setSelectedToolId] = useState<string>(
    initialToolId || aiToolsData[0]?.id || 'ai-copy-architect'
  );
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState('');
  const [copied, setCopied] = useState(false);

  const activeTool = aiToolsData.find((t) => t.id === selectedToolId) || aiToolsData[0];

  useEffect(() => {
    if (initialToolId) {
      setSelectedToolId(initialToolId);
    }
  }, [initialToolId]);

  // Set default prompt based on tool
  useEffect(() => {
    if (selectedToolId === 'ai-copy-architect') {
      setPromptInput('Luxury Swiss watch brand announcing a limited titanium tourbillon timepiece for avant-garde collectors.');
      setGeneratedResult('Introducing the Aethel Chrono-Sovereign: Precision-machined from aerospace Grade 5 titanium, housing an unyielding 3Hz mechanical tourbillon. Engineered not merely to measure time, but to claim dominion over it.');
    } else if (selectedToolId === 'ai-visual-synthesizer') {
      setPromptInput('Seamless dark brushed gold metallic texture with champagne specular reflection and microscopic geometric etching, 8k PBR.');
      setGeneratedResult('Synthesizing PBR Material Map: [Albedo: #D4AF37, Roughness: 0.18, Metalness: 0.96, Normal: Tangent-Space Micro-Hex Lattice]. Ready for WebGL Shader export.');
    } else if (selectedToolId === 'ai-code-auditor') {
      setPromptInput('Audit a React Three Fiber useEffect hook for memory leaks, WebGL context disposal, and listener cleanup.');
      setGeneratedResult('✓ Memory Audit Passed: 0 Memory Leaks detected. 1 WebGLRenderer.dispose() verified. Event listeners bound with { passive: true } and strictly cleaned in useEffect teardown.');
    } else {
      setPromptInput('Optimize customer acquisition funnel for enterprise B2B SaaS platform with $25k ACV.');
      setGeneratedResult('Predictive Model Result: Identified 3 high-intent conversion vectors with 84% estimated ROAS uplift. Recommended allocation: 45% LinkedIn Account-Based InMail, 35% Search Intent, 20% Founder-Led Retargeting.');
    }
  }, [selectedToolId]);

  const handleSimulatedGenerate = () => {
    if (!promptInput.trim()) return;
    setIsGenerating(true);
    setGeneratedResult('');

    setTimeout(() => {
      if (selectedToolId === 'ai-copy-architect') {
        setGeneratedResult(
          `Generated calibrated brand narrative:\n\n"Crafted at the nexus of high aesthetic poise and mathematical rigor. The new standard for digital supremacy."\n\n• Primary Hook: 96% Estimated Conversion Index\n• Tone: Architectural, Exclusive, Visionary\n• Formats: Hero Headline, Social Teaser, Investor Memo.`
        );
      } else if (selectedToolId === 'ai-visual-synthesizer') {
        setGeneratedResult(
          `Generated Spatial PBR Texture Profile:\n\n• Base Color: Metallic Champagne (#E5C378)\n• Roughness Map: 4096 x 4096 px (Lossless Float16)\n• Ambient Occlusion: High-Frequency Depth Mesh\n• Render Latency: 1.2 seconds on Neural Engine.`
        );
      } else {
        setGeneratedResult(
          `Analysis Complete for: "${promptInput.slice(0, 50)}..."\n\n✓ Model: ${activeTool.model}\n✓ Verified Precision: ${activeTool.metrics}\n✓ Key Vector: Autonomous pipeline calibrated for zero-overhead execution.`
        );
      }
      setIsGenerating(false);
    }, 900);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header Breadcrumbs & Hero Title */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#D4AF37]/30 text-xs font-mono text-[#F3E5AB]">
          <button 
            onClick={onNavigateHome} 
            className="text-white/60 hover:text-[#FFF5DC] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="text-white/30">/</span>
          <span className="text-[#D4AF37]">Autonomous AI Innovation Lab</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
          Neural & Autonomous <br />
          <span className="text-gold-gradient">AI Solutions</span>
        </h1>

        <p className="text-sm sm:text-base text-white/65 font-light leading-relaxed">
          Explore our suite of proprietary AI models, brand-voice calibrators, PBR texture synthesizers, and self-healing agent pipelines engineered for high-velocity enterprises.
        </p>
      </div>

      {/* AI Tools Selection Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-5xl mx-auto">
        {aiToolsData.map((tool) => {
          const isSelected = selectedToolId === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setSelectedToolId(tool.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#D4AF37] text-[#08090B] font-bold border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.35)]'
                  : 'bg-[#0F1015] text-white/70 hover:text-white border-white/10 hover:border-[#D4AF37]/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tool.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active AI Tool Interactive Playground */}
      <div className="rounded-3xl bg-[#0F1015] border border-[#D4AF37]/30 p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.6)] space-y-8">
        {/* Tool Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-mono uppercase">
                {activeTool.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] font-mono">
                Model: {activeTool.model}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#FFF5DC]">
              {activeTool.name}
            </h2>
            <p className="text-xs sm:text-sm text-white/70 font-light max-w-2xl">
              {activeTool.description}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-[#D4AF37]/30 text-right shrink-0">
            <span className="text-[10px] font-mono text-white/50 block">Accuracy Benchmark</span>
            <span className="font-mono text-sm font-bold text-[#D4AF37]">{activeTool.metrics}</span>
          </div>
        </div>

        {/* Prompt & Output Playground */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prompt Column */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-white/60">
                Input Prompt / Vector Directive
              </label>
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                rows={7}
                className="w-full p-4 rounded-2xl bg-black/60 border border-white/15 text-xs text-white focus:border-[#D4AF37] focus:outline-none resize-none leading-relaxed font-mono"
                placeholder="Enter prompt instructions for the neural engine..."
              />
            </div>

            <button
              onClick={handleSimulatedGenerate}
              disabled={isGenerating}
              className="w-full py-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] disabled:opacity-50 text-[#08090B] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Output...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Inference Model</span>
                </>
              )}
            </button>
          </div>

          {/* Result Column */}
          <div className="space-y-2 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
                Neural Model Synthesis Output
              </label>
              {generatedResult && (
                <button
                  onClick={copyResult}
                  className="text-xs font-mono text-white/70 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[220px] p-4 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs text-[#FFF5DC] leading-relaxed whitespace-pre-wrap flex flex-col justify-between">
              <div>{generatedResult || 'Click "Run Inference Model" to generate output...'}</div>
              <div className="pt-4 flex items-center justify-between text-[10px] text-white/40 border-t border-white/5">
                <span>Latency: 18ms</span>
                <span>Tokens: 142</span>
                <span>Security: End-to-End Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities Checklist */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
            Core Model Capabilities:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeTool.capabilities.map((cap, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2 text-xs text-white/80">
                <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enterprise Custom AI Integration Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#12131A] via-[#1A1810] to-[#12131A] border border-[#D4AF37]/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs font-mono text-[#D4AF37]">
          <Cpu className="w-3.5 h-3.5" />
          <span>Enterprise AI Architecture</span>
        </div>
        <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#FFF5DC]">
          Need Custom AI Models or Autonomous Agent Workflows?
        </h2>
        <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto leading-relaxed">
          We architect, fine-tune, and deploy private LLMs, automated multi-agent systems, and bespoke vision pipelines tailored to your proprietary company data.
        </p>
        <div>
          <button
            onClick={() => onStartInquiry('AI Solutions')}
            className="px-8 py-4 rounded-full bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)] cursor-pointer"
          >
            Consult Our AI Engineering Team
          </button>
        </div>
      </div>
    </div>
  );
};
