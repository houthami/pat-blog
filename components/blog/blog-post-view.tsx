"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Send,
  User
} from "lucide-react"
import { toast } from "sonner"

interface Blog {
  id: string
  title: string
  description?: string
  content: string
  slug: string
  imageUrl?: string
  publishedAt: string
  categories: string[]
  tags: string[]
  allowComments: boolean
  allowSharing: boolean
  author: {
    id: string
    name?: string
    image?: string
  }
  comments: BlogComment[]
  _count: {
    views: number
    comments: number
    interactions: number
  }
}

interface BlogComment {
  id: string
  name: string
  content: string
  createdAt: string
  approved: boolean
  replies: BlogComment[]
}

interface RelatedBlog {
  id: string
  title: string
  description?: string
  slug: string
  imageUrl?: string
  publishedAt: string
  author: {
    name?: string
    image?: string
  }
}

interface BlogPostViewProps {
  initialData: {
    blog: Blog
    relatedBlogs: RelatedBlog[]
  }
  slug: string
}

export default function BlogPostView({ initialData, slug }: BlogPostViewProps) {
  const router = useRouter()
  const [blog] = useState<Blog>(initialData.blog)
  const [relatedBlogs] = useState<RelatedBlog[]>(initialData.relatedBlogs)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [comment, setComment] = useState("")
  const [commentName, setCommentName] = useState("")
  const [commentEmail, setCommentEmail] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  // Generate visitor ID for tracking
  const getVisitorId = () => {
    let visitorId = localStorage.getItem('visitor-id')
    if (!visitorId) {
      visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem('visitor-id', visitorId)
    }
    return visitorId
  }

  // Track blog interaction
  const trackInteraction = async (type: string, value?: string) => {
    try {
      const visitorId = getVisitorId()
      await fetch(`/api/blogs/public/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          value,
          visitorId
        })
      })
    } catch (error) {
      console.error('Error tracking interaction:', error)
    }
  }

  // Handle like/unlike
  const handleLike = async () => {
    const newLikedState = !isLiked
    setIsLiked(newLikedState)

    if (newLikedState) {
      await trackInteraction('like')
      toast.success('Thanks for liking this post!')
    } else {
      await trackInteraction('unlike')
    }
  }

  // Handle bookmark
  const handleBookmark = async () => {
    const newBookmarkState = !isBookmarked
    setIsBookmarked(newBookmarkState)

    if (newBookmarkState) {
      await trackInteraction('bookmark')
      toast.success('Post bookmarked!')
    } else {
      await trackInteraction('unbookmark')
    }
  }

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.description || 'Check out this blog post',
          url: window.location.href
        })
        await trackInteraction('share', 'native')
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        await trackInteraction('share', 'copy_url')
        toast.success('Link copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy link')
      }
    }
  }

  // Submit comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!comment.trim() || !commentName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmittingComment(true)
    try {
      const visitorId = getVisitorId()
      const response = await fetch(`/api/blogs/public/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: commentName,
          email: commentEmail,
          content: comment,
          visitorId
        })
      })

      if (response.ok) {
        toast.success('Comment submitted! It will appear after moderation.')
        setComment('')
        setCommentName('')
        setCommentEmail('')
      } else {
        throw new Error('Failed to submit comment')
      }
    } catch (error) {
      toast.error('Failed to submit comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  // Format reading time estimate
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    const minutes = Math.ceil(words / wordsPerMinute)
    return `${minutes} min read`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article>
          {/* Blog Header */}
          <header className="mb-8">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {blog.categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {blog.title}
            </h1>

            {blog.description && (
              <p className="text-xl text-muted-foreground mb-6">
                {blog.description}
              </p>
            )}

            {/* Author and Meta Info */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={blog.author.image} alt={blog.author.name} />
                  <AvatarFallback>
                    {blog.author.name ? blog.author.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{blog.author.name || 'Anonymous'}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getReadingTime(blog.content)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {blog._count.views} views
                    </span>
                  </div>
                </div>
              </div>

              {/* Social Actions */}
              {blog.allowSharing && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLike}
                    className={isLiked ? "text-red-600 border-red-600" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
                    Like
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBookmark}
                    className={isBookmarked ? "text-blue-600 border-blue-600" : ""}
                  >
                    <Bookmark className={`h-4 w-4 mr-1 ${isBookmarked ? "fill-current" : ""}`} />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              )}
            </div>

            {/* Featured Image */}
            {blog.imageUrl && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-8">
                <Image
                  src={blog.imageUrl}
                  alt={blog.title}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Tags */}
            {blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-6">
                {blog.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Blog Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div
              dangerouslySetInnerHTML={{ __html: blog.content }}
              className="prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary hover:prose-a:text-primary/80"
            />
          </div>

          <Separator className="my-8" />

          {/* Comments Section */}
          {blog.allowComments && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">
                Comments ({blog._count.comments})
              </h2>

              {/* Comment Form */}
              <Card className="mb-8">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Leave a Comment</h3>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCommentSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={commentName}
                          onChange={(e) => setCommentName(e.target.value)}
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email (optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={commentEmail}
                          onChange={(e) => setCommentEmail(e.target.value)}
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="comment">Comment *</Label>
                      <Textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={4}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={submittingComment}>
                      {submittingComment ? (
                        "Submitting..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Comment
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Comments List */}
              <div className="space-y-6">
                {blog.comments.filter(comment => comment.approved).map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {comment.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{comment.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                          {/* Replies */}
                          {comment.replies.length > 0 && (
                            <div className="mt-4 ml-4 space-y-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex items-start gap-3">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {reply.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium">{reply.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(reply.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {blog.comments.filter(comment => comment.approved).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            </section>
          )}
        </article>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link key={relatedBlog.id} href={`/blog/${relatedBlog.slug}`}>
                  <Card className="group hover:shadow-lg transition-shadow h-full">
                    {relatedBlog.imageUrl && (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <Image
                          src={relatedBlog.imageUrl}
                          alt={relatedBlog.title}
                          width={300}
                          height={200}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {relatedBlog.title}
                      </h3>
                      {relatedBlog.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {relatedBlog.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{relatedBlog.author.name || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{new Date(relatedBlog.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}