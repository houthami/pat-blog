import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pastry Blog - Delicious Recipes & Baking Inspiration",
  description: "Discover amazing pastry recipes, baking tips, and culinary inspiration. From beginner-friendly treats to advanced techniques.",
  keywords: "pastry, baking, recipes, desserts, cakes, cookies, bread",
  authors: [{ name: "Pastry Blog Team" }],
  creator: "Pastry Blog",
  publisher: "Pastry Blog",
  openGraph: {
    title: "Pastry Blog - Delicious Recipes & Baking Inspiration",
    description: "Discover amazing pastry recipes, baking tips, and culinary inspiration.",
    type: "website",
    locale: "en_US",
    siteName: "Pastry Blog"
  },
  twitter: {
    card: "summary_large_image",
    title: "Pastry Blog - Delicious Recipes & Baking Inspiration",
    description: "Discover amazing pastry recipes, baking tips, and culinary inspiration."
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

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}