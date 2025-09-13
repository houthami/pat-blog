const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const sampleRecipes = [
  {
    title: "Classic Chocolate Chip Cookies",
    description: "Soft, chewy, and loaded with chocolate chips - these are the perfect cookies for any occasion!",
    ingredients: [
      "2¼ cups all-purpose flour",
      "1 tsp baking soda",
      "1 tsp salt",
      "1 cup butter, softened",
      "¾ cup granulated sugar",
      "¾ cup brown sugar, packed",
      "2 large eggs",
      "2 tsp vanilla extract",
      "2 cups chocolate chips"
    ],
    instructions: [
      "Preheat oven to 375°F (190°C)",
      "Mix flour, baking soda, and salt in a bowl",
      "In another bowl, beat butter and both sugars until creamy",
      "Add eggs and vanilla to butter mixture",
      "Gradually mix in flour mixture",
      "Stir in chocolate chips",
      "Drop rounded tablespoons onto ungreased baking sheets",
      "Bake 9-11 minutes until golden brown",
      "Cool on baking sheet for 2 minutes before transferring"
    ],
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&h=600&fit=crop"
  },
  {
    title: "French Croissants",
    description: "Buttery, flaky, and absolutely divine - master the art of making authentic French croissants at home.",
    ingredients: [
      "500g strong white flour",
      "10g salt",
      "80g caster sugar",
      "10g fresh yeast",
      "300ml warm milk",
      "300g butter, cold",
      "1 egg, beaten (for glazing)"
    ],
    instructions: [
      "Mix flour, salt, and sugar in a large bowl",
      "Dissolve yeast in warm milk, add to flour mixture",
      "Knead into a smooth dough, wrap and chill for 1 hour",
      "Roll butter between parchment into a rectangle",
      "Roll dough larger than butter, place butter in center",
      "Fold dough over butter, seal edges",
      "Roll out and fold in thirds, chill 30 minutes",
      "Repeat rolling and folding process 2 more times",
      "Roll out and cut into triangles",
      "Roll each triangle from base to tip",
      "Place on baking sheets, let rise 2 hours",
      "Brush with beaten egg, bake at 200°C for 15-20 minutes"
    ],
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab794f4ade50?w=800&h=600&fit=crop"
  },
  {
    title: "New York Cheesecake",
    description: "Rich, creamy, and absolutely decadent - this is the ultimate New York style cheesecake recipe.",
    ingredients: [
      "200g digestive biscuits, crushed",
      "85g butter, melted",
      "900g cream cheese, softened",
      "250g caster sugar",
      "3 large eggs",
      "3 large egg yolks",
      "284ml sour cream",
      "1 tsp vanilla extract",
      "3 tbsp plain flour"
    ],
    instructions: [
      "Preheat oven to 180°C",
      "Mix crushed biscuits with melted butter",
      "Press into base of 23cm springform tin",
      "Beat cream cheese until smooth",
      "Gradually add sugar, beating until combined",
      "Beat in eggs one at a time, then egg yolks",
      "Mix in sour cream, vanilla, and flour",
      "Pour over biscuit base",
      "Bake for 15 minutes, then reduce to 110°C",
      "Continue baking for 1 hour 15 minutes",
      "Turn off oven, leave door ajar for 1 hour",
      "Cool completely, then refrigerate overnight"
    ],
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&h=600&fit=crop"
  }
]

async function seedData() {
  try {
    // Create or find admin user
    let adminUser = await prisma.user.findUnique({
      where: { email: "admin@pastry.com" }
    })

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: "admin@pastry.com",
          password: "admin123", // In production, this should be hashed
          name: "Admin Chef"
        }
      })
      console.log("Created admin user")
    }

    // Create sample recipes
    for (const recipeData of sampleRecipes) {
      const recipe = await prisma.recipe.create({
        data: {
          title: recipeData.title,
          description: recipeData.description,
          ingredients: JSON.stringify(recipeData.ingredients),
          instructions: JSON.stringify(recipeData.instructions),
          imageUrl: recipeData.imageUrl,
          published: true,
          authorId: adminUser.id
        }
      })
      console.log(`Created recipe: ${recipe.title}`)
    }

    console.log("✅ Sample data created successfully!")
  } catch (error) {
    console.error("❌ Error seeding data:", error)
  } finally {
    await prisma.$disconnect()
  }
}

seedData()