import type { Document } from "@/types/database"

export function getRelevantDocumentContext(
  documents: Document[],
  userMessage: string,
  maxChars: number = 8000
): string {
  if (!documents.length) return "No company documents uploaded yet."

  // MVP keyword matching: score each document by keyword overlap
  const keywords = userMessage
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)

  const scored = documents.map((doc) => {
    const text = (doc.content_text || "").toLowerCase()
    const score = keywords.reduce(
      (acc, kw) => acc + (text.includes(kw) ? 1 : 0),
      0
    )
    return { doc, score }
  })

  // Sort by relevance, take top documents until maxChars
  scored.sort((a, b) => b.score - a.score)

  let context = ""
  for (const { doc } of scored) {
    if (!doc.content_text) continue
    const chunk = `\n--- ${doc.name} (${doc.doc_type}) ---\n${doc.content_text}\n`
    if (context.length + chunk.length > maxChars) break
    context += chunk
  }

  return context || "No relevant documents found."
}
