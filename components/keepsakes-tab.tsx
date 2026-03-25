"use client"

import { useState, useEffect } from "react"
import { Gift, BookOpen, Image, Coffee, Puzzle, Star, Printer } from "lucide-react"
import { createClient } from "@/lib/supabase/client-browser"

const PRODUCTS = [
  {
    id: "hardcover_book",
    icon: BookOpen,
    name: "Hardcover storybook",
    desc: "Full story, professionally bound",
    badge: "Most wanted",
  },
  {
    id: "framed_print",
    icon: Image,
    name: "Framed scene print",
    desc: "Any scene, ready to hang",
    badge: "High interest",
  },
  {
    id: "mug",
    icon: Coffee,
    name: "Character mug",
    desc: "Your child's hero on a mug",
    badge: "Popular",
  },
  {
    id: "puzzle",
    icon: Puzzle,
    name: "Scene puzzle",
    desc: "250 or 500 piece jigsaw",
    badge: null,
  },
  {
    id: "pillowcase",
    icon: Star,
    name: "Pillowcase",
    desc: "Favourite scene for bedtime",
    badge: null,
  },
  {
    id: "poster",
    icon: Printer,
    name: "Poster print",
    desc: "Gallery-quality wall art",
    badge: null,
  },
]

export function KeepsakesTab() {
  const supabase = createClient()

  const [hasOptedIn, setHasOptedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [votes, setVotes] = useState<Record<string, "yes" | "no">>({})
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadState() {
      if (!supabase) { setLoading(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from("keepsakes_interest")
        .select("product_votes")
        .eq("user_id", user.id)
        .maybeSingle()

      if (data) {
        setHasOptedIn(true)
        setVotes(data.product_votes ?? {})
      }
      setLoading(false)
    }
    loadState()
  }, [])

  async function handleOptIn() {
    if (hasOptedIn || saving || !supabase) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { count } = await supabase
      .from("storybooks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    await supabase.from("keepsakes_interest").insert({
      user_id: user.id,
      story_count_at_signup: count ?? 0,
    })

    setHasOptedIn(true)
    setSaving(false)
  }

  async function handleVote(productId: string, vote: "yes" | "no") {
    if (!supabase) return
    const newVote = votes[productId] === vote ? undefined : vote
    const newVotes = { ...votes }
    if (newVote) newVotes[productId] = newVote
    else delete newVotes[productId]

    setVotes(newVotes)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("keepsakes_interest")
      .update({ product_votes: newVotes })
      .eq("user_id", user.id)
  }

  const selected = PRODUCTS.find(p => p.id === selectedProduct)

  return (
    <div className="min-h-full bg-background pb-8">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-card border-b border-border">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative px-5 pt-6 pb-7 max-w-md mx-auto">
          <div className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full mb-3 tracking-wide uppercase">
            Coming Soon
          </div>

          <h1 className="text-2xl font-bold text-foreground leading-tight mb-2 font-serif">
            Turn your story<br />into something real
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            Order printed books, photos, and keepsakes featuring your child as the hero.
          </p>

          <button
            onClick={handleOptIn}
            disabled={saving || loading}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
              hasOptedIn
                ? "bg-muted text-foreground cursor-default"
                : "bg-primary text-primary-foreground active:scale-95"
            }`}
          >
            {hasOptedIn ? "\u2713  You're on the list!" : "Notify me when it launches"}
          </button>

          <p className="text-center text-xs text-muted-foreground mt-2">
            {hasOptedIn ? "We'll send one email when it's ready." : "Join families already interested"}
          </p>
        </div>
      </div>

      {/* Product grid */}
      <div className="px-4 pt-5 max-w-md mx-auto">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">What's coming</h2>
          <span className="text-xs text-muted-foreground">Tap to vote</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PRODUCTS.map((product) => {
            const Icon = product.icon
            const isSelected = selectedProduct === product.id
            return (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(isSelected ? null : product.id)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? "border-primary bg-card"
                    : "border-border bg-card hover:border-muted-foreground"
                }`}
              >
                <Icon className="w-7 h-7 text-primary mb-2" />
                <p className="text-sm font-medium text-foreground leading-tight mb-0.5">
                  {product.name}
                </p>
                <p className="text-xs text-muted-foreground leading-snug">
                  {product.desc}
                </p>
                {product.badge && (
                  <span className="inline-block mt-2 text-xs bg-muted text-primary px-2 py-0.5 rounded-full font-medium">
                    {product.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Inline detail + vote panel */}
      {selected && (
        <div className="mx-4 mt-3 max-w-md mx-auto p-4 bg-card border border-primary/40 rounded-xl">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">{selected.name}</p>
            <button
              onClick={() => setSelectedProduct(null)}
              className="text-muted-foreground text-lg leading-none ml-2"
            >
              &times;
            </button>
          </div>

          {hasOptedIn ? (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleVote(selected.id, "yes")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                  votes[selected.id] === "yes"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                Want this
              </button>
              <button
                onClick={() => handleVote(selected.id, "no")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                  votes[selected.id] === "no"
                    ? "bg-muted text-foreground border-muted-foreground"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                Not for me
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Opt in above to vote on products.
            </p>
          )}
        </div>
      )}

      {/* Footer note */}
      <div className="mx-4 mt-5 max-w-md mx-auto p-4 bg-muted rounded-xl">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Your interest helps us prioritize what to build first.
          We'll send one email when we launch — no spam.
        </p>
      </div>
    </div>
  )
}
