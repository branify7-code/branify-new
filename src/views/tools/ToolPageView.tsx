import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, RotateCcw, Copy, Check, Download, Sparkles, UploadCloud, AlertTriangle, FileText, ImageIcon, ArrowLeft,
} from 'lucide-react';
import { getCompleteTool, defaultsFor } from '../../tools';
import { trackEvent } from '../../lib/track';
import type { ToolResult, ToolField } from '../../tools/types';

interface ToolPageViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

const fieldId = (name: string) => `tool-field-${name}`;

const ToolPageView: React.FC<ToolPageViewProps> = ({ slug, onNavigate }) => {
  const tool = getCompleteTool(slug);

  useEffect(() => {
    trackEvent('tool_page_view', { slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const [values, setValues] = useState<Record<string, string | number | boolean>>(() =>
    tool ? defaultsFor(tool.definition.fields) : {}
  );
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [resetTick, setResetTick] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tool) document.title = `${tool.metaTitle || tool.name} — BRANIFY`;
    return () => {
      document.title = 'Custom Web Development & Digital Agency | BRANIFY';
    };
  }, [tool]);

  useEffect(() => {
    // reset state when switching tools
    if (tool) {
      setValues(defaultsFor(tool.definition.fields));
      setFile(null);
      setDataUrl('');
      setResult(null);
      setRunError(null);
    }
  }, [tool?.slug]);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setRunError(null);
    const reader = new FileReader();
    reader.onload = () => setDataUrl(String(reader.result));
    reader.readAsDataURL(f);
  }, []);

  const handleReset = () => {
    if (!tool) return;
    setValues(defaultsFor(tool.definition.fields));
    setFile(null);
    setDataUrl('');
    setResult(null);
    setRunError(null);
    setResetTick((t) => t + 1);
  };

  const handleRun = async () => {
    if (!tool) return;
    if (tool.definition.requiresFile && !file) {
      setRunError(`Upload ${tool.inputType === 'image' ? 'an image' : 'a file'} first — click or drag it into the upload zone.`);
      setResult(null);
      return;
    }
    setRunning(true);
    setRunError(null);
    try {
      const ctx = {
        values,
        files: { file: file || undefined },
        dataUrls: { file: dataUrl || undefined },
      };
      const r = await tool.definition.run(ctx);
      setResult(r);
    } catch (e) {
      setResult(null);
      setRunError((e as Error).message || 'Tool execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const copyOutput = () => {
    const text = result?.output ?? (result?.json !== undefined ? JSON.stringify(result.json, null, 2) : '');
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadResult = () => {
    if (!result || !tool) return;
    let href: string | null = null;
    let name = result.downloadName || 'branify-output.txt';
    if (result.imageDataUrl) {
      href = result.imageDataUrl;
      name = result.downloadName || 'branify-image.png';
    } else if (result.downloadDataUrl) {
      href = result.downloadDataUrl;
    } else {
      const text = result.output ?? JSON.stringify(result.json ?? {}, null, 2);
      href = URL.createObjectURL(new Blob([text], { type: result.downloadMime || 'text/plain' }));
    }
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!tool) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="text-7xl">🧭</div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Tool Not Found</h1>
        <p className="text-zinc-400 text-sm">
          The tool <span className="text-[#F27D26] font-bold">/tools/{slug}</span> is not part of the 136-tool catalog.
        </p>
        <button
          onClick={() => onNavigate('/tools')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#F27D26] hover:bg-orange-500 text-black font-extrabold text-xs uppercase tracking-widest rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Browse All 136 Free Tools
        </button>
      </div>
    );
  }

  const { definition } = tool;
  const uploadKind: 'file' | 'image' | null =
    tool.inputType === 'file' ? 'file' : tool.inputType === 'image' ? 'image' : null;
  const textareas = definition.fields.filter((f) => f.type === 'textarea');
  const gridFields = definition.fields.filter((f) => f.type !== 'textarea');
  const hasInput = gridFields.length > 0 || textareas.length > 0 || uploadKind;
  const outputText = result?.output ?? (result?.json !== undefined ? JSON.stringify(result.json, null, 2) : '');

  const renderField = (f: ToolField) => {
    const base =
      'w-full px-3 py-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#F27D26]/60 transition-colors';
    switch (f.type) {
      case 'number':
        return (
          <div key={f.name} className="space-y-1.5">
            <label htmlFor={fieldId(f.name)} className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">{f.label}</label>
            <input
              id={fieldId(f.name)}
              type="number"
              value={String(values[f.name] ?? '')}
              min={f.min}
              max={f.max}
              step={f.step}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value === '' ? '' : Number(e.target.value) }))}
              className={base}
            />
            {f.hint && <p className="text-[10px] text-zinc-600">{f.hint}</p>}
          </div>
        );
      case 'text':
        return (
          <div key={f.name} className="space-y-1.5">
            <label htmlFor={fieldId(f.name)} className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">{f.label}</label>
            <input
              id={fieldId(f.name)}
              type="text"
              value={String(values[f.name] ?? '')}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              className={base}
            />
            {f.hint && <p className="text-[10px] text-zinc-600">{f.hint}</p>}
          </div>
        );
      case 'select':
        return (
          <div key={f.name} className="space-y-1.5">
            <label htmlFor={fieldId(f.name)} className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">{f.label}</label>
            <select
              id={fieldId(f.name)}
              value={String(values[f.name] ?? '')}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              className={`${base} appearance-none cursor-pointer`}
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value} className="bg-zinc-950">{o.label}</option>
              ))}
            </select>
            {f.hint && <p className="text-[10px] text-zinc-600">{f.hint}</p>}
          </div>
        );
      case 'checkbox':
        return (
          <label key={f.name} htmlFor={fieldId(f.name)} className="flex items-center gap-2.5 px-3 py-2.5 bg-zinc-950 border border-white/10 rounded-lg cursor-pointer hover:border-white/25 transition-colors">
            <input
              id={fieldId(f.name)}
              type="checkbox"
              checked={!!values[f.name]}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked }))}
              className="w-4 h-4 accent-[#F27D26] cursor-pointer"
            />
            <span className="text-[11px] font-bold text-zinc-300">{f.label}</span>
          </label>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="space-y-6" key={resetTick}>
        <button
          onClick={() => onNavigate('/tools')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to All 100+ Free Tools
        </button>

        {/* Tool header card */}
        <div className="bg-[#080808] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[#F27D26] text-[10px] font-extrabold uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                {tool.category} — Free Utility
              </div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">{tool.name}</h1>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{tool.description}</p>
            </div>
            <button
              onClick={handleReset}
              title="Reset Inputs"
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-extrabold text-zinc-300 uppercase tracking-widest">Input &amp; Configuration</label>

            {/* Upload zone */}
            {uploadKind && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                className={`relative flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                  dragOver ? 'border-[#F27D26] bg-[#F27D26]/5' : 'border-white/15 hover:border-[#F27D26]/50 bg-zinc-950/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={definition.accept}
                  className="sr-only"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                  key={resetTick}
                />
                {uploadKind === 'image' && dataUrl ? (
                  <img src={dataUrl} alt="Uploaded preview" className="max-h-40 rounded-lg border border-white/10" />
                ) : (
                  <UploadCloud className={`w-10 h-10 ${file ? 'text-[#F27D26]' : 'text-zinc-500'}`} />
                )}
                <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-200">
                  {file ? file.name : 'Click or drag file to upload'}
                </p>
                <p className="text-[10px] text-zinc-500">{definition.fileHint || 'Runs 100% locally in your browser'}</p>
                {file && (
                  <p className="text-[10px] text-emerald-400 font-bold">
                    {(file.size / 1024).toFixed(1)} KB loaded — ready to run
                  </p>
                )}
              </div>
            )}

            {/* Field grid */}
            {gridFields.length > 0 && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs ${uploadKind ? 'mt-4' : ''}`}>
                {gridFields.map(renderField)}
              </div>
            )}

            {/* Textareas full width */}
            {textareas.map((f) => (
              <div key={f.name} className="space-y-1.5 mt-3">
                <label htmlFor={fieldId(f.name)} className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">{f.label}</label>
                <textarea
                  id={fieldId(f.name)}
                  rows={f.rows || 8}
                  value={String(values[f.name] ?? '')}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-[#F27D26]/60 transition-colors resize-y"
                />
                {f.hint && <p className="text-[10px] text-zinc-600">{f.hint}</p>}
              </div>
            ))}

            {hasInput && <div className="h-1" />}

            <button
              onClick={handleRun}
              disabled={running}
              className="w-full py-4 bg-[#F27D26] hover:bg-orange-500 text-black font-extrabold text-xs sm:text-sm uppercase tracking-widest rounded-full shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
            >
              <Play className="w-4 h-4 fill-current" />
              {running ? 'Running…' : `Run ${tool.name}`}
            </button>
          </div>
        </div>

        {/* Output */}
        {(result || runError) && (
          <div className="bg-[#080808] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-zinc-300 uppercase tracking-widest">Tool Output Result</label>
              <div className="flex items-center gap-2">
                {runError && (
                  <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" /> Error
                  </span>
                )}
                {result && !runError && (
                  <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                    <Check className="w-3.5 h-3.5" /> Completed
                  </span>
                )}
                {result?.imageDataUrl && (
                  <button
                    onClick={downloadResult}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Image
                  </button>
                )}
                {result?.downloadDataUrl && (
                  <button
                    onClick={downloadResult}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download {result.downloadMime === 'application/pdf' ? 'PDF' : 'File'}
                  </button>
                )}
                <button
                  onClick={copyOutput}
                  disabled={!outputText}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-white flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>
            </div>

            {runError ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {runError}
              </div>
            ) : result && (
              <>
                {result.imageDataUrl && (
                  <div className="flex justify-center p-4 bg-[#050505] rounded-xl border border-white/10">
                    <img src={result.imageDataUrl} alt={`${tool.name} output`} className="max-w-full max-h-96 rounded-lg" />
                  </div>
                )}

                {result.json !== undefined && (
                  <pre className="p-4 rounded-xl bg-[#050505] border border-white/10 text-emerald-300/90 text-[11px] leading-relaxed font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre">
                    {JSON.stringify(result.json, null, 2)}
                  </pre>
                )}

                {result.output && (
                  <div className={`p-4 rounded-xl bg-[#050505] border border-white/10 ${tool.outputType === 'styled' ? '' : ''}`}>
                    {tool.outputType === 'styled' ? (
                      <div className="space-y-1.5">
                        {result.output.split('\n').map((line, i) => {
                          const trimmed = line.trim();
                          const isBullet = trimmed.startsWith('•');
                          const isKv = /^[^:]{2,42}: /.test(trimmed) && !isBullet;
                          const isSection = /^(KEY TAKEAWAYS|TOP CONTENT WORDS|FIELD BREAKDOWN|SOCIAL MEDIA|[A-Z][A-Z &/'-]{4,})$/.test(trimmed);
                          const isCodeLine = /^[<{[]|^(background-image|Content-Security-Policy|<script|<link|<meta|<IfModule|Redirect|RewriteRule|const |function |SELECT|INSERT|UPDATE|<!DOCTYPE|<?xml)/i.test(trimmed);
                          if (isSection) {
                            return (
                              <p key={i} className="text-[10px] font-extrabold uppercase tracking-widest text-[#F27D26] pt-2">{trimmed}</p>
                            );
                          }
                          if (isCodeLine || tool.outputType === 'textarea' || tool.outputType === 'text' || tool.outputType === 'file') {
                            return (
                              <pre key={i} className="font-mono text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap break-all">{line || ' '}</pre>
                            );
                          }
                          if (isKv) {
                            const idx = trimmed.indexOf(': ');
                            return (
                              <p key={i} className="text-xs text-zinc-300 flex flex-wrap gap-x-2">
                                <span className="font-extrabold text-white uppercase tracking-wide text-[11px]">{trimmed.slice(0, idx)}:</span>
                                <span className="text-zinc-200">{trimmed.slice(idx + 2)}</span>
                              </p>
                            );
                          }
                          if (isBullet) {
                            const idx = trimmed.indexOf(': ');
                            if (idx > 1) {
                              return (
                                <p key={i} className="text-xs text-zinc-300 flex flex-wrap gap-x-2 pl-1">
                                  <span className="font-extrabold text-white text-[11px]">{trimmed.slice(0, idx)}:</span>
                                  <span className="text-zinc-200">{trimmed.slice(idx + 2)}</span>
                                </p>
                              );
                            }
                            return <p key={i} className="text-xs text-zinc-200">{trimmed}</p>;
                          }
                          return (
                            <p key={i} className="text-xs text-zinc-300 whitespace-pre-wrap">{line || '\u00A0'}</p>
                          );
                        })}
                      </div>
                    ) : (
                      <pre className="font-mono text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap break-all max-h-96 overflow-y-auto">{result.output}</pre>
                    )}
                  </div>
                )}

                {result.note && (
                  <p className="text-[10px] text-zinc-500 italic flex items-start gap-1.5">
                    <FileText className="w-3 h-3 mt-0.5 shrink-0" /> {result.note}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Privacy strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-[#F27D26]/60" /> 100% Local Processing</span>
          <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5 text-[#F27D26]/60" /> No Sign-Up Required</span>
          <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-[#F27D26]/60" /> Instant Free Results</span>
        </div>
      </div>
    </div>
  );
};

export default ToolPageView;
