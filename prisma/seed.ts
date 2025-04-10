/**
 * Adds seed data to your db
 *
 * @see https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Pizza' },
      create: { name: 'Pizza' },
      update: {},
    }),
    prisma.category.upsert({
      where: { name: 'Pasta' },
      create: { name: 'Pasta' },
      update: {},
    }),
    prisma.category.upsert({
      where: { name: 'Bevande' },
      create: { name: 'Bevande' },
      update: {},
    }),
  ]);

  const firstPostId = '5c03994c-fc16-47e0-bd02-d218a370a078';
  await prisma.menu.upsert({
    where: {
      id: firstPostId,
    },
    create: {
      id: firstPostId,
      title: 'First Post',
      text: 'This is an example post generated from `prisma/seed.ts`',
      price: 9.99,
      ingredients: 'ingredient1, ingredient2',
      categoryId: categories[0].id // Assign to Pizza category
    },
    update: {
      categoryId: categories[0].id // Update existing record with Pizza category
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
