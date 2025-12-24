"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"

const mockCharacters = [
  { id: 1, name: "Emma", photo: "/happy-child.jpg" },
  { id: 2, name: "Liam", photo: "/smiling-kid.jpg" },
]

interface GenerateStoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  story: {
    title: string
    description: string
    scenes: number
  }
}

export function GenerateStoryDialog({ open, onOpenChange, story }: GenerateStoryDialogProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string>("")

  const handleGenerate = () => {
    // Handle story generation
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Generate Story
          </DialogTitle>
          <DialogDescription>
            Create a personalized version of <strong>{story.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <Card className="p-3 bg-accent/50">
            <p className="text-sm">{story.description}</p>
            <p className="text-xs text-muted-foreground mt-2">{story.scenes} scenes will be generated</p>
          </Card>

          <div className="space-y-3">
            <Label>Select Character</Label>
            <RadioGroup value={selectedCharacter} onValueChange={setSelectedCharacter}>
              <div className="space-y-2">
                {mockCharacters.map((character) => (
                  <Card key={character.id} className="p-3 cursor-pointer hover:border-primary transition-colors">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <RadioGroupItem value={character.id.toString()} id={`char-${character.id}`} />
                      <img
                        src={character.photo || "/placeholder.svg"}
                        alt={character.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                      />
                      <span className="font-medium">{character.name}</span>
                    </label>
                  </Card>
                ))}
              </div>
            </RadioGroup>

            {mockCharacters.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No characters available. Please create a character first.
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">What happens next?</h4>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Your story will be generated in the background</li>
              <li>You'll get a notification when it's ready</li>
              <li>Generation typically takes 5-10 minutes</li>
              <li>You can close the app during generation</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={!selectedCharacter}
              onClick={handleGenerate}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Generate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
