import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text, field, audience } = await request.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Mock AI enhancement - in a real app, you'd call an AI service like OpenAI
    const enhancedText = generateMockEnhancement(text, field, audience)

    return NextResponse.json({ enhancedText })
  } catch (error) {
    console.error("AI enhancement error:", error)
    return NextResponse.json({ error: "Enhancement failed" }, { status: 500 })
  }
}

function generateMockEnhancement(text: string, field: string, audience: "us" | "gulf"): string {
  const audiencePrefix = audience === "gulf" ? "Gulf-style " : "American-style "

  switch (field) {
    case "title":
      return audience === "gulf"
        ? `${text} - A Traditional Middle Eastern Delight`
        : `${text} - Classic American Comfort Food`

    case "description":
      const gulfDesc = `This exquisite ${text.toLowerCase()} brings together the rich culinary traditions of the Gulf region with modern baking techniques. Perfect for sharing during family gatherings and special occasions, this recipe has been passed down through generations and refined for today's home bakers.`
      const usDesc = `This delicious ${text.toLowerCase()} is the perfect comfort food for any occasion. Whether you're hosting a dinner party or just want to treat your family to something special, this recipe delivers amazing flavors with simple, accessible ingredients that you can find at any grocery store.`
      return audience === "gulf" ? gulfDesc : usDesc

    case "ingredients":
      if (audience === "gulf") {
        return text.replace(/butter/gi, "ghee").replace(/vanilla extract/gi, "rose water or orange blossom water")
      }
      return text + "\n• 1 tsp vanilla extract\n• Pinch of salt for enhanced flavor"

    case "instructions":
      const gulfInstructions =
        text +
        "\n\nNote: For authentic Gulf flavor, allow the dough to rest for 30 minutes before baking to develop the flavors."
      const usInstructions =
        text +
        "\n\nTip: For best results, use room temperature ingredients and preheat your oven 15 minutes before baking."
      return audience === "gulf" ? gulfInstructions : usInstructions

    default:
      return `${audiencePrefix}enhanced: ${text}`
  }
}
