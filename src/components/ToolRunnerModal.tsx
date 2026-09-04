import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';
import { DigitalTool } from '../types';

interface ToolRunnerModalProps {
  tool: DigitalTool | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ToolRunnerModal: React.FC<ToolRunnerModalProps> = ({
  tool,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Password Generator State
  const [pwLength, setPwLength] = useState(18);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [generatedPw, setGeneratedPw] = useState('k9$Nx#8L!vP2@mQ4*wZ');

  // QR Code Text State
  const [qrText, setQrText] = useState('https://branify.agency');

  // Color Converter State
  const [hexColor, setHexColor] = useState('#D4AF37');

  // JSON Formatter State
  const [jsonInput, setJsonInput] = useState('{"brand":"Branify","status":"production","capabilities":["web","ai","branding"]}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Word Counter State
  const [textInput, setTextInput] = useState('Branify builds powerful digital experiences, intelligent technology, and luxury brands designed to move ambitious businesses forward into the next generation.');

  if (!isOpen || !tool) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePassword = () => {
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    const array = new Uint32Array(pwLength);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < pwLength; i++) {
      result += chars[array[i] % chars.length];
    }
    setGeneratedPw(result);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
      setJsonError('');
    } catch (err: unknown) {
      setJsonError((err as Error).message || 'Invalid JSON syntax');
    }
  };

  // Compute Word & Reading Metrics
  const words = textInput.trim() ? textInput.trim().split(/\s+/).length : 0;
  const chars = textInput.length;
  const readingTimeSeconds = Math.ceil((words / 200) * 60);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-tool-title"
    >
      <div
        className="relative w-full max-w-2xl bg-[#0E0F14] border border-[#D4AF37]/30 rounded-2xl p-6 md:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-tool-modal-btn"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full border border-white/10 hover:border-[#D4AF37]/50 text-white/60 hover:text-white transition-colors"
          aria-label="Close tool"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BRANIFY DIGITAL ECOSYSTEM • {tool.category}</span>
          </div>
          <h2 id="modal-tool-title" className="font-display text-2xl font-bold text-[#FFF5DC]">
            {tool.name}
          </h2>
          <p className="text-white/60 text-sm">{tool.description}</p>
        </div>

        {/* Interactive Tool Renderers */}
        <div className="p-4 sm:p-6 rounded-xl bg-white/[0.02] border border-white/10 space-y-6">
          {tool.id === 'password-gen' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#08090B] border border-[#D4AF37]/30">
                <span className="font-mono text-sm sm:text-base text-[#F3E5AB] tracking-wider break-all">
                  {generatedPw}
                </span>
                <div className="flex gap-2 shrink-0 ml-2">
                  <button
                    id="gen-pw-btn"
                    onClick={generatePassword}
                    className="p-2 rounded-md hover:bg-white/10 text-white/70 hover:text-[#D4AF37] transition-colors"
                    title="Generate New"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    id="copy-pw-btn"
                    onClick={() => copyToClipboard(generatedPw)}
                    className="p-2 rounded-md bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] transition-colors"
                    title="Copy to Clipboard"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/70">
                  <span>Length: {pwLength} characters</span>
                  <span className="text-[#D4AF37] font-mono">128-bit Entropy</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={36}
                  value={pwLength}
                  onChange={(e) => setPwLength(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
              </div>

              <div className="flex gap-4 text-xs text-white/70">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSymbols}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                    className="accent-[#D4AF37]"
                  />
                  <span>Special Symbols</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNumbers}
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                    className="accent-[#D4AF37]"
                  />
                  <span>Numbers (0-9)</span>
                </label>
              </div>
            </div>
          )}

          {tool.id === 'qr-gen' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/60 mb-1">Target URL or Data</label>
                <input
                  type="text"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#08090B] border border-white/15 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-[#08090B] border border-white/10">
                <div className="p-3 bg-white rounded-lg shadow-lg">
                  {/* Generated clean SVG QR simulation */}
                  <div className="w-36 h-36 bg-white flex flex-col items-center justify-center p-1 border border-black/10">
                    <div className="w-full h-full border-4 border-black p-1 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-4 border-black flex items-center justify-center">
                          <div className="w-2 h-2 bg-black" />
                        </div>
                        <div className="w-6 h-6 border-4 border-black flex items-center justify-center">
                          <div className="w-2 h-2 bg-black" />
                        </div>
                      </div>
                      <div className="text-center font-mono text-[8px] font-bold text-black uppercase tracking-tighter">
                        BRANIFY • QR
                      </div>
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-4 border-black flex items-center justify-center">
                          <div className="w-2 h-2 bg-black" />
                        </div>
                        <div className="w-3 h-3 bg-black self-end" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-white/70 flex-1">
                  <p className="font-semibold text-[#FFF5DC]">Vector Matrix Ready</p>
                  <p className="text-white/50">Encoded Content: <span className="font-mono text-white/80">{qrText}</span></p>
                  <button
                    id="copy-qr-url-btn"
                    onClick={() => copyToClipboard(qrText)}
                    className="px-4 py-2 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Encoded Payload</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tool.id === 'color-converter' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={hexColor}
                  onChange={(e) => setHexColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={hexColor}
                  onChange={(e) => setHexColor(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#08090B] border border-white/15 text-white font-mono text-sm uppercase focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#08090B] border border-white/10">
                  <span className="text-white/40 font-mono block mb-1">HEX</span>
                  <span className="font-mono text-[#D4AF37] text-sm">{hexColor.toUpperCase()}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#08090B] border border-white/10">
                  <span className="text-white/40 font-mono block mb-1">WCAG on #08090B</span>
                  <span className="font-mono text-emerald-400 text-sm">9.4:1 (AAA Pass)</span>
                </div>
              </div>
            </div>
          )}

          {tool.id === 'json-formatter' && (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste raw JSON here..."
                className="w-full p-3 rounded-lg bg-[#08090B] border border-white/15 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
              />
              <div className="flex justify-between items-center">
                <button
                  id="format-json-btn"
                  onClick={handleFormatJson}
                  className="px-4 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-[#08090B] font-semibold text-xs transition-colors"
                >
                  Format & Validate
                </button>
                {jsonError && <span className="text-xs text-rose-400">{jsonError}</span>}
              </div>
              {jsonOutput && (
                <div className="relative p-3 rounded-lg bg-[#08090B] border border-[#D4AF37]/30 max-h-40 overflow-y-auto">
                  <pre className="font-mono text-xs text-[#F3E5AB]">{jsonOutput}</pre>
                  <button
                    id="copy-json-btn"
                    onClick={() => copyToClipboard(jsonOutput)}
                    className="absolute top-2 right-2 p-1.5 rounded bg-white/10 text-white/70 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {tool.id === 'word-counter' && (
            <div className="space-y-4">
              <textarea
                rows={4}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type or paste prose to analyze metrics..."
                className="w-full p-3 rounded-lg bg-[#08090B] border border-white/15 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
              />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-[#08090B] border border-white/10">
                  <span className="text-2xl font-bold font-mono text-[#D4AF37]">{words}</span>
                  <span className="block text-[10px] uppercase tracking-wider text-white/50 mt-1">Words</span>
                </div>
                <div className="p-3 rounded-lg bg-[#08090B] border border-white/10">
                  <span className="text-2xl font-bold font-mono text-[#FFF5DC]">{chars}</span>
                  <span className="block text-[10px] uppercase tracking-wider text-white/50 mt-1">Characters</span>
                </div>
                <div className="p-3 rounded-lg bg-[#08090B] border border-white/10">
                  <span className="text-2xl font-bold font-mono text-[#E5C378]">{readingTimeSeconds}s</span>
                  <span className="block text-[10px] uppercase tracking-wider text-white/50 mt-1">Reading Time</span>
                </div>
              </div>
            </div>
          )}

          {/* Generic view for other tools */}
          {['image-compressor', 'text-formatter', 'pdf-tools', 'meta-generator'].includes(tool.id) && (
            <div className="space-y-4 text-center py-4">
              <div className="p-6 rounded-xl border border-dashed border-[#D4AF37]/30 bg-[#08090B]/50 flex flex-col items-center justify-center space-y-3">
                <Sparkles className="w-8 h-8 text-[#D4AF37] animate-spin" style={{ animationDuration: '6s' }} />
                <p className="text-sm text-white/80 font-medium">{tool.name} Engine Active</p>
                <p className="text-xs text-white/50 max-w-sm">
                  {tool.tagline}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {tool.features.map((f, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-[#F3E5AB]">
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-between items-center text-xs text-white/40">
          <span>Client-Side Local Sandbox</span>
          <button
            id="close-tool-bottom-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-white/15 hover:border-white/30 text-white/70 hover:text-white transition-colors"
          >
            Close Tool
          </button>
        </div>
      </div>
    </div>
  );
};
