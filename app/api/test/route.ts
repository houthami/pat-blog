export async function GET() {
  try {
    console.log("[v0] Test API route called")
    return Response.json({ message: "API is working", timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("[v0] Test API error:", error)
    return Response.json({ error: "Test API failed" }, { status: 500 })
  }
}
