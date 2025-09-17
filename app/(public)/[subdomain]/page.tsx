import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PublicSiteView from "@/components/public/public-site-view"

interface PublicSitePageProps {
  params: { subdomain: string }
}

async function getSiteBySubdomain(subdomain: string) {
  try {
    const site = await prisma.site.findUnique({
      where: {
        subdomain,
        status: "ACTIVE",
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        blogs: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 10,
          include: {
            _count: {
              select: {
                views: true,
                comments: true,
                interactions: true,
              },
            },
          },
        },
        _count: {
          select: {
            blogs: {
              where: { status: "PUBLISHED" },
            },
          },
        },
      },
    })

    return site
  } catch (error) {
    console.error('Error fetching site:', error)
    return null
  }
}

export async function generateMetadata({ params }: PublicSitePageProps) {
  const site = await getSiteBySubdomain(params.subdomain)

  if (!site) {
    return {
      title: 'Site Not Found',
    }
  }

  return {
    title: site.metaTitle || site.name,
    description: site.metaDescription || site.description,
    keywords: site.tags?.join(', '),
    openGraph: {
      title: site.metaTitle || site.name,
      description: site.metaDescription || site.description,
      type: 'website',
      url: `https://${site.subdomain}.yourdomain.com`,
      images: site.featuredImage ? [{ url: site.featuredImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: site.metaTitle || site.name,
      description: site.metaDescription || site.description,
      images: site.featuredImage ? [site.featuredImage] : [],
    },
  }
}

export default async function PublicSitePage({ params }: PublicSitePageProps) {
  const site = await getSiteBySubdomain(params.subdomain)

  if (!site) {
    notFound()
  }

  // Track site view (you might want to implement analytics here)
  // await prisma.siteView.create({ data: { siteId: site.id } })

  return <PublicSiteView site={site} />
}