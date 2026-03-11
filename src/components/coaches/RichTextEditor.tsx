"use client";
import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Heading3, Undo2, Redo2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/10">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Fett">
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Kursiv">
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Überschrift">
          <Heading3 className="w-4 h-4" />
        </ToolbarBtn>
        <div className="w-px self-stretch bg-border mx-0.5" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Aufzählung">
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Nummerierte Liste">
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>
        <div className="w-px self-stretch bg-border mx-0.5" />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Rückgängig">
          <Undo2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Wiederholen">
          <Redo2 className="w-4 h-4" />
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <div className="[&_.ProseMirror]:min-h-[160px] [&_.ProseMirror]:p-3 [&_.ProseMirror]:outline-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-5 [&_.ProseMirror_li]:mb-0.5 [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:mb-1 [&_.ProseMirror_p]:mb-1 text-sm bg-background">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors select-none ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
