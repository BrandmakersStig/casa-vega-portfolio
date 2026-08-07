import { getImages } from './images'
import { getAllComments } from './comments'

export interface SiteStats {
  totalImages: number
  totalViews: number
  totalFavorites: number
  totalDownloads: number
  totalShares: number
  pendingComments: number
  topImages: { id: string; title: string; thumb: string; views: number }[]
}

export async function getSiteStats(): Promise<SiteStats> {
  const [images, comments] = await Promise.all([getImages(), getAllComments()])

  const totals = images.reduce(
    (acc, img) => {
      acc.views += img.viewCount
      acc.favorites += img.favoriteCount
      acc.downloads += img.downloadCount
      acc.shares += img.shareCount
      return acc
    },
    { views: 0, favorites: 0, downloads: 0, shares: 0 }
  )

  const topImages = [...images]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 8)
    .map((i) => ({ id: i.id, title: i.title, thumb: i.urls.thumb, views: i.viewCount }))

  return {
    totalImages: images.length,
    totalViews: totals.views,
    totalFavorites: totals.favorites,
    totalDownloads: totals.downloads,
    totalShares: totals.shares,
    pendingComments: comments.filter((c) => c.status === 'pending').length,
    topImages,
  }
}
