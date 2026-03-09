import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Lora } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { QueryProvider } from "@/lib/providers/query-provider"
import { CapacitorInitializer } from "@/components/capacitor-initializer"
import { Toaster } from "sonner"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _lora = Lora({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-display" })

const siteUrl = "https://twinklebot.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Twinklebot - Personalized Storybooks for Kids",
    template: "%s | Twinklebot",
  },
  description: "Create magical AI-generated storybooks where your child is the hero. Upload a photo, pick a story, and watch AI bring it to life with your child as the main character.",
  keywords: ["personalized storybooks", "AI storybooks", "kids books", "custom children's books", "personalized books for kids", "AI generated stories", "educational stories for kids"],
  authors: [{ name: "Twinklebot" }],
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Twinklebot - Personalized Storybooks for Kids",
    description: "Create magical AI-generated storybooks where your child is the hero. Upload a photo, pick a story, and watch AI bring it to life.",
    type: "website",
    url: siteUrl,
    siteName: "Twinklebot",
    locale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Parent and child reading a personalized Twinklebot storybook",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Twinklebot - Personalized Storybooks for Kids",
    description: "Create magical AI-generated storybooks where your child is the hero.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
  themeColor: "#8B5CF6",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased ${_lora.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "Twinklebot",
                  url: siteUrl,
                  description: "Create magical AI-generated storybooks where your child is the hero.",
                },
                {
                  "@type": "Organization",
                  name: "Twinklebot",
                  url: siteUrl,
                  logo: `${siteUrl}/logo.png`,
                  sameAs: [],
                },
                {
                  "@type": "SoftwareApplication",
                  name: "Twinklebot",
                  applicationCategory: "EducationalApplication",
                  operatingSystem: "iOS, Android, Web",
                  description: "AI-powered personalized storybooks where your child is the hero.",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                },
              ],
            }),
          }}
        />
        <CapacitorInitializer />
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
        <Toaster position="top-center" duration={3000} theme="dark" />
        <Analytics />
      </body>
    </html>
  )
}
