"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteDocument(documentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // Get document to find storage path
  const { data: doc } = await supabase
    .from("documents")
    .select("file_path, workspace_id")
    .eq("id", documentId)
    .single()

  if (!doc) return { error: "Document not found" }

  // Verify workspace ownership
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", doc.workspace_id)
    .eq("founder_id", user.id)
    .single()

  if (!workspace) return { error: "Unauthorized" }

  // Delete from storage if file exists
  if (doc.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path])
  }

  // Delete from database
  const { error } = await supabase.from("documents").delete().eq("id", documentId)
  if (error) return { error: error.message }

  revalidatePath("/dashboard/knowledge")
  return { success: true }
}
