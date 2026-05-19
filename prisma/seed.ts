import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Prisma Seed] Starting database seeding...');

  // 1. Clean existing records to avoid duplicate key errors during repeated seeds
  await prisma.menuItem.deleteMany();
  await prisma.customerSession.deleteMany();
  await prisma.order.deleteMany();
  await prisma.merchant.deleteMany();

  // 2. Create test merchant profile
  const merchant = await prisma.merchant.create({
    data: {
      id: 'test-merchant-1234',
      name: 'Chai & Chutney',
      phone: '+919876543210',
      apiKey: 'test-api-key-5555',
    },
  });

  console.log(`[Prisma Seed] Created merchant: "${merchant.name}" (ID: ${merchant.id})`);

  // 3. Seed menu items along with their Hinglish aliases
  const menuItems = [
    {
      name: 'Paneer Butter Masala',
      price: 249.00,
      description: 'Rich and creamy curry with cottage cheese cubes in butter-tomato gravy.',
      aliases: ['pbm', 'paneer butter', 'butter paneer', 'paneer masala', 'paneer curry'],
    },
    {
      name: 'Butter Chicken',
      price: 299.00,
      description: 'Classic Indian dish made of chicken in a mildly spiced tomato-butter sauce.',
      aliases: ['butter chicken', 'chicken butter', 'bc', 'chicken masala', 'non-veg butter chicken'],
    },
    {
      name: 'Garlic Naan',
      price: 60.00,
      description: 'Tandoor-baked flatbread infused with fresh minced garlic and butter.',
      aliases: ['garlic naan', 'naan garlic', 'garlic naan butter', 'naan', 'roti'],
    },
    {
      name: 'Veg Biryani',
      price: 220.00,
      description: 'Fragrant basmati rice cooked with fresh seasonal vegetables and aromatic spices.',
      aliases: ['veg biryani', 'biryani', 'veg biriyani', 'biryani rice', 'pulao'],
    },
    {
      name: 'Mango Lassi',
      price: 80.00,
      description: 'Refreshing cold yogurt drink blended with fresh sweet mango pulp.',
      aliases: ['mango lassi', 'lassi', 'mango drink', 'cold lassi', 'mango shake'],
    },
  ];

  for (const item of menuItems) {
    const createdItem = await prisma.menuItem.create({
      data: {
        merchantId: merchant.id,
        name: item.name,
        price: item.price,
        description: item.description,
        aliases: item.aliases,
      },
    });
    console.log(`[Prisma Seed] Created MenuItem: "${createdItem.name}" with aliases [${createdItem.aliases.join(', ')}]`);
  }

  console.log('[Prisma Seed] Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Prisma Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
