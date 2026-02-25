import fs from "fs"
import path from "path"
import { MarkdownPage } from "@/components/markdown-page"

export const metadata = {
  title: "Terms of Service - Twinklebot",
}

export default function TermsPage() {
  const content = fs.readFileSync(
    path.join(process.cwd(), "content", "terms-of-service.md"),
    "utf-8"
  )

  return <MarkdownPage content={content} title="Terms of Service" />
}
