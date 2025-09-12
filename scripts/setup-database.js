const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("[v0] Setting up database...")

  try {
    // Test database connection first
    await prisma.$connect()
    console.log("[v0] Database connection successful")

    // Check if tables exist by trying to count users
    try {
      await prisma.user.count()
      console.log("[v0] Database tables already exist")
    } catch (error) {
      console.log("[v0] Database tables don't exist, they will be created automatically by Prisma")
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12)

    const adminUser = await prisma.user.upsert({
      where: { email: "admin@pastry.com" },
      update: {},
      create: {
        email: "admin@pastry.com",
        password: hashedPassword,
        name: "Admin User",
      },
    })

    console.log("[v0] Created admin user:", adminUser.email)

    const sampleRecipe = await prisma.recipe.create({
      data: {
        title: "Classic Chocolate Chip Cookies",
        description: "Delicious homemade chocolate chip cookies with a perfect chewy texture.",
        ingredients: JSON.stringify([
          "2 1/4 cups all-purpose flour",
          "1 tsp baking soda",
          "1 tsp salt",
          "1 cup butter, softened",
          "3/4 cup granulated sugar",
          "3/4 cup brown sugar",
          "2 large eggs",
          "2 tsp vanilla extract",
          "2 cups chocolate chips",
        ]),
        instructions: JSON.stringify([
          "Preheat oven to 375°F (190°C)",
          "Mix flour, baking soda, and salt in a bowl",
          "Cream butter and sugars until fluffy",
          "Beat in eggs and vanilla",
          "Gradually blend in flour mixture",
          "Stir in chocolate chips",
          "Drop rounded tablespoons onto ungreased cookie sheets",
          "Bake 9-11 minutes until golden brown",
        ]),
        published: true,
        authorId: adminUser.id,
      },
    })

    console.log("[v0] Created sample recipe:", sampleRecipe.title)
    console.log("[v0] Database setup complete!")
    console.log("[v0] You can now login with:")
    console.log("[v0] Email: admin@pastry.com")
    console.log("[v0] Password: admin123")
  } catch (error) {
    console.error("[v0] Database setup error:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error("[v0] Database setup failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
