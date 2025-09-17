import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/password'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test users
  const adminPassword = await hashPassword('Admin123!')
  const editorPassword = await hashPassword('Editor123!')
  const viewerPassword = await hashPassword('Viewer123!')
  const superUserPassword = await hashPassword('SuperUser123!')

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@pastry.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        email: 'editor@pastry.com',
        password: editorPassword,
        name: 'Editor User',
        role: 'EDITOR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'viewer@pastry.com',
        password: viewerPassword,
        name: 'Viewer User',
        role: 'VIEWER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'superuser@pastry.com',
        password: superUserPassword,
        name: 'Super User',
        role: 'SUPER_USER',
      },
    }),
  ])

  console.log('✅ Created users:', users.map(u => `${u.name} (${u.email})`))

  // Create test recipes
  const recipes = await Promise.all([
    prisma.recipe.create({
      data: {
        title: 'Classic Chocolate Chip Cookies',
        description: 'The perfect chewy chocolate chip cookies that everyone loves.',
        ingredients: JSON.stringify([
          '2 cups all-purpose flour',
          '1 tsp baking soda',
          '1 tsp salt',
          '1 cup butter, softened',
          '3/4 cup granulated sugar',
          '3/4 cup brown sugar',
          '2 eggs',
          '2 tsp vanilla extract',
          '2 cups chocolate chips'
        ]),
        instructions: JSON.stringify([
          'Preheat oven to 375°F (190°C)',
          'Mix flour, baking soda, and salt in a bowl',
          'Cream butter and sugars until fluffy',
          'Beat in eggs and vanilla',
          'Gradually mix in flour mixture',
          'Stir in chocolate chips',
          'Drop rounded tablespoons on ungreased baking sheets',
          'Bake 9-11 minutes until golden brown'
        ]),
        authorId: users[1].id, // Editor
        status: 'PUBLISHED',
        servings: 24,
        prepTime: 15,
        cookTime: 10,
        difficulty: 'easy',
        cuisine: 'american',
        mealType: ['dessert'],
        publishedAt: new Date(),
      },
    }),
    prisma.recipe.create({
      data: {
        title: 'French Croissants',
        description: 'Buttery, flaky croissants made from scratch with laminated dough.',
        ingredients: JSON.stringify([
          '500g strong white flour',
          '10g salt',
          '80g caster sugar',
          '10g instant yeast',
          '300ml warm milk',
          '250g butter (for laminating)',
          '1 egg (for egg wash)'
        ]),
        instructions: JSON.stringify([
          'Make the dough and rest overnight',
          'Prepare butter block for laminating',
          'Roll and fold dough 3 times with butter',
          'Rest between each fold',
          'Roll out and cut into triangles',
          'Shape into croissants',
          'Proof until doubled',
          'Brush with egg wash and bake at 200°C for 15-20 minutes'
        ]),
        authorId: users[0].id, // Admin
        status: 'PUBLISHED',
        servings: 12,
        prepTime: 480, // 8 hours including resting
        cookTime: 20,
        difficulty: 'hard',
        cuisine: 'french',
        mealType: ['breakfast'],
        publishedAt: new Date(),
      },
    }),
  ])

  console.log('✅ Created recipes:', recipes.map(r => r.title))

  // Create test blogs for super user
  const blogs = await Promise.all([
    prisma.blog.create({
      data: {
        title: 'The Art of French Pastry: A Journey Through Techniques',
        description: 'Explore the intricate world of French pastry making, from basic techniques to advanced skills.',
        content: `
          <h2>Introduction to French Pastry</h2>
          <p>French pastry is renowned worldwide for its precision, technique, and exquisite results. In this comprehensive guide, we'll explore the fundamental techniques that make French pastry so special.</p>

          <h3>Essential Techniques</h3>
          <ul>
            <li><strong>Lamination:</strong> The process of creating layers in dough for croissants and puff pastry</li>
            <li><strong>Tempering:</strong> Carefully controlling temperature for chocolate work</li>
            <li><strong>Piping:</strong> Creating beautiful decorative elements with pastry bags</li>
          </ul>

          <h3>Key Ingredients</h3>
          <p>Quality ingredients are the foundation of excellent pastry. French pastry chefs emphasize the importance of:</p>
          <ul>
            <li>High-quality butter with proper fat content</li>
            <li>Fresh eggs from free-range chickens</li>
            <li>Premium chocolate and vanilla</li>
            <li>Unbleached flour with the right protein content</li>
          </ul>

          <h3>Getting Started</h3>
          <p>Begin your French pastry journey with these fundamental recipes:</p>
          <ol>
            <li>Pâte Brisée (Basic Tart Dough)</li>
            <li>Pâte à Choux (Cream Puff Pastry)</li>
            <li>Crème Pâtissière (Pastry Cream)</li>
          </ol>

          <p>Master these basics, and you'll have the foundation to create countless French pastries!</p>
        `,
        slug: 'art-of-french-pastry-journey-through-techniques',
        imageUrl: '/img/french-pastry-hero.jpg',
        status: 'PUBLISHED',
        authorId: users[3].id, // Super User
        categories: ['Techniques', 'French Pastry', 'Education'],
        tags: ['pastry', 'french', 'techniques', 'beginner', 'guide'],
        metaTitle: 'Master French Pastry Techniques | Complete Guide',
        metaDescription: 'Learn the essential techniques of French pastry making. From lamination to tempering, master the skills that create world-class pastries.',
        keywords: ['french pastry', 'pastry techniques', 'lamination', 'baking guide'],
        publishedAt: new Date(),
        allowComments: true,
        allowSharing: true,
      },
    }),
    prisma.blog.create({
      data: {
        title: 'Seasonal Ingredients: Baking with What\'s Fresh',
        description: 'Discover how to incorporate seasonal ingredients into your baking for maximum flavor and freshness.',
        content: `
          <h2>Embracing Seasonal Baking</h2>
          <p>One of the most rewarding aspects of baking is working with seasonal ingredients. Not only do they taste better when they're in season, but they also connect us to the natural rhythm of the year.</p>

          <h3>Spring Ingredients</h3>
          <p>Spring brings fresh, light flavors perfect for delicate pastries:</p>
          <ul>
            <li><strong>Strawberries:</strong> Perfect for tarts and shortcakes</li>
            <li><strong>Rhubarb:</strong> Adds tartness to crumbles and pies</li>
            <li><strong>Lemon:</strong> Bright citrus for cakes and curds</li>
            <li><strong>Fresh herbs:</strong> Mint, basil, and lavender for unique flavors</li>
          </ul>

          <h3>Summer Bounty</h3>
          <p>Summer offers an abundance of fruits perfect for baking:</p>
          <ul>
            <li>Stone fruits like peaches, plums, and apricots</li>
            <li>Berries at their peak sweetness</li>
            <li>Fresh corn for cornbread and muffins</li>
            <li>Tomatoes for savory galettes</li>
          </ul>

          <h3>Autumn Comfort</h3>
          <p>Fall ingredients bring warmth and comfort to our baking:</p>
          <ul>
            <li>Apples and pears for classic pies</li>
            <li>Pumpkins and squashes for seasonal treats</li>
            <li>Warm spices like cinnamon, nutmeg, and cloves</li>
            <li>Nuts harvested fresh from the tree</li>
          </ul>

          <h3>Winter Warmth</h3>
          <p>Winter baking focuses on rich, warming ingredients:</p>
          <ul>
            <li>Citrus fruits at their peak</li>
            <li>Dried fruits and nuts</li>
            <li>Rich chocolates and warming spices</li>
            <li>Preserved fruits from earlier seasons</li>
          </ul>

          <p>By following the seasons, your baking will always be at its most flavorful and satisfying!</p>
        `,
        slug: 'seasonal-ingredients-baking-fresh',
        status: 'PUBLISHED',
        authorId: users[3].id, // Super User
        categories: ['Ingredients', 'Seasonal Baking'],
        tags: ['seasonal', 'ingredients', 'fresh', 'flavor', 'baking tips'],
        metaTitle: 'Seasonal Baking: Using Fresh Ingredients Year-Round',
        metaDescription: 'Learn how to bake with seasonal ingredients for maximum flavor. Discover what ingredients to use in each season for the best results.',
        keywords: ['seasonal baking', 'fresh ingredients', 'seasonal ingredients', 'baking tips'],
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        allowComments: true,
        allowSharing: true,
      },
    }),
    prisma.blog.create({
      data: {
        title: 'Common Baking Mistakes and How to Avoid Them',
        description: 'Learn from common baking mistakes to improve your results and become a more confident baker.',
        content: `
          <h2>Learning from Mistakes</h2>
          <p>Every baker makes mistakes – it's part of the learning process! Here are some of the most common baking mistakes and how to avoid them.</p>

          <h3>Measuring Mistakes</h3>
          <p>Accurate measurements are crucial in baking:</p>
          <ul>
            <li><strong>Using volume instead of weight:</strong> Invest in a kitchen scale for consistent results</li>
            <li><strong>Packing flour into cups:</strong> Spoon flour lightly into measuring cups</li>
            <li><strong>Not leveling ingredients:</strong> Level off dry ingredients with a straight edge</li>
          </ul>

          <h3>Temperature Troubles</h3>
          <p>Temperature control is essential for success:</p>
          <ul>
            <li><strong>Cold ingredients:</strong> Bring eggs and butter to room temperature unless specified otherwise</li>
            <li><strong>Oven temperature:</strong> Use an oven thermometer to verify accuracy</li>
            <li><strong>Opening the oven door:</strong> Resist peeking until at least 75% of baking time has passed</li>
          </ul>

          <h3>Mixing Mishaps</h3>
          <p>How you mix can make or break your baked goods:</p>
          <ul>
            <li><strong>Overmixing:</strong> Stop mixing as soon as ingredients are combined</li>
            <li><strong>Undermixing:</strong> Make sure there are no streaks of flour or butter</li>
            <li><strong>Wrong mixing method:</strong> Follow the recipe's mixing instructions precisely</li>
          </ul>

          <h3>Timing Issues</h3>
          <p>Timing is everything in baking:</p>
          <ul>
            <li><strong>Not preheating the oven:</strong> Always preheat for at least 15-20 minutes</li>
            <li><strong>Overbaking or underbaking:</strong> Use visual cues and toothpick tests</li>
            <li><strong>Not cooling properly:</strong> Follow cooling instructions to prevent sogginess</li>
          </ul>

          <p>Remember, every mistake is a learning opportunity. Keep practicing, and you'll see improvement with every bake!</p>
        `,
        slug: 'common-baking-mistakes-how-to-avoid',
        status: 'PUBLISHED',
        authorId: users[3].id, // Super User
        categories: ['Tips & Tricks', 'Beginner Guide'],
        tags: ['baking mistakes', 'tips', 'beginner', 'troubleshooting', 'techniques'],
        metaTitle: 'Avoid These Common Baking Mistakes | Expert Tips',
        metaDescription: 'Learn about common baking mistakes and how to avoid them. Improve your baking skills with these expert tips and techniques.',
        keywords: ['baking mistakes', 'baking tips', 'troubleshooting', 'baking techniques'],
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        allowComments: true,
        allowSharing: true,
      },
    }),
  ])

  console.log('✅ Created blogs:', blogs.map(b => b.title))

  // Create some sample analytics data
  console.log('📊 Creating sample analytics data...')

  // Create blog views
  for (const blog of blogs) {
    const viewCount = Math.floor(Math.random() * 100) + 50
    for (let i = 0; i < viewCount; i++) {
      await prisma.blogView.create({
        data: {
          blogId: blog.id,
          visitorId: `visitor_${Math.random().toString(36).substring(7)}`,
          timeSpent: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
          scrollDepth: Math.random() * 100,
          bounced: Math.random() > 0.7,
          viewedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      })
    }
  }

  // Create blog interactions
  for (const blog of blogs) {
    const interactionCount = Math.floor(Math.random() * 20) + 5
    for (let i = 0; i < interactionCount; i++) {
      const types = ['like', 'bookmark', 'share']
      await prisma.blogInteraction.create({
        data: {
          blogId: blog.id,
          visitorId: `visitor_${Math.random().toString(36).substring(7)}`,
          type: types[Math.floor(Math.random() * types.length)],
        },
      })
    }
  }

  // Create some approved comments
  const sampleComments = [
    { name: 'Sarah Baker', content: 'This is such a helpful guide! I\'ve been struggling with lamination and this really clarifies the process.' },
    { name: 'Mike Chef', content: 'Great article! I especially appreciate the section on seasonal ingredients. It\'s so important to use what\'s fresh.' },
    { name: 'Emma Pastry', content: 'Thank you for sharing these tips. I made so many of these mistakes when I was starting out!' },
    { name: 'David Cook', content: 'The photography in this post is beautiful. Makes me want to try making croissants again!' },
    { name: 'Lisa Home Baker', content: 'This is exactly what I needed to read. Bookmarking this for future reference!' },
  ]

  for (const blog of blogs) {
    const commentCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < commentCount; i++) {
      const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)]
      await prisma.blogComment.create({
        data: {
          blogId: blog.id,
          visitorId: `visitor_${Math.random().toString(36).substring(7)}`,
          name: randomComment.name,
          content: randomComment.content,
          approved: true, // Pre-approve for demo
          createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000), // Last 5 days
        },
      })
    }
  }

  console.log('✅ Sample analytics data created')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📝 Test Accounts:')
  console.log('🔑 Super User: superuser@pastry.com / SuperUser123!')
  console.log('👨‍💼 Admin: admin@pastry.com / Admin123!')
  console.log('✏️ Editor: editor@pastry.com / Editor123!')
  console.log('👀 Viewer: viewer@pastry.com / Viewer123!')
  console.log('\n🌐 Access:')
  console.log('📝 Blog Management: http://localhost:3001/blog-manager (Super User)')
  console.log('📊 Admin Dashboard: http://localhost:3001/dashboard (Admin/Editor)')
  console.log('📖 Public Blog: http://localhost:3001/blog (Everyone)')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })