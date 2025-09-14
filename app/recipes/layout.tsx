import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recipe Collection | Pastry Blog - 1200+ Baking Recipes",
  description: "Discover amazing baking recipes from our community of passionate bakers. From classic cookies to artisan breads, find your next delicious creation.",
  keywords: [
    "baking recipes",
    "pastry recipes",
    "cookie recipes",
    "bread recipes",
    "cake recipes",
    "dessert recipes",
    "baking community",
    "recipe collection"
  ],
  openGraph: {
    title: "Recipe Collection | Pastry Blog",
    description: "Discover amazing baking recipes from our community of passionate bakers.",
    type: "website",
    url: "/recipes",
    images: [
      {
        url: "/og-recipes.jpg",
        width: 1200,
        height: 630,
        alt: "Pastry Blog Recipe Collection"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Recipe Collection | Pastry Blog",
    description: "Discover amazing baking recipes from our community of passionate bakers.",
    images: ["/og-recipes.jpg"]
  },
  alternates: {
    canonical: "/recipes"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RecipesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Structured Data for Recipe Collection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Pastry Blog Recipe Collection",
            "description": "A comprehensive collection of baking and pastry recipes shared by our community of passionate bakers.",
            "url": process.env.NEXT_PUBLIC_SITE_URL + "/recipes",
            "mainEntity": {
              "@type": "ItemList",
              "name": "Baking Recipes",
              "description": "Community-contributed baking and pastry recipes",
              "numberOfItems": 1203,
            },
            "provider": {
              "@type": "Organization",
              "name": "Pastry Blog",
              "url": process.env.NEXT_PUBLIC_SITE_URL,
              "logo": process.env.NEXT_PUBLIC_SITE_URL + "/logo.png"
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": process.env.NEXT_PUBLIC_SITE_URL
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Recipes",
                  "item": process.env.NEXT_PUBLIC_SITE_URL + "/recipes"
                }
              ]
            }
          })
        }}
      />
      {children}
    </>
  )
}