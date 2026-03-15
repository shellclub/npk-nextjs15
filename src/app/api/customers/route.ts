import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/customers — List all customer groups with branches
export async function GET() {
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
  }
}
