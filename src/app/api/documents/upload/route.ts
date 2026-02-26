import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File
  const docType = (formData.get("doc_type") as string) || "other"

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // Get workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("founder_id", user.id)
    .single()

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  // Upload to Supabase Storage
  const filePath = `${workspace.id}/${Date.now()}-${file.name}`
  await supabase.storage.from("documents").upload(filePath, file)

  // Extract text content
  let contentText = ""
  const fileName = file.name.toLowerCase()
  if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".text")) {
    contentText = await file.text()
  } else {
    contentText = `[File: ${file.name} - text extraction not available for this format]`
  }

  // Truncate to 50k chars
  contentText = contentText.slice(0, 50000)

  // Save document record
  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      workspace_id: workspace.id,
      name: file.name,
      file_path: filePath,
      content_text: contentText,
      doc_type: docType,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ document })
}
