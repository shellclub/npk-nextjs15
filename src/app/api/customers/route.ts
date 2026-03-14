import { NextResponse } from 'next/server';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

function getPrisma() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return { prisma: new PrismaClient({ adapter }), pool };
}

// GET /api/customers — List all customer groups with branches
export async function GET() {
  const { prisma, pool } = getPrisma();
  try {
    const customers = await prisma.customerGroup.findMany({
      where: { isActive: true },
      include: { branches: { where: { isActive: true } } },
      orderBy: { groupName: 'asc' },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('GET /api/customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
