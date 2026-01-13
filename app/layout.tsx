import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { QueryProvider } from "@/lib/providers/query-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Twinklebot - Personalized Storybooks for Kids",
  description: "Create magical AI-generated storybooks where your child is the hero",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Twinklebot - Personalized Storybooks for Kids",
    description: "Create magical AI-generated storybooks where your child is the hero",
    type: "website",
    images: [
      {
        url: "/apple-icon.png",
        width: 180,
        height: 180,
        alt: "Twinklebot Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Twinklebot - Personalized Storybooks for Kids",
    description: "Create magical AI-generated storybooks where your child is the hero",
    images: ["/apple-icon.png"],
  },
  generator: 'v0.app'
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#8B5CF6",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
