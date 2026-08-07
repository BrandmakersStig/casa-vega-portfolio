import { getAllComments } from '@/lib/data/comments'
import { CommentsModeration } from '@/components/admin/comments-moderation'

export default async function AdminCommentsPage() {
  const comments = await getAllComments()
  return (
    <div>
      <h1 className="font-display text-3xl font-light">Kommentarer</h1>
      <p className="mt-2 text-muted-foreground">{comments.filter((c) => c.status === 'pending').length} venter på godkendelse</p>
      <div className="mt-6">
        <CommentsModeration comments={comments} />
      </div>
    </div>
  )
}
