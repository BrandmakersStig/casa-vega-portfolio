import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { PortfolioImage } from '@/types'
import { RatingStars } from './rating-stars'
import { TagChips } from './tag-chips'
import { ExifList } from './exif-list'
import { CommentSection } from './comment-section'
import { FavoriteButton } from '@/components/favorites/favorite-button'
import { LightTableButton } from '@/components/light-table/light-table-button'
import { ShareMenu } from './share-menu'

export function InfoPanel({ image }: { image: PortfolioImage }) {
  return (
    <aside
      className="flex max-h-[75vh] w-full flex-col overflow-y-auto border-t border-white/10 bg-black/95 p-6 text-white sm:h-full sm:max-h-none sm:w-96 sm:border-l sm:border-t-0"
      aria-label="Billedinformation"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-2xl">{image.title}</h2>
        <div className="flex shrink-0 items-center gap-1">
          <FavoriteButton imageId={image.id} className="text-white hover:bg-white/10" />
          <LightTableButton imageId={image.id} className="text-white hover:bg-white/10" />
          <ShareMenu image={image} />
        </div>
      </div>

      <div className="mt-2">
        <RatingStars rating={image.rating} />
      </div>

      {image.description && (
        <div className="prose prose-invert prose-sm mt-4 max-w-none text-white/80">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{image.description}</ReactMarkdown>
        </div>
      )}

      <div className="mt-4">
        <TagChips keywords={image.keywords} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <ExifList image={image} />
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <CommentSection imageId={image.id} />
      </div>
    </aside>
  )
}
