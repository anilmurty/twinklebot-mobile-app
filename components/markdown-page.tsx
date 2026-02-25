"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownPageProps {
  content: string
  title: string
}

export function MarkdownPage({ content, title }: MarkdownPageProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="font-semibold text-lg truncate">{title}</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-12">
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none
          prose-headings:text-foreground
          prose-p:text-foreground/90
          prose-strong:text-foreground
          prose-a:text-primary
          prose-li:text-foreground/90
          prose-th:text-foreground
          prose-td:text-foreground/80
          prose-table:text-sm
          prose-hr:border-border
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
