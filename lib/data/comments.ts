import 'server-only'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import type { Comment } from '@/types'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { mapCommentRow } from './mappers'

const FALLBACK_PATH = path.join(process.cwd(), 'lib/data/fallback/comments.json')

async function readFallback(): Promise<Comment[]> {
  try {
    return JSON.parse(await readFile(FALLBACK_PATH, 'utf-8'))
  } catch {
    return []
  }
}

async function writeFallback(comments: Comment[]): Promise<void> {
  await writeFile(FALLBACK_PATH, JSON.stringify(comments, null, 2))
}

export async function getApprovedComments(imageId: string): Promise<Comment[]> {
  if (!isSupabaseConfigured()) {
    const all = await readFallback()
    return all
      .filter((c) => c.imageId === imageId && c.status === 'approved')
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || a.createdAt.localeCompare(b.createdAt))
  }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('comments')
    .select('*')
    .eq('image_id', imageId)
    .eq('status', 'approved')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: true })
  return (data ?? []).map(mapCommentRow)
}

/** All comments (any status) — admin moderation only. */
export async function getAllComments(): Promise<Comment[]> {
  if (!isSupabaseConfigured()) {
    const all = await readFallback()
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  const admin = getSupabaseAdminClient()
  const { data } = await admin!.from('comments').select('*').order('created_at', { ascending: false })
  return (data ?? []).map(mapCommentRow)
}

// Very basic spam heuristic: reject links-heavy or excessively long bodies.
// Real spam protection (rate limiting, honeypot) lives in the route handler.
function looksLikeSpam(body: string): boolean {
  const linkCount = (body.match(/https?:\/\//gi) ?? []).length
  return linkCount >= 3 || body.length > 4000
}

export async function createComment(input: {
  imageId: string
  parentId?: string | null
  authorName: string
  authorEmail?: string | null
  body: string
}): Promise<Comment> {
  const status = looksLikeSpam(input.body) ? 'rejected' : 'pending'
  const now = new Date().toISOString()

  if (!isSupabaseConfigured()) {
    const all = await readFallback()
    const comment: Comment = {
      id: nanoid(),
      imageId: input.imageId,
      parentId: input.parentId ?? null,
      authorName: input.authorName,
      authorEmail: input.authorEmail ?? null,
      body: input.body,
      likeCount: 0,
      status,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    }
    all.push(comment)
    await writeFallback(all)
    return comment
  }

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase!
    .from('comments')
    .insert({
      image_id: input.imageId,
      parent_id: input.parentId ?? null,
      author_name: input.authorName,
      author_email: input.authorEmail ?? null,
      body: input.body,
      status,
    })
    .select()
    .single()
  if (error) throw error
  return mapCommentRow(data)
}

export async function moderateComment(
  id: string,
  patch: Partial<Pick<Comment, 'status' | 'pinned' | 'body'>>
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = await readFallback()
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) return
    all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() }
    await writeFallback(all)
    return
  }
  const admin = getSupabaseAdminClient()
  await admin!.from('comments').update(patch).eq('id', id)
}

export async function deleteComment(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = await readFallback()
    await writeFallback(all.filter((c) => c.id !== id))
    return
  }
  const admin = getSupabaseAdminClient()
  await admin!.from('comments').delete().eq('id', id)
}

export async function likeComment(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = await readFallback()
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) return
    all[idx].likeCount += 1
    await writeFallback(all)
    return
  }
  const supabase = await getSupabaseServerClient()
  await supabase!.rpc('increment_comment_like', { comment_id: id })
}
