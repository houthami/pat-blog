import { prisma } from '../lib/prisma'

async function createTestCategories() {
  try {
    console.log('Creating test categories...')

    // Create main categories
    const desserts = await prisma.recipeCategory.create({
      data: {
        name: 'Desserts',
        slug: 'desserts',
        description: 'Sweet treats and desserts',
        color: '#F97316',
        sortOrder: 1
      }
    })

    const mains = await prisma.recipeCategory.create({
      data: {
        name: 'Main Dishes',
        slug: 'main-dishes',
        description: 'Main courses and hearty meals',
        color: '#DC2626',
        sortOrder: 2
      }
    })

    const appetizers = await prisma.recipeCategory.create({
      data: {
        name: 'Appetizers',
        slug: 'appetizers',
        description: 'Starters and small bites',
        color: '#059669',
        sortOrder: 3
      }
    })

    // Create subcategories
    await prisma.recipeCategory.create({
      data: {
        name: 'Cakes',
        slug: 'cakes',
        description: 'All types of cakes',
        color: '#EC4899',
        parentId: desserts.id,
        sortOrder: 1
      }
    })

    await prisma.recipeCategory.create({
      data: {
        name: 'Cookies',
        slug: 'cookies',
        description: 'Cookies and biscuits',
        color: '#A855F7',
        parentId: desserts.id,
        sortOrder: 2
      }
    })

    await prisma.recipeCategory.create({
      data: {
        name: 'Pasta',
        slug: 'pasta',
        description: 'Pasta dishes',
        color: '#EAB308',
        parentId: mains.id,
        sortOrder: 1
      }
    })

    console.log('✅ Test categories created successfully!')

    // Fetch and display created categories
    const categories = await prisma.recipeCategory.findMany({
      include: {
        parent: true,
        children: true
      },
      orderBy: [
        { parentId: 'asc' },
        { sortOrder: 'asc' }
      ]
    })

    console.log('\nCreated categories:')
    categories.forEach(cat => {
      const prefix = cat.parentId ? '  └─ ' : '📁 '
      console.log(`${prefix}${cat.name} (${cat.slug}) - ${cat.color}`)
    })

  } catch (error) {
    console.error('Error creating test categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestCategories()