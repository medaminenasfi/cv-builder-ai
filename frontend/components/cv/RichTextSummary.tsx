'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface RichTextSummaryProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextSummary({ value, onChange, placeholder }: RichTextSummaryProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value ? `<p>${value.replace(/\n/g, '<br>')}</p>` : '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[96px] w-full border border-purple-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getText());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value?.trim() ? value : '<p></p>';
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <textarea
        value={value.replace(/<[^>]+>/g, '')}
        onChange={(e) => onChange(`<p>${e.target.value}</p>`)}
        rows={4}
        className="w-full border border-purple-100 rounded-lg px-3 py-2 text-sm"
        placeholder={placeholder}
      />
    );
  }

  return (
    <div>
      <EditorContent editor={editor} />
      {!value?.replace(/<[^>]+>/g, '').trim() && placeholder && (
        <p className="text-[10px] text-gray-400 mt-1">{placeholder}</p>
      )}
    </div>
  );
}
