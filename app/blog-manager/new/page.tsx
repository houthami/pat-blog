import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import BlogEditor from "@/components/blog-manager/blog-editor"

export default async function NewBlogPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "SUPER_USER") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <BlogEditor />
    </div>
  )
}