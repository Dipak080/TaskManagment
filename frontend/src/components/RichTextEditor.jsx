import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Heading2 } from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const btnStyle = (active) => ({
    padding: '6px',
    background: active ? 'var(--blue-dim)' : 'transparent',
    color: active ? 'var(--blue)' : 'var(--text1)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease',
  });

  return (
    <div style={{ display: 'flex', gap: '4px', padding: '8px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-card)', flexWrap: 'wrap' }}>
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btnStyle(editor.isActive('bold'))} title="Bold">
        <Bold size={16} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btnStyle(editor.isActive('italic'))} title="Italic">
        <Italic size={16} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} style={btnStyle(editor.isActive('strike'))} title="Strikethrough">
        <Strikethrough size={16} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} style={btnStyle(editor.isActive('code'))} title="Code">
        <Code size={16} />
      </button>

      <div style={{ width: '1px', background: 'var(--border-light)', margin: '0 4px' }} />

      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btnStyle(editor.isActive('heading'))} title="Heading">
        <Heading2 size={16} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={btnStyle(editor.isActive('bulletList'))} title="Bullet List">
        <List size={16} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btnStyle(editor.isActive('orderedList'))} title="Numbered List">
        <ListOrdered size={16} />
      </button>

      <div style={{ width: '1px', background: 'var(--border-light)', margin: '0 4px' }} />

      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btnStyle(editor.isActive('blockquote'))} title="Quote">
        <Quote size={16} />
      </button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-text-content',
        style: 'min-height: 120px; padding: 12px; outline: none; font-size: 14px; color: var(--text1); line-height: 1.5; background: var(--bg-body); border-bottom-left-radius: 6px; border-bottom-right-radius: 6px;',
      }
    }
  });

  // Sync external value changes (e.g. parent clearing the field after posting)
  // back into the editor. We skip when content already matches to avoid cursor
  // jumps while the user is typing.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '';
    if (next === current) return;
    // Treat empty value as a true reset (TipTap reports empty as "<p></p>").
    if (next === '' && current === '<p></p>') return;
    editor.commands.setContent(next, false);
  }, [value, editor]);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
