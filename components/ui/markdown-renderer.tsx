import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("text-brand-cyan max-w-none space-y-3", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ ...props }) => <h1 className="font-pixel text-brand-yellow text-xl sm:text-2xl mb-4 mt-6" {...props} />,
          h2: ({ ...props }) => <h2 className="font-pixel text-brand-yellow text-lg sm:text-xl mb-3 mt-5" {...props} />,
          h3: ({ ...props }) => <h3 className="font-pixel text-brand-yellow text-md sm:text-lg mb-2 mt-4" {...props} />,
          p: ({ ...props }) => <p className="text-brand-cyan text-sm sm:text-base leading-relaxed mb-3" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
          li: ({ ...props }) => <li className="text-brand-cyan text-sm sm:text-base" {...props} />,
          a: ({ ...props }) => <a className="text-brand-orange underline hover:text-brand-orange/80 transition-colors" target="_blank" rel="noreferrer" {...props} />,
          blockquote: ({ ...props }) => <blockquote className="border-l-4 border-brand-yellow/30 pl-4 py-1 italic text-brand-cyan/80 bg-brand-navy/20 rounded-r my-4" {...props} />,
          code: ({ ...props }) => {
            const isInline = !props.className?.includes('language-');
            return isInline 
              ? <code className="text-brand-yellow bg-brand-navy/50 px-1.5 py-0.5 rounded text-sm" {...props} />
              : <code className="block text-brand-yellow bg-black/60 p-4 rounded-lg border border-brand-cyan/20 overflow-x-auto my-4 text-sm font-mono whitespace-pre" {...props} />;
          },
          hr: () => <hr className="border-brand-cyan/10 my-6" />,
          table: ({ ...props }) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse" {...props} /></div>,
          th: ({ ...props }) => <th className="border border-brand-cyan/20 p-2 bg-brand-navy/60 text-brand-yellow text-left text-xs uppercase" {...props} />,
          td: ({ ...props }) => <td className="border border-brand-cyan/20 p-2 text-brand-cyan/80 text-sm" {...props} />,
          strong: ({ ...props }) => <strong className="text-brand-yellow font-bold" {...props} />,
          em: ({ ...props }) => <em className="text-brand-cyan italic" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
