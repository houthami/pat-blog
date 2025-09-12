const { execSync } = require("child_process")
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

async function initializeDatabase() {
  console.log("[v0] Initializing database...")

  try {
    // Step 1: Generate Prisma client
    console.log("[v0] Generating Prisma client...")
    execSync("npx prisma generate", { stdio: "inherit" })

    // Step 2: Push schema to database (creates tables)
    console.log("[v0] Pushing schema to database...")
    execSync("npx prisma db push", { stdio: "inherit" })

    // Step 3: Seed the database
    console.log("[v0] Seeding database...")
    const prisma = new PrismaClient()

    try {
      await prisma.$connect()
      console.log("[v0] Connected to database successfully")

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

      console.log("[v0] ✅ Created admin user:", adminUser.email)

      // Check if sample recipe already exists
      const existingRecipe = await prisma.recipe.findFirst({
        where: { title: "Classic Chocolate Chip Cookies" },
      })

      if (!existingRecipe) {
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
        console.log("[v0] ✅ Created sample recipe:", sampleRecipe.title)
      } else {
        console.log("[v0] ✅ Sample recipe already exists")
      }

      console.log("[v0] 🎉 Database initialization complete!")
      console.log("[v0] 📧 Login credentials:")
      console.log("[v0]    Email: admin@pastry.com")
      console.log("[v0]    Password: admin123")
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error("[v0] ❌ Database initialization failed:", error)
    process.exit(1)
  }
}

initializeDatabase()
