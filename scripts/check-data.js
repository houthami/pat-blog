const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('=== USERS ===')
    const users = await prisma.user.findMany()
    users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`)
    })

    console.log('\n=== RECIPES ===')
    const recipes = await prisma.recipe.findMany({
      include: { author: true }
    })
    recipes.forEach(recipe => {
      console.log(`ID: ${recipe.id}, Title: ${recipe.title}, AuthorID: ${recipe.authorId}, Author: ${recipe.author.email}`)
    })

    console.log(`\nTotal Users: ${users.length}`)
    console.log(`Total Recipes: ${recipes.length}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()