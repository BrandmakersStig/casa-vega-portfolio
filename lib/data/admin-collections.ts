import 'server-only'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils/slugify'
import type { Collection, SmartCollectionRule } from '@/types'

const FALLBACK_PATH = path.join(process.cwd(), 'lib/data/fallback/collections.json')

// The fallback JSON is also the source of truth for password hashes in dev
// mode, so rows there carry one extra field the public `Collection` type
// doesn't declare. Read/write this raw shape internally; lib/data/collections.ts
// (the public read path) only ever exposes `passwordProtected: boolean`.
type CollectionRowWithSecret = Collection & { passwordHash?: string | null }

async function readAll(): Promise<CollectionRowWithSecret[]> {
  return JSON.parse(await readFile(FALLBACK_PATH, 'utf-8'))
}
async function writeAll(collections: CollectionRowWithSecret[]) {
  await writeFile(FALLBACK_PATH, JSON.stringify(collections, null, 2))
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export async function createCollection(
  title: string,
  opts: { isSmart?: boolean; smartRules?: SmartCollectionRule[] } = {}
): Promise<Collection> {
  const slug = slugify(title)
  const now = new Date().toISOString()
  const isSmart = opts.isSmart ?? false
  const smartRules = isSmart ? (opts.smartRules ?? []) : null

  if (!isSupabaseConfigured()) {
    const collections = await readAll()
    const collection: Collection = {
      id: slug,
      slug,
      title,
      description: null,
      coverImageId: null,
      coverImageUrl: null,
      imageCount: 0,
      featured: false,
      visibility: 'public',
      passwordProtected: false,
      isSmart,
      smartRules,
      createdAt: now,
      updatedAt: now,
      sortOrder: collections.length,
    }
    collections.push(collection)
    await writeAll(collections)
    return collection
  }

  const admin = getSupabaseAdminClient()!
  const { data, error } = await admin
    .from('collections')
    .insert({ slug, title, is_smart: isSmart, smart_rules: smartRules })
    .select()
    .single()
  if (error) throw error
  const { mapCollectionRow } = await import('./mappers')
  return mapCollectionRow(data)
}

type CollectionPatch = Partial<
  Pick<Collection, 'title' | 'description' | 'featured' | 'visibility' | 'coverImageId' | 'sortOrder' | 'smartRules'>
> & { password?: string | null }

export async function updateCollection(id: string, patch: CollectionPatch): Promise<void> {
  if (!isSupabaseConfigured()) {
    const collections = await readAll()
    const idx = collections.findIndex((c) => c.id === id)
    if (idx === -1) return
    const { password, ...rest } = patch
    collections[idx] = {
      ...collections[idx],
      ...rest,
      ...(password !== undefined && {
        passwordHash: password ? hashPassword(password) : null,
        passwordProtected: Boolean(password),
      }),
      updatedAt: new Date().toISOString(),
    }
    await writeAll(collections)
    return
  }

  const admin = getSupabaseAdminClient()!
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = patch.title
  if (patch.description !== undefined) row.description = patch.description
  if (patch.featured !== undefined) row.featured = patch.featured
  if (patch.visibility !== undefined) row.visibility = patch.visibility
  if (patch.coverImageId !== undefined) row.cover_image_id = patch.coverImageId
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder
  if (patch.smartRules !== undefined) row.smart_rules = patch.smartRules
  if (patch.password !== undefined) {
    row.password_hash = patch.password ? hashPassword(patch.password) : null
  }
  await admin.from('collections').update(row).eq('id', id)
}

export async function verifyCollectionPassword(id: string, password: string): Promise<boolean> {
  const hash = hashPassword(password)
  if (!isSupabaseConfigured()) {
    const collections = await readAll()
    const collection = collections.find((c) => c.id === id)
    return Boolean(collection?.passwordHash && collection.passwordHash === hash)
  }
  const admin = getSupabaseAdminClient()!
  const { data } = await admin.from('collections').select('password_hash').eq('id', id).single()
  return Boolean(data?.password_hash && data.password_hash === hash)
}

export async function deleteCollection(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const collections = await readAll()
    await writeAll(collections.filter((c) => c.id !== id))
    return
  }
  const admin = getSupabaseAdminClient()!
  await admin.from('collections').delete().eq('id', id)
}
