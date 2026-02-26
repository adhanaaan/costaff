"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Trash2, Upload } from "lucide-react"
import { deleteDocument } from "./actions"
import type { Document } from "@/types/database"

interface KnowledgeBaseProps {
  documents: Document[]
  workspaceId: string
}

export function KnowledgeBase({ documents: initialDocs, workspaceId }: KnowledgeBaseProps) {
  const [documents, setDocuments] = useState(initialDocs)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.append("workspace_id", workspaceId)

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setDocuments((prev) => [data.document, ...prev])
        form.reset()
      }
    } catch {
      setError("Upload failed")
    }
    setUploading(false)
  }

  async function handleDelete(id: string) {
    const result = await deleteDocument(id)
    if (result.error) {
      setError(result.error)
    } else {
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File (.txt, .md)</Label>
              <Input id="file" name="file" type="file" accept=".txt,.md,.text" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc_type">Document Type</Label>
              <Select id="doc_type" name="doc_type">
                <option value="other">Other</option>
                <option value="pitch_deck">Pitch Deck</option>
                <option value="brand_guide">Brand Guidelines</option>
                <option value="product_spec">Product Spec</option>
                <option value="sop">SOP</option>
              </Select>
            </div>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Document list */}
      <div className="space-y-3">
        {documents.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No documents uploaded yet. Upload company docs to give your AI context.
          </p>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.content_text
                        ? `${doc.content_text.length.toLocaleString()} chars`
                        : "No text extracted"}
                      {" · "}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{doc.doc_type}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
