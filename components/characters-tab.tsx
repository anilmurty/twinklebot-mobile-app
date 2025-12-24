"use client"

import { Plus, Edit, Trash2, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { CreateCharacterDialog } from "@/components/create-character-dialog"

const mockCharacters = [
  {
    id: 1,
    name: "Emma",
    photo: "/happy-child-portrait.png",
    storiesCount: 3,
  },
  {
    id: 2,
    name: "Liam",
    photo: "/smiling-kid-photo.jpg",
    storiesCount: 1,
  },
]

export function CharactersTab() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div className="min-h-full bg-gradient-to-b from-secondary/20 to-background">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Characters</h1>
          <p className="text-muted-foreground">Your storybook heroes</p>
        </div>

        <Button
          onClick={() => setShowCreateDialog(true)}
          className="w-full h-auto py-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Create New Character</span>
        </Button>

        <div className="grid gap-4">
          {mockCharacters.map((character) => (
            <Card key={character.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex gap-4 p-4">
                <div className="relative shrink-0">
                  <img
                    src={character.photo || "/placeholder.svg"}
                    alt={character.name}
                    className="w-20 h-20 object-cover rounded-full border-4 border-primary/20"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-bold text-xl">{character.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {character.storiesCount} {character.storiesCount === 1 ? "story" : "stories"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-destructive hover:bg-destructive/10 bg-transparent"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {mockCharacters.length > 0 && (
          <Card className="p-4 bg-accent/50 border-accent">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Ready to create a story?</h4>
                <p className="text-xs text-muted-foreground">
                  Visit the <strong>Story Library</strong> tab to select a story template and generate your personalized
                  storybook!
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <CreateCharacterDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  )
}
