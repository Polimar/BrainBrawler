/// <reference types="jest" />

import { PrismaClient } from '@prisma/client';

declare global {
  var beforeEach: jest.Lifecycle;
  var afterAll: jest.Lifecycle;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://user:password@localhost:5432/brainbrawler_test',
    },
  },
});

beforeEach(async () => {
  // Clear all data before each test
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
  
  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
    }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
}); 