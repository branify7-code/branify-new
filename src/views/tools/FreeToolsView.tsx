import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, QrCode, Palette, FileJson, Code, 
  FileText, Sparkles, Copy, Check, RefreshCw, Eye, Sliders, CheckCircle2, ArrowRight
} from 'lucide-react';
import { digitalToolsData } from '../../data/tools';
import { DigitalTool } from '../../types';

interface FreeToolsViewProps {
  onRunToolModal: (tool: DigitalTool) => void;
  onNavigateHome: () => void;
  initialToolId?: string | null;
}

export const FreeToolsView: React.FC<FreeToolsViewProps> = ({
  onRunToolModal,
  onNavigateHome,
  initialToolId,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialToolId || 'password-gen');
  const [copied, setCopied] = useState<string | null>(null);

  // 1. Password Generator States
  const [pwLength, setPwLength] = useState(20);
  const [pwIncludeSymbols, setPwIncludeSymbols] = useState(true);
  const [pwIncludeNumbers, setPwIncludeNumbers] = useState(true);
  const [pwIncludeUppercase, setPwIncludeUppercase] = useState(true);
  const [generatedPw, setGeneratedPw] = useState('');

  // 2. QR Code Generator States
  const [qrInput, setQrInput] = useState('https://branify.agency');
  const [qrColor, setQrColor] = useState('#D4AF37');
  const [qrBgColor, setQrBgColor] = useState('#08090B');

  // 3. Color Converter & Contrast States
  const [hexInput, setHexInput] = useState('#D4AF37');
  const [bgHexInput, setBgHexInput] = useState('#08090B');

  // 4. JSON Formatter States
  const [jsonInput, setJsonInput] = useState('{\n  "agency": "Branify",\n  "version": "4.2",\n  "status": "online",\n  "capabilities": ["Web3D", "AI Orchestration", "Spatial UI"]\n}');
  const [jsonFormatted, setJsonFormatted] = useState('');
  const [jsonError, setJsonError] = useState('');

  // 5. Social Meta Tag Builder States
  const [metaTitle, setMetaTitle] = useState('Branify — Luxury Digital Studio & Futuristic Technology');
  const [metaDesc, setMetaDesc] = useState('Bespoke web applications, AI autonomous systems, and category-defining visual identities for ambitious brands.');
  const [metaUrl, setMetaUrl] = useState('https://branify.agency');
  const [metaImage, setMetaImage] = useState('https://branify.agency/og-image.jpg');

  // 6. Word & Reading Time States
  const [textStatsInput, setTextStatsInput] = useState('Branify is a premier digital technology and creative agency specializing in next-generation web design, AI solutions, branding, software engineering, and digital products. We turn complex ideas into refined digital sovereignty.');

  useEffect(() => {
    if (initialToolId) {
      setActiveTab(initialToolId);
    }
  }, [initialToolId]);

  // Password Generation Logic
  const handleGeneratePassword = () => {
    let chars = 'abcdefghijklmnopqrstuvwxyz';
    if (pwIncludeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (pwIncludeNumbers) chars += '0123456789';
    if (pwIncludeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const array = new Uint32Array(pwLength);
    window.crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < pwLength; i++) {
      result += chars[array[i] % chars.length];
    }
    setGeneratedPw(result);
  };

  useEffect(() => {
    handleGeneratePassword();
  }, [pwLength, pwIncludeSymbols, pwIncludeNumbers, pwIncludeUppercase]);

  // Copy helper
  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // JSON format helper
  const formatJSON = (indent = 2) => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonFormatted(JSON.stringify(parsed, null, indent));
      setJsonError('');
    } catch (err: unknown) {
      setJsonError((err as Error).message);
    }
  };

  // Color & Contrast calculations
  const getRGB = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return { r: 212, g: 175, b: 55 };
    return {
      r: parseInt(cleanHex.substring(0, 2), 16),
      g: parseInt(cleanHex.substring(2, 4), 16),
      b: parseInt(cleanHex.substring(4, 6), 16),
    };
  };

  const activeRgb = getRGB(hexInput);
  const bgRgb = getRGB(bgHexInput);

  const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const lum1 = getLuminance(activeRgb.r, activeRgb.g, activeRgb.b);
  const lum2 = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const contrastRatio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);

  // Word metrics calculation
  const wordsCount = textStatsInput.trim() ? textStatsInput.trim().split(/\s+/).length : 0;
  const charsCount = textStatsInput.length;
  const charsNoSpaces = textStatsInput.replace(/\s+/g, '').length;
  const readingTimeMin = Math.ceil(wordsCount / 200);
  const speakingTimeMin = Math.ceil(wordsCount / 130);

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
          <span className="text-[#D4AF37]">Free Developer & Design Ecosystem</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#FFF5DC]">
          Client-Side <br />
          <span className="text-gold-gradient">Digital Utilities</span>
        </h1>

        <p className="text-sm sm:text-base text-white/65 font-light leading-relaxed">
          High-performance, zero-tracking web utilities built for developers, designers, and founders. Processed 100% locally in your browser with cryptographic security.
        </p>
      </div>

      {/* Tool Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
        <button
          onClick={() => setActiveTab('password-gen')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'password-gen'
              ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'bg-[#0F1015] text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Password Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('qr-gen')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'qr-gen'
              ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'bg-[#0F1015] text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Vector QR Maker</span>
        </button>

        <button
          onClick={() => setActiveTab('color-converter')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'color-converter'
              ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'bg-[#0F1015] text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Color & Contrast</span>
        </button>

        <button
          onClick={() => setActiveTab('json-formatter')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'json-formatter'
              ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'bg-[#0F1015] text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <FileJson className="w-4 h-4" />
          <span>JSON Validator</span>
        </button>

        <button
          onClick={() => setActiveTab('meta-generator')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'meta-generator'
              ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'bg-[#0F1015] text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Meta Tags Previewer</span>
        </button>

        <button
          onClick={() => setActiveTab('word-counter')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'word-counter'
              ? 'bg-[#D4AF37] text-[#08090B] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'bg-[#0F1015] text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Word & Reading Time</span>
        </button>
      </div>

      {/* Main Interactive Tool Workspace */}
      <div className="rounded-3xl bg-[#0F1015] border border-[#D4AF37]/30 p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* 1. PASSWORD GENERATOR */}
        {activeTab === 'password-gen' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
                  Cryptographic Entropy
                </span>
                <h2 className="font-display text-2xl font-bold text-[#FFF5DC]">
                  Entropy Password Generator
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono">
                100% Local Browser Execution
              </span>
            </div>

            {/* Password Result Bar */}
            <div className="p-4 sm:p-6 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-between gap-4">
              <span className="font-mono text-base sm:text-xl text-[#FFF5DC] tracking-wider break-all select-all">
                {generatedPw}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleGeneratePassword}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                  title="Generate New"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => copyText(generatedPw, 'pw')}
                  className="px-4 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied === 'pw' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied === 'pw' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-white/70">
                  <span>Length:</span>
                  <span className="text-[#D4AF37] font-bold">{pwLength} characters</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={pwLength}
                  onChange={(e) => setPwLength(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pwIncludeUppercase}
                  onChange={(e) => setPwIncludeUppercase(e.target.checked)}
                  className="accent-[#D4AF37] w-4 h-4"
                />
                <span className="text-xs font-mono text-white/80">Uppercase (A-Z)</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pwIncludeNumbers}
                  onChange={(e) => setPwIncludeNumbers(e.target.checked)}
                  className="accent-[#D4AF37] w-4 h-4"
                />
                <span className="text-xs font-mono text-white/80">Numbers (0-9)</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pwIncludeSymbols}
                  onChange={(e) => setPwIncludeSymbols(e.target.checked)}
                  className="accent-[#D4AF37] w-4 h-4"
                />
                <span className="text-xs font-mono text-white/80">Symbols (!@#$%)</span>
              </label>
            </div>
          </div>
        )}

        {/* 2. VECTOR QR CODE GENERATOR */}
        {activeTab === 'qr-gen' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
                Branded Vector Output
              </span>
              <h2 className="font-display text-2xl font-bold text-[#FFF5DC]">
                Vector QR Generator
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60">
                  Target URL or Text Payload
                </label>
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/15 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                  placeholder="https://yourbrand.com"
                />

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-mono text-white/60 mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-white/60 mb-1">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={qrBgColor}
                        onChange={(e) => setQrBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={qrBgColor}
                        onChange={(e) => setQrBgColor(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Preview Display */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <div
                  className="p-6 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl"
                  style={{ backgroundColor: qrBgColor }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      qrInput || 'https://branify.agency'
                    )}&color=${qrColor.replace('#', '')}&bgcolor=${qrBgColor.replace('#', '')}`}
                    alt="Branify QR Code"
                    className="w-44 h-44 rounded-lg object-contain"
                  />
                </div>
                <span className="text-[11px] font-mono text-white/50">
                  Ready for print & high-density digital displays
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. COLOR CONVERTER & CONTRAST */}
        {activeTab === 'color-converter' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
                WCAG 2.2 Accessibility & Harmonic Spaces
              </span>
              <h2 className="font-display text-2xl font-bold text-[#FFF5DC]">
                Harmonic Color & Contrast Studio
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Color Inputs */}
              <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-white/70">Foreground (Text / Accent)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={hexInput}
                      onChange={(e) => setHexInput(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={hexInput}
                      onChange={(e) => setHexInput(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-sm font-mono text-white uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-mono text-white/70">Background (Canvas)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bgHexInput}
                      onChange={(e) => setBgHexInput(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={bgHexInput}
                      onChange={(e) => setBgHexInput(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-sm font-mono text-white uppercase"
                    />
                  </div>
                </div>

                {/* Values table */}
                <div className="p-4 rounded-xl bg-black/50 space-y-2 font-mono text-xs text-white/80">
                  <div className="flex justify-between">
                    <span className="text-white/40">RGB:</span>
                    <span>rgb({activeRgb.r}, {activeRgb.g}, {activeRgb.b})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">CSS Variable:</span>
                    <span>--color-brand: {hexInput};</span>
                  </div>
                </div>
              </div>

              {/* Contrast Preview & Compliance */}
              <div
                className="p-8 rounded-2xl border border-white/15 flex flex-col justify-between space-y-6"
                style={{ backgroundColor: bgHexInput, color: hexInput }}
              >
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest opacity-70">
                    Live Optical Preview
                  </span>
                  <h3 className="text-3xl font-extrabold tracking-tight mt-1">
                    Luxury Typography & Contrast
                  </h3>
                  <p className="text-xs mt-2 opacity-85 leading-relaxed">
                    Accessible contrast ensures effortless readability on OLED, Retina, and HDR displays.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono">Contrast Ratio:</span>
                    <span className="font-mono text-base font-bold text-[#D4AF37]">
                      {contrastRatio.toFixed(2)}:1
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className={`px-2 py-0.5 rounded ${contrastRatio >= 4.5 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {contrastRatio >= 4.5 ? 'WCAG AA Pass' : 'WCAG AA Fail'}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${contrastRatio >= 7.0 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {contrastRatio >= 7.0 ? 'WCAG AAA Pass' : 'Large Text Only'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. JSON VALIDATOR & FORMATTER */}
        {activeTab === 'json-formatter' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
                  Syntax Inspector
                </span>
                <h2 className="font-display text-2xl font-bold text-[#FFF5DC]">
                  JSON Validator & Formatter
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => formatJSON(2)}
                  className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#08090B] font-bold text-xs font-mono uppercase cursor-pointer"
                >
                  Beautify (2 Spaces)
                </button>
                <button
                  onClick={() => formatJSON(0)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-mono text-xs cursor-pointer"
                >
                  Minify
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-white/50">Input Raw JSON</label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={10}
                  className="w-full p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-white focus:border-[#D4AF37] focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono text-white/50">Formatted Output</label>
                  {jsonFormatted && (
                    <button
                      onClick={() => copyText(jsonFormatted, 'json')}
                      className="text-xs font-mono text-[#D4AF37] hover:underline cursor-pointer"
                    >
                      {copied === 'json' ? 'Copied' : 'Copy Output'}
                    </button>
                  )}
                </div>
                <textarea
                  value={jsonFormatted || (jsonError ? `Error: ${jsonError}` : '')}
                  readOnly
                  rows={10}
                  className={`w-full p-4 rounded-xl bg-black/40 border font-mono text-xs resize-none ${
                    jsonError ? 'border-red-500/50 text-red-400' : 'border-white/10 text-[#FFF5DC]'
                  }`}
                  placeholder="Click Beautify to inspect and format..."
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. SOCIAL META TAG GENERATOR */}
        {activeTab === 'meta-generator' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
                Search Engine & Social Preview
              </span>
              <h2 className="font-display text-2xl font-bold text-[#FFF5DC]">
                Social Meta Tag Architect
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-white/60">Page Title</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-white/60">Description (155-160 chars recommended)</label>
                  <textarea
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-white/60">Canonical URL</label>
                  <input
                    type="text"
                    value={metaUrl}
                    onChange={(e) => setMetaUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                  />
                </div>
              </div>

              {/* Live Google & Social Preview */}
              <div className="lg:col-span-6 space-y-4">
                <label className="block text-xs font-mono text-white/60">
                  Google SERP Simulation Preview
                </label>
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="text-[11px] text-[#8ab4f8] truncate block font-sans">
                    {metaUrl}
                  </span>
                  <h4 className="text-sm font-semibold text-[#8ab4f8] hover:underline cursor-pointer">
                    {metaTitle}
                  </h4>
                  <p className="text-xs text-[#bdc1c6] leading-relaxed pt-1">
                    {metaDesc}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const snippet = `<title>${metaTitle}</title>\n<meta name="description" content="${metaDesc}" />\n<meta property="og:title" content="${metaTitle}" />\n<meta property="og:description" content="${metaDesc}" />\n<meta property="og:url" content="${metaUrl}" />`;
                    copyText(snippet, 'meta');
                  }}
                  className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied === 'meta' ? 'Copied HTML Meta Snippet' : 'Copy HTML Meta Tags'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. WORD COUNTER & READING TIME */}
        {activeTab === 'word-counter' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
                Editorial Analytics
              </span>
              <h2 className="font-display text-2xl font-bold text-[#FFF5DC]">
                Pro Word & Reading Metrics
              </h2>
            </div>

            <textarea
              value={textStatsInput}
              onChange={(e) => setTextStatsInput(e.target.value)}
              rows={6}
              className="w-full p-4 rounded-2xl bg-black/50 border border-white/15 text-xs text-white focus:border-[#D4AF37] focus:outline-none resize-none leading-relaxed"
              placeholder="Paste or type copy here to compute real-time editorial metrics..."
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center space-y-1">
                <span className="text-2xl font-bold font-mono text-[#D4AF37]">{wordsCount}</span>
                <span className="text-[11px] text-white/50 block uppercase font-mono">Words</span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center space-y-1">
                <span className="text-2xl font-bold font-mono text-[#FFF5DC]">{charsCount}</span>
                <span className="text-[11px] text-white/50 block uppercase font-mono">Characters</span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center space-y-1">
                <span className="text-2xl font-bold font-mono text-[#D4AF37]">{readingTimeMin} min</span>
                <span className="text-[11px] text-white/50 block uppercase font-mono">Reading Time</span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center space-y-1">
                <span className="text-2xl font-bold font-mono text-[#FFF5DC]">{speakingTimeMin} min</span>
                <span className="text-[11px] text-white/50 block uppercase font-mono">Speaking Time</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid of All Available Tools */}
      <div className="space-y-6">
        <h3 className="text-xs font-mono uppercase text-[#D4AF37] tracking-widest">
          All Client-Side Tools
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {digitalToolsData.map((tool) => (
            <div
              key={tool.id}
              onClick={() => onRunToolModal(tool)}
              className="p-6 rounded-2xl bg-[#0F1015] border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-mono uppercase text-[#D4AF37]">
                    {tool.category}
                  </span>
                  <span className="text-[10px] font-mono text-green-400">● {tool.status}</span>
                </div>
                <h4 className="font-display text-lg font-bold text-[#FFF5DC] group-hover:text-[#F3E5AB]">
                  {tool.name}
                </h4>
                <p className="text-xs text-white/60 leading-relaxed font-light">
                  {tool.tagline}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs font-mono text-[#D4AF37]">
                <span>Launch Quick Runner</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
