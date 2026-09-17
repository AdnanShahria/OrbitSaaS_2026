import { useRef, useCallback, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link2, Unlink, Highlighter, Palette, Type, Minus } from 'lucide-react';
import { AIEnhanceButton } from './EditorComponents';

const COLORS = ['#10b981', '#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fdcb6e', '#e84393', '#ffffff', '#a0a0a0'];

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    label?: string;
    placeholder?: string;
    lang?: string;
}

export function RichTextEditor({ value, onChange, label, placeholder, lang }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showColors, setShowColors] = useState(false);
    const [wordCount, setWordCount] = useState(0);

    // Sync value into editor on mount / external change
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
        updateWordCount(value || '');
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

    const handleAddLink = () => {
        const selection = window.getSelection();
        const selectedText = selection?.toString() || '';
        const url = window.prompt('Enter link URL (e.g. https://...):', 'https://');
        if (url && url.trim()) {
            exec('createLink', url.trim());
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData('text/plain');
        const html = e.clipboardData.getData('text/html');

        // If plain text with multiple lines or paragraphs is pasted, format cleanly
        if (!html && text && text.includes('\n')) {
            e.preventDefault();
            const paragraphs = text
                .split(/\n\s*\n/)
                .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
                .join('');
            document.execCommand('insertHTML', false, paragraphs);
            handleInput();
        }
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
        <div className="w-full">
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
            <div className="flex items-center flex-wrap gap-0.5 p-1.5 bg-secondary/60 rounded-t-lg border border-border border-b-0">
                <ToolButton onClick={() => exec('bold')} title="Bold (Ctrl+B)">
                    <Bold className="w-3.5 h-3.5" />
                </ToolButton>
                <ToolButton onClick={() => exec('italic')} title="Italic (Ctrl+I)">
                    <Italic className="w-3.5 h-3.5" />
                </ToolButton>
                <ToolButton onClick={() => exec('underline')} title="Underline (Ctrl+U)">
                    <Underline className="w-3.5 h-3.5" />
                </ToolButton>

                <div className="w-px h-5 bg-border mx-1" />

                <ToolButton onClick={() => exec('insertUnorderedList')} title="Bulleted List">
                    <List className="w-3.5 h-3.5" />
                </ToolButton>
                <ToolButton onClick={() => exec('insertOrderedList')} title="Numbered List">
                    <ListOrdered className="w-3.5 h-3.5" />
                </ToolButton>

                <div className="w-px h-5 bg-border mx-1" />

                <ToolButton onClick={handleAddLink} title="Insert Link">
                    <Link2 className="w-3.5 h-3.5" />
                </ToolButton>
                <ToolButton onClick={() => exec('unlink')} title="Remove Link">
                    <Unlink className="w-3.5 h-3.5" />
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
                        <div className="absolute top-full left-0 mt-1 p-1.5 bg-card border border-border rounded-lg shadow-xl z-30 flex gap-1">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
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

                <ToolButton onClick={() => exec('formatBlock', 'h3')} title="Section Heading (H3)">
                    <Type className="w-3.5 h-3.5" />
                </ToolButton>
                <ToolButton onClick={() => exec('insertHorizontalRule')} title="Horizontal Divider">
                    <Minus className="w-3.5 h-3.5" />
                </ToolButton>
                <ToolButton onClick={() => exec('removeFormat')} title="Clear Formatting">
                    <span className="text-xs font-bold leading-none">×</span>
                </ToolButton>
            </div>

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={handleInput}
                onPaste={handlePaste}
                data-placeholder={placeholder || 'Write description with proper formatting, spaces, bold, links, and paragraphs...'}
                className="min-h-[180px] max-h-[450px] overflow-y-auto p-4 bg-secondary/30 rounded-b-lg border border-border text-sm text-foreground leading-relaxed outline-none focus:ring-2 focus:ring-primary/30 [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/60 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_u]:underline [&_h3]:text-base sm:[&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-primary [&_h3]:mt-4 [&_h3]:mb-1.5 [&_hr]:my-3.5 [&_hr]:border-border [&_p]:mb-3.5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3.5 [&_li]:mb-1 [&_a]:text-emerald-500 [&_a]:underline font-normal"
            />
        </div>
    );
}
