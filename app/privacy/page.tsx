import fs from "fs"
import path from "path"
import { MarkdownPage } from "@/components/markdown-page"

export const metadata = {
  title: "Privacy Policy - Twinklebot",
}

export default function PrivacyPage() {
  const content = fs.readFileSync(
    path.join(process.cwd(), "content", "privacy-policy.md"),
    "utf-8"
  )

  return <MarkdownPage content={content} title="Privacy Policy" />
}
