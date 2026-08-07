import 'server-only'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils/slugify'
import { hashPassword } from './admin-collections'
import type { ClientGallery } from '@/types'

const FALLBACK_PATH = path.join(process.cwd(), 'lib/data/fallback/client-galleries.json')

interface RawGallery {
  id: string
  slug: string
  title: string
  client_name: string | null
  collection_ids: string[]
  image_ids: string[]
  password_hash: string | null
  expires_at: string | null
  allow_favorites: boolean
  allow_download: boolean
  created_at: string
}

async function readAll(): Promise<RawGallery[]> {
  return JSON.parse(await readFile(FALLBACK_PATH, 'utf-8'))
}
async function writeAll(galleries: RawGallery[]) {
  await writeFile(FALLBACK_PATH, JSON.stringify(galleries, null, 2))
}

export interface ClientGalleryInput {
  title: string
  clientName?: string | null
  collectionIds: string[]
  imageIds?: string[]
  password: string
  allowFavorites?: boolean
  allowDownload?: boolean
}

export async function listClientGalleries(): Promise<ClientGallery[]> {
  if (!isSupabaseConfigured()) {
    const rows = await readAll()
    return rows.map(mapRawForAdmin)
  }
  const admin = getSupabaseAdminClient()!
  const { data } = await admin.from('client_galleries').select('*').order('created_at', { ascending: false })
  return (data ?? []).map(mapRawForAdmin)
}

function mapRawForAdmin(row: RawGallery): ClientGallery {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    clientName: row.client_name,
    collectionIds: row.collection_ids ?? [],
    imageIds: row.image_ids ?? [],
    passwordProtected: Boolean(row.password_hash),
    expiresAt: row.expires_at,
    allowFavorites: row.allow_favorites,
    allowDownload: row.allow_download,
    createdAt: row.created_at,
  }
}

export async function createClientGallery(input: ClientGalleryInput): Promise<ClientGallery> {
  const slug = `${slugify(input.title)}-${nanoid(6)}`
  const now = new Date().toISOString()
  const passwordHash = hashPassword(input.password)

  if (!isSupabaseConfigured()) {
    const galleries = await readAll()
    const row: RawGallery = {
      id: nanoid(),
      slug,
      title: input.title,
      client_name: input.clientName ?? null,
      collection_ids: input.collectionIds,
      image_ids: input.imageIds ?? [],
      password_hash: passwordHash,
      expires_at: null,
      allow_favorites: input.allowFavorites ?? true,
      allow_download: input.allowDownload ?? false,
      created_at: now,
    }
    galleries.push(row)
    await writeAll(galleries)
    return mapRawForAdmin(row)
  }

  const admin = getSupabaseAdminClient()!
  const { data, error } = await admin
    .from('client_galleries')
    .insert({
      slug,
      title: input.title,
      client_name: input.clientName ?? null,
      collection_ids: input.collectionIds,
      image_ids: input.imageIds ?? [],
      password_hash: passwordHash,
      allow_favorites: input.allowFavorites ?? true,
      allow_download: input.allowDownload ?? false,
    })
    .select()
    .single()
  if (error) throw error
  return mapRawForAdmin(data)
}

export async function deleteClientGallery(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const galleries = await readAll()
    await writeAll(galleries.filter((g) => g.id !== id))
    return
  }
  const admin = getSupabaseAdminClient()!
  await admin.from('client_galleries').delete().eq('id', id)
}

export async function verifyClientGalleryPassword(id: string, password: string): Promise<boolean> {
  const hash = hashPassword(password)
  if (!isSupabaseConfigured()) {
    const galleries = await readAll()
    const g = galleries.find((x) => x.id === id)
    return Boolean(g?.password_hash && g.password_hash === hash)
  }
  const admin = getSupabaseAdminClient()!
  const { data } = await admin.from('client_galleries').select('password_hash').eq('id', id).single()
  return Boolean(data?.password_hash && data.password_hash === hash)
}
