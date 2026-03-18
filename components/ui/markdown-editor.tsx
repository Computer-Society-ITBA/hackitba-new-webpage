"use client"

import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import { 
  Bold, Italic
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { marked } from "marked"
import TurndownService from "turndown"
import { gfm } from "turndown-plugin-gfm"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

// Configure Turndown for standard markdown output
const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**"
})
turndownService.use(gfm)

// Add rule to handle line breaks better from Tiptap
turndownService.addRule('hardBreak', {
  filter: 'br',
  replacement: () => "\n"
})

export function MarkdownEditor({ value, onChange, placeholder, className, disabled }: MarkdownEditorProps) {
  // Flag to prevent recursive updates
  const isUpdatingFromRef = React.useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
        emptyEditorClass: "is-editor-empty"
      }),
      Link.configure({
        openOnClick: false
      })
    ],
    content: marked.parse(value || ""), // Convert initial markdown to HTML
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (!isUpdatingFromRef.current) {
        const html = editor.getHTML()
        const markdown = turndownService.turndown(html)
        onChange(markdown)
      }
    },
    editable: !disabled,
    autofocus: false
  })

  // Synchronize external value with editor content
  React.useEffect(() => {
    if (editor && value !== undefined) {
      const currentHtml = editor.getHTML()
      const currentMarkdown = turndownService.turndown(currentHtml)
      
      // Update only if the markdown content has meaningfully changed
      if (value !== currentMarkdown) {
        isUpdatingFromRef.current = true
        editor.commands.setContent(marked.parse(value), false)
        isUpdatingFromRef.current = false
      }
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  const toolbarButtons = [
    { 
      icon: Bold, 
      label: "bold", 
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold")
    },
    { 
      icon: Italic, 
      label: "italic", 
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic")
    }
  ]

  return (
    <div className={cn(
      "flex flex-col rounded-md border border-brand-cyan/20 bg-brand-navy/30 overflow-hidden",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1 border-b border-brand-cyan/10 bg-brand-navy/50">
        {toolbarButtons.map((btn, idx) => {
          if (btn.type === "separator") {
            return <div key={idx} className="w-px h-6 bg-brand-cyan/10 mx-1" />
          }
          const Icon = btn.icon!
          return (
            <Button
              key={idx}
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={btn.onClick}
              disabled={disabled}
              className={cn(
                "size-8 transition-all duration-200",
                btn.isActive 
                  ? "text-brand-yellow bg-brand-cyan/20 ring-1 ring-brand-yellow/30" 
                  : "text-brand-cyan/70 hover:text-brand-yellow hover:bg-brand-cyan/10"
              )}
              title={btn.label}
            >
              <Icon className="size-4" />
            </Button>
          )
        })}
      </div>

      {/* Editor Content Area */}
      <EditorContent 
        editor={editor} 
        className={cn(
          "prose prose-invert max-w-none focus:outline-none min-h-[250px] max-h-[600px] py-4 px-6 text-brand-cyan overflow-y-auto",
          "prose-h1:font-pixel prose-h1:text-brand-yellow prose-h1:text-xl prose-h1:mb-2 prose-h1:mt-4",
          "prose-h2:font-pixel prose-h2:text-brand-yellow prose-h2:text-lg prose-h2:mb-2 prose-h2:mt-3",
          "prose-h3:font-pixel prose-h3:text-brand-yellow prose-h3:text-md prose-h3:mb-1 prose-h3:mt-2",
          "prose-p:text-brand-cyan prose-p:text-sm prose-p:leading-relaxed prose-p:my-2",
          "prose-strong:text-brand-yellow prose-strong:font-bold",
          "prose-em:text-brand-cyan prose-em:italic",
          "prose-ul:text-brand-cyan prose-ul:list-disc prose-ul:ml-4 prose-ul:my-2",
          "prose-ol:text-brand-cyan prose-ol:list-decimal prose-ol:ml-4 prose-ol:my-2",
          "prose-blockquote:border-l-4 prose-blockquote:border-brand-yellow/30 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-brand-cyan/70",
          "prose-li:my-0"
        )}
      />

      <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(0, 255, 255, 0.3);
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .tiptap:focus {
          outline: none;
        }
        .tiptap {
          min-height: 250px;
        }
      `}</style>
    </div>
  )
}
