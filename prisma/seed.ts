import { PrismaClient, BlogStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Platform admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Platform Admin',
      password: hashedPassword,
      role: 'PLATFORM_ADMIN',
    },
  })

  // Site owner 1 - Pastry blog
  const pastryOwner = await prisma.user.upsert({
    where: { email: 'baker@example.com' },
    update: {},
    create: {
      email: 'baker@example.com',
      name: 'Sarah Baker',
      password: hashedPassword,
      role: 'SITE_OWNER',
    },
  })

  // Site owner 2 - Tech blog
  const techOwner = await prisma.user.upsert({
    where: { email: 'dev@example.com' },
    update: {},
    create: {
      email: 'dev@example.com',
      name: 'Alex Developer',
      password: hashedPassword,
      role: 'SITE_OWNER',
    },
  })

  // Viewer user
  const viewer = await prisma.user.upsert({
    where: { email: 'reader@example.com' },
    update: {},
    create: {
      email: 'reader@example.com',
      name: 'John Reader',
      password: hashedPassword,
      role: 'VIEWER',
    },
  })

  // Create pastry site
  const pastrySite = await prisma.site.create({
    data: {
      name: 'Sweet Delights Bakery',
      slug: 'sweet-delights-bakery',
      subdomain: 'pastry',
      description: 'A blog about artisanal pastries, baking techniques, and sweet treats that bring joy to every occasion.',
      status: 'ACTIVE',
      category: 'food',
      tags: ['baking', 'pastries', 'desserts', 'recipes', 'cooking'],
      theme: 'modern',
      primaryColor: '#ff6b35',
      metaTitle: 'Sweet Delights Bakery - Artisanal Pastries & Baking Tips',
      metaDescription: 'Discover amazing pastry recipes, baking techniques, and sweet treats from our professional bakery.',
      totalViews: 1250,
      totalPosts: 0,
      totalSubscribers: 45,
      ownerId: pastryOwner.id,
    },
  })

  // Create tech site
  const techSite = await prisma.site.create({
    data: {
      name: 'Code & Coffee',
      slug: 'code-and-coffee',
      subdomain: 'tech',
      description: 'A developer blog covering modern web technologies, coding best practices, and the latest in software development.',
      status: 'ACTIVE',
      category: 'technology',
      tags: ['programming', 'web-dev', 'javascript', 'react', 'nextjs'],
      theme: 'minimal',
      primaryColor: '#0066cc',
      metaTitle: 'Code & Coffee - Web Development Blog',
      metaDescription: 'Learn web development, JavaScript, React, and modern programming techniques with practical tutorials.',
      totalViews: 2400,
      totalPosts: 0,
      totalSubscribers: 128,
      ownerId: techOwner.id,
    },
  })

  // Create blog posts for pastry site
  const pastryPosts = [
    {
      title: 'The Perfect Croissant: A Step-by-Step Guide',
      slug: 'perfect-croissant-guide',
      description: 'Learn the art of making buttery, flaky croissants from scratch with this comprehensive guide.',
      content: `Making the perfect croissant is an art that requires patience, precision, and practice. In this guide, I'll walk you through every step of the process, from preparing the dough to achieving those beautiful, flaky layers.

**Ingredients:**
- 500g bread flour
- 10g salt
- 50g sugar
- 10g fresh yeast
- 300ml cold water
- 250g cold butter

**The Process:**

The key to great croissants lies in the lamination process - creating thin layers of butter between the dough. This technique, when done correctly, creates the signature flaky texture we all love.

Start by making your détrempe (the base dough). Mix flour, salt, sugar, and yeast, then gradually add cold water. Knead until smooth but don't overwork - we want a slightly firm dough.

The butter block (beurrage) should be pliable but not soft. Pound it into a rectangle and wrap it in plastic. Both the dough and butter should be at similar temperatures when you begin lamination.

**Lamination Steps:**

Roll your dough into a rectangle twice the size of your butter block. Place the butter in the center and fold the dough over it like an envelope. This is your first "turn."

Roll gently but firmly, keeping the edges straight. Fold into thirds (letter fold) - this is one complete turn. Wrap and refrigerate for 30 minutes.

Repeat this process two more times, for a total of three turns. Each turn creates more layers - by the end, you'll have 81 layers of butter and dough!

**Shaping and Baking:**

After the final rest, roll the dough into a large rectangle about 5mm thick. Cut into triangles and roll from the wide end to form crescents.

Let them proof in a warm place until puffy but not doubled. Brush with egg wash and bake at 200°C for 15-20 minutes until golden brown.

The result? Croissants with hundreds of paper-thin layers that create the most incredible texture. Patience truly pays off in pastry making!`,
      status: BlogStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab794f27c2e7',
      metaTitle: 'How to Make Perfect Croissants - Step by Step Guide',
      metaDescription: 'Master the art of croissant making with this detailed guide covering lamination, shaping, and baking techniques.',
      tags: ['croissants', 'lamination', 'french-pastry', 'baking-technique'],
      allowComments: true,
      publishedAt: new Date('2024-01-15'),
      siteId: pastrySite.id,
      authorId: pastryOwner.id,
    },
    {
      title: 'Seasonal Fruit Tarts: Spring Edition',
      slug: 'seasonal-fruit-tarts-spring',
      description: 'Celebrate spring with these beautiful fruit tarts featuring fresh strawberries, rhubarb, and early summer berries.',
      content: `Spring is the perfect time to showcase fresh, vibrant fruits in elegant tarts. Today, I'm sharing three of my favorite spring fruit tart recipes that are as beautiful as they are delicious.

**Classic Strawberry Tart**

Nothing says spring like fresh strawberries! This classic tart features a crisp pâte sucrée base, silky pastry cream, and perfectly arranged strawberries.

For the pastry cream, I use a traditional recipe with vanilla beans for that authentic flavor. The secret is cooking it slowly and whisking constantly to achieve the perfect smooth texture.

**Rhubarb and Custard Tart**

Rhubarb's tartness pairs beautifully with sweet vanilla custard. I like to roast the rhubarb first with a touch of sugar to concentrate the flavors before arranging it on the tart.

**Mixed Berry Galette**

For a more rustic approach, try a free-form galette with mixed spring berries. The beauty of galettes is their imperfect perfection - they're meant to look homemade and welcoming.

**Pro Tips:**

1. Always blind bake your tart shells to prevent soggy bottoms
2. Use a pastry brush to apply apricot glaze for a professional finish
3. Arrange fruits in patterns for visual impact
4. Serve the same day for best texture

These tarts are perfect for spring entertaining or simply treating yourself to something special. The combination of buttery pastry, creamy filling, and fresh fruit is simply irresistible!`,
      status: BlogStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3',
      metaTitle: 'Spring Fruit Tarts - Fresh Strawberry and Rhubarb Recipes',
      metaDescription: 'Beautiful spring fruit tart recipes featuring strawberries, rhubarb, and mixed berries with pastry cream.',
      tags: ['fruit-tarts', 'spring-recipes', 'strawberries', 'rhubarb', 'pastry-cream'],
      allowComments: true,
      publishedAt: new Date('2024-02-01'),
      siteId: pastrySite.id,
      authorId: pastryOwner.id,
    },
    {
      title: 'Mastering Macarons: Troubleshooting Common Issues',
      slug: 'mastering-macarons-troubleshooting',
      description: 'Overcome the challenges of macaron making with solutions to the most common problems bakers face.',
      content: `Macarons are notorious for being finicky, but with the right knowledge, you can troubleshoot most issues and achieve consistent results.

**Common Problems and Solutions:**

**Cracked Tops**
- Cause: Oven too hot or macarons not rested long enough
- Solution: Lower temperature by 10-15°C and rest until you can gently touch the surface without batter sticking to your finger

**No Feet**
- Cause: Over-mixed batter or insufficient resting
- Solution: Stop mixing when batter flows like thick lava; rest until a skin forms

**Lopsided Shells**
- Cause: Uneven piping or air bubbles
- Solution: Use a template and tap pans firmly to release air bubbles

**Hollow Shells**
- Cause: Over-whipped egg whites or incorrect oven temperature
- Solution: Whip whites to soft peaks only; use an oven thermometer

**The Perfect Macaron Method:**

1. Weigh ingredients precisely - even 5g can make a difference
2. Age egg whites for 24-48 hours at room temperature
3. Sift almond flour and powdered sugar together twice
4. Mix to the perfect macaronage consistency
5. Rest until skin forms
6. Bake with proper temperature and timing

Remember, every oven is different. Keep detailed notes of what works in your kitchen, and don't get discouraged by early failures - even professional pastry chefs had to practice!

With patience and practice, you'll be making perfect macarons consistently. The key is understanding the science behind each step and making adjustments based on your environment and equipment.`,
      status: BlogStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1558312657-b95ea45bde4e',
      metaTitle: 'Macaron Troubleshooting Guide - Perfect Macarons Every Time',
      metaDescription: 'Solve common macaron problems with this comprehensive troubleshooting guide for home bakers.',
      tags: ['macarons', 'troubleshooting', 'french-pastry', 'baking-tips'],
      allowComments: true,
      publishedAt: new Date('2024-02-15'),
      siteId: pastrySite.id,
      authorId: pastryOwner.id,
    },
  ]

  // Create blog posts for tech site
  const techPosts = [
    {
      title: 'Building Scalable React Applications with Next.js 14',
      slug: 'scalable-react-nextjs-14',
      description: 'Learn how to architect and build scalable React applications using the latest features in Next.js 14.',
      content: `Next.js 14 brings powerful new features that make building scalable React applications easier than ever. In this post, we'll explore the key architectural patterns and best practices for large-scale applications.

**App Router Architecture**

The new App Router in Next.js 13+ provides a more intuitive way to structure your application:

\`\`\`
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── dashboard/
│   ├── settings/
│   └── analytics/
└── layout.tsx
\`\`\`

Route groups allow you to organize routes without affecting the URL structure, while nested layouts enable shared UI components across different sections.

**Server Components by Default**

Next.js 14 makes Server Components the default, which offers several benefits:

- Reduced JavaScript bundle size
- Better SEO and initial page load
- Direct database access
- Improved security

**Data Fetching Patterns**

Modern data fetching in Next.js involves several patterns:

1. **Server-side data fetching** with async components
2. **Client-side state management** with React Query or SWR
3. **Streaming** with Suspense boundaries
4. **Partial pre-rendering** for optimal performance

**Performance Optimizations**

Key strategies for scalable applications:

- Code splitting with dynamic imports
- Image optimization with next/image
- Font optimization
- Bundle analysis and tree shaking
- Edge runtime for faster responses

**State Management**

For large applications, consider:

- Zustand for simple global state
- Redux Toolkit for complex state logic
- React Query for server state
- Context API for shared UI state

**Testing Strategy**

A comprehensive testing approach includes:

- Unit tests with Jest and React Testing Library
- Integration tests for critical user flows
- E2E tests with Playwright
- Visual regression testing

**Deployment and Monitoring**

Production considerations:

- Vercel for seamless deployment
- Analytics and error tracking
- Performance monitoring
- Progressive Web App features

Building scalable React applications requires thoughtful architecture from the start. Next.js 14 provides the tools, but the patterns and practices we choose determine long-term maintainability.`,
      status: BlogStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
      metaTitle: 'Building Scalable React Apps with Next.js 14 - Complete Guide',
      metaDescription: 'Master Next.js 14 architecture patterns, performance optimization, and best practices for scalable React applications.',
      tags: ['nextjs', 'react', 'scalability', 'web-development', 'javascript'],
      allowComments: true,
      publishedAt: new Date('2024-01-20'),
      siteId: techSite.id,
      authorId: techOwner.id,
    },
    {
      title: 'TypeScript Best Practices for Large Projects',
      slug: 'typescript-best-practices-large-projects',
      description: 'Essential TypeScript patterns and practices for maintaining large codebases with multiple developers.',
      content: `TypeScript shines in large projects where type safety and developer experience matter most. Here are the essential practices I've learned from maintaining enterprise-scale applications.

**Project Structure**

Organize your TypeScript project for scale:

\`\`\`
src/
├── types/
│   ├── api.ts
│   ├── common.ts
│   └── index.ts
├── utils/
├── hooks/
├── components/
└── services/
\`\`\`

**Type Definition Strategies**

1. **Centralized type definitions** in a dedicated types folder
2. **API response types** generated from OpenAPI specs
3. **Utility types** for common transformations
4. **Branded types** for domain-specific values

**Advanced Type Patterns**

Essential patterns for complex applications:

- Conditional types for dynamic behavior
- Mapped types for transformations
- Template literal types for string manipulation
- Discriminated unions for state management

**Configuration Best Practices**

Your \`tsconfig.json\` should be strict:

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
\`\`\`

**Error Handling**

Type-safe error handling patterns:

- Result types for operations that can fail
- Error boundaries with typed error states
- Exhaustive error checking with discriminated unions

**Performance Considerations**

- Use type-only imports when possible
- Leverage module augmentation sparingly
- Avoid complex computed types in hot paths
- Use build tools that support incremental compilation

**Team Guidelines**

For large teams working with TypeScript:

- Establish naming conventions
- Use ESLint with TypeScript rules
- Implement pre-commit hooks
- Document complex type definitions
- Regular code reviews focusing on type design

**Migration Strategies**

When adopting TypeScript in existing projects:

- Start with \`allowJs: true\`
- Convert files incrementally
- Use \`@ts-expect-error\` for gradual migration
- Focus on API boundaries first

TypeScript's real power emerges in large codebases where the initial investment in proper typing pays dividends in maintainability, refactoring safety, and developer confidence.`,
      status: BlogStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0',
      metaTitle: 'TypeScript Best Practices for Large Projects - Developer Guide',
      metaDescription: 'Essential TypeScript patterns, project structure, and team practices for maintaining large-scale applications.',
      tags: ['typescript', 'best-practices', 'large-projects', 'enterprise', 'team-development'],
      allowComments: true,
      publishedAt: new Date('2024-02-05'),
      siteId: techSite.id,
      authorId: techOwner.id,
    },
  ]

  // Create the blog posts
  for (const postData of pastryPosts) {
    await prisma.blog.create({ data: postData })
  }

  for (const postData of techPosts) {
    await prisma.blog.create({ data: postData })
  }

  // Update site post counts
  await prisma.site.update({
    where: { id: pastrySite.id },
    data: { totalPosts: pastryPosts.length },
  })

  await prisma.site.update({
    where: { id: techSite.id },
    data: { totalPosts: techPosts.length },
  })

  console.log('✅ Database seeded successfully!')
  console.log('\n📊 Created:')
  console.log(`👥 Users: 4`)
  console.log(`🏠 Sites: 2`)
  console.log(`📝 Blog posts: ${pastryPosts.length + techPosts.length}`)
  console.log('\n🔐 Test credentials:')
  console.log('Platform Admin: admin@example.com / password123')
  console.log('Pastry Owner: baker@example.com / password123')
  console.log('Tech Owner: dev@example.com / password123')
  console.log('Viewer: reader@example.com / password123')
  console.log('\n🌐 Test sites:')
  console.log('Pastry blog: http://localhost:3000 (subdomain: pastry)')
  console.log('Tech blog: http://localhost:3000 (subdomain: tech)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })