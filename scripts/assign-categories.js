const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function assignCategories() {
  try {
    console.log('🔍 Fetching all recipes without categories...')

    // Get all recipes
    const recipes = await prisma.recipe.findMany({
      select: {
        id: true,
        title: true,
        categoryId: true,
        ingredients: true,
        description: true
      }
    })

    console.log(`📊 Found ${recipes.length} total recipes`)

    // Get all categories
    const categories = await prisma.recipeCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    })

    console.log(`📁 Available categories:`)
    categories.forEach(cat => console.log(`   - ${cat.name} (${cat.slug})`))

    // Category mapping based on keywords
    const categoryMap = {
      'cakes': ['cake', 'cupcake', 'birthday', 'layer cake', 'chocolate cake'],
      'cookies': ['cookie', 'biscuit', 'shortbread', 'macaroon'],
      'pasta': ['pasta', 'spaghetti', 'linguine', 'fettuccine', 'penne', 'noodle'],
      'desserts': ['dessert', 'sweet', 'pudding', 'tart', 'pie', 'mousse'],
      'main-dishes': ['chicken', 'beef', 'pork', 'fish', 'main', 'dinner'],
      'appetizers': ['appetizer', 'starter', 'dip', 'finger food'],
      'diet': ['diet', 'healthy', 'low-carb', 'keto', 'vegan', 'vegetarian']
    }

    // Function to determine category based on recipe content
    function findBestCategory(recipe, categories) {
      const text = `${recipe.title} ${recipe.description || ''}`.toLowerCase()

      // Try to find best matching category
      for (const [slug, keywords] of Object.entries(categoryMap)) {
        if (keywords.some(keyword => text.includes(keyword))) {
          const category = categories.find(c => c.slug === slug)
          if (category) return category
        }
      }

      // Default to Desserts since it's a pastry blog
      return categories.find(c => c.slug === 'desserts')
    }

    // Update recipes with categories
    let updatedCount = 0
    let skippedCount = 0

    console.log('\n🔄 Assigning categories to recipes...\n')

    for (const recipe of recipes) {
      if (recipe.categoryId) {
        console.log(`⏭️  Skipped: "${recipe.title}" (already has category)`)
        skippedCount++
        continue
      }

      const bestCategory = findBestCategory(recipe, categories)

      if (bestCategory) {
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: { categoryId: bestCategory.id }
        })

        console.log(`✅ Updated: "${recipe.title}" → ${bestCategory.name}`)
        updatedCount++
      }
    }

    console.log(`\n✨ Summary:`)
    console.log(`   - Updated: ${updatedCount} recipes`)
    console.log(`   - Skipped: ${skippedCount} recipes (already categorized)`)
    console.log(`   - Total: ${recipes.length} recipes`)

    // Display updated recipe counts per category
    console.log('\n📊 Recipes per category:')
    const categoriesWithCount = await prisma.recipeCategory.findMany({
      include: {
        _count: {
          select: { recipes: true }
        }
      }
    })

    categoriesWithCount
      .sort((a, b) => b._count.recipes - a._count.recipes)
      .forEach(cat => {
        if (cat._count.recipes > 0) {
          console.log(`   - ${cat.name}: ${cat._count.recipes} recipes`)
        }
      })

  } catch (error) {
    console.error('❌ Error assigning categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

assignCategories()