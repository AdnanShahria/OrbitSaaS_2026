import { useRef, useCallback, useEffect, useState } from 'react';
import { Bold, Italic, Highlighter, Palette, Type, Minus } from 'lucide-react';

const COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fdcb6e', '#e84393', '#ffffff', '#a0a0a0'];

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    label?: string;
    placeholder?: string;
    lang?: string;
}

import { AIEnhanceButton } from './EditorComponents';

export function RichTextEditor({ value, onChange, label, placeholder, lang }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showColors, setShowColors] = useState(false);
    const [wordCount, setWordCount] = useState(0);

    // Sync value into editor on mount / external change
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
        updateWordCount(value);
    }, [value]);

    const updateWordCount = (html: string) => {
        const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
        setWordCount(text ? text.split(/\s+/).length : 0);
    };

    const handleInput = useCallback(() => {
        const html = editorRef.current?.innerHTML || '';
        onChange(html);
        updateWordCount(html);
    }, [onChange]);

    const exec = (cmd: string, val?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
        handleInput();
    };

    const ToolButton = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
        <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${active ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
        >
            {children}
        </button>
    );

    return (
        <div>
            {label && (
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">{label}</label>
                        {lang && (
                            <AIEnhanceButton
                                text={value}
                                lang={lang}
                                onEnhanced={onChange}
                            />
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{wordCount} words</span>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-0.5 p-1.5 bg-secondary/50 rounded-t-lg border border-border border-b-0">
                <ToolButton onClick={() => exec('bold')} title="Bold">
                    <Bold className="w-3.5 h-3.5" />
                </ToolButton>
                <ToolButton onClick={() => exec('italic')} title="Italic">
                    <Italic className="w-3.5 h-3.5" />
                </ToolButton>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolButton onClick={() => exec('hiliteColor', '#fdcb6e')} title="Highlight Yellow">
                    <Highlighter className="w-3.5 h-3.5" />
                </ToolButton>
                <div className="relative">
                    <ToolButton onClick={() => setShowColors(!showColors)} title="Text Color">
                        <Palette className="w-3.5 h-3.5" />
                    </ToolButton>
                    {showColors && (
                        <div className="absolute top-full left-0 mt-1 p-1.5 bg-card border border-border rounded-lg shadow-xl z-20 flex gap-1">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => { exec('foreColor', c); setShowColors(false); }}
                                    className="w-5 h-5 rounded-full border border-border hover:scale-125 transition-transform cursor-pointer"
                                    style={{ background: c }}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolButton onClick={() => exec('formatBlock', 'h3')} title="Heading">
                    <Type className="w-3.5 h-3.5" />
                </ToolButton>
                <ToolButton onClick={() => exec('insertHorizontalRule')} title="Divider">
                    <Minus className="w-3.5 h-3.5" />
                </ToolButton>
                <ToolButton onClick={() => exec('removeFormat')} title="Clear Formatting">
                    <span className="text-xs font-bold">×</span>
                </ToolButton>
            </div>

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={handleInput}
                data-placeholder={placeholder || 'Write project description...'}
                className="min-h-[160px] max-h-[400px] overflow-y-auto p-4 bg-secondary rounded-b-lg border border-border text-sm text-foreground leading-relaxed outline-none focus:ring-2 focus:ring-primary/30 [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&_b]:font-bold [&_i]:italic [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_hr]:my-3 [&_hr]:border-border"
            />
        </div>
    );
}
