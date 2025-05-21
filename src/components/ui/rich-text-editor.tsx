
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [previewMode, setPreviewMode] = useState(false);

  const insertFormatting = (startTag: string, endTag: string) => {
    // Obter o elemento textarea
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    // Se texto foi selecionado, envolva-o com as tags
    if (selectedText) {
      const newText = value.substring(0, start) + 
                      startTag + selectedText + endTag + 
                      value.substring(end);
      onChange(newText);
      
      // Restaurar a seleção após a atualização
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + startTag.length, 
          start + startTag.length + selectedText.length
        );
      }, 0);
    } else {
      // Se nenhum texto foi selecionado, apenas insira as tags
      const newText = value.substring(0, start) + startTag + endTag + value.substring(end);
      onChange(newText);
      
      // Posicionar o cursor entre as tags
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + startTag.length, start + startTag.length);
      }, 0);
    }
  };

  const handleBold = () => insertFormatting("**", "**");
  const handleItalic = () => insertFormatting("*", "*");
  const handleAlignLeft = () => insertFormatting("\n<div style='text-align: left'>", "</div>\n");
  const handleAlignCenter = () => insertFormatting("\n<div style='text-align: center'>", "</div>\n");
  const handleAlignRight = () => insertFormatting("\n<div style='text-align: right'>", "</div>\n");

  const renderMarkdown = (text: string) => {
    // Very basic markdown rendering for preview
    // In a real app, you would use a proper markdown library
    const html = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
    
    return html;
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-1 p-1 border rounded-md bg-background">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={handleBold}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={handleItalic}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={handleAlignLeft}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={handleAlignCenter}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={handleAlignRight}
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? "Edit" : "Preview"}
        </Button>
      </div>

      {previewMode ? (
        <div 
          className="min-h-[300px] p-4 border rounded-md prose max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Write your content in Markdown..."}
          className="min-h-[300px] font-mono"
        />
      )}
    </div>
  );
}
