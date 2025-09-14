"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageCircle, Star, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Comment {
  id: string
  content: string
  rating: number | null
  name: string
  approved: boolean
  createdAt: string
}

interface CommentsResponse {
  comments: Comment[]
  averageRating: number | null
  totalComments: number
  pendingComments: number
}

interface RecipeCommentsProps {
  recipeId: string
  userRole?: string
  isAuthenticated: boolean
}

export function RecipeComments({
  recipeId,
  userRole,
  isAuthenticated
}: RecipeCommentsProps) {
  const [commentsData, setCommentsData] = useState<CommentsResponse | null>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [newRating, setNewRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canComment = isAuthenticated && userRole !== 'VISITOR'
  const comments = commentsData?.comments || []

  useEffect(() => {
    fetchComments()
  }, [recipeId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setCommentsData(data)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          rating: newRating
        })
      })

      if (response.ok) {
        toast.success('Comment added successfully')
        setNewComment("")
        setNewRating(null)
        setShowCommentModal(false)
        await fetchComments()
      } else {
        toast.error('Failed to add comment')
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentClick = () => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    if (!canComment) {
      toast.error('Upgrade your account to comment on recipes')
      return
    }

    setShowCommentModal(true)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Comments ({comments.length})</h3>
              {commentsData?.averageRating && (
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {renderStars(Math.round(commentsData.averageRating))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({commentsData.averageRating})
                  </span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCommentClick}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Add Comment
            </Button>
          </div>

          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">No comments yet</p>
              {canComment && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleCommentClick}
                >
                  Be the first to comment
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-muted pl-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.name || 'Anonymous'}
                        </span>
                        {comment.rating && (
                          <div className="flex items-center gap-1">
                            {renderStars(comment.rating)}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                        {!comment.approved && (
                          <Badge variant="secondary" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comment Modal */}
      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a Comment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Rating (Optional)
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(newRating === star ? null : star)}
                    className={`text-2xl transition-colors ${
                      newRating && star <= newRating
                        ? 'text-yellow-400 hover:text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Your Comment
              </label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this recipe..."
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCommentModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Comment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}