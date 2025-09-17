import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import CreateSiteForm from "@/components/sites/create-site-form"

export default async function CreateSitePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login?callbackUrl=/create-site")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Create Your Site</h1>
            <p className="text-muted-foreground">
              Start your own blog and share your passion with the world
            </p>
          </div>

          <CreateSiteForm />
        </div>
      </div>
    </div>
  )
}