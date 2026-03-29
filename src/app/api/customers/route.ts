import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/customers — List all customer groups with branches
export async function GET() {
  try {
    const customers = await prisma.customerGroup.findMany({
      where: { isActive: true },
      include: {
        branches: { where: { isActive: true } },
        contacts: { where: { isActive: true }, orderBy: { name: 'asc' } },
      },
      orderBy: { groupName: 'asc' },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('GET /api/customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

// POST /api/customers — Create a new customer group
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupName, headOfficeAddress, taxId, contactName, contactPhone, contactEmail } = body;

    if (!groupName || !headOfficeAddress) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อลูกค้าและที่อยู่' },
        { status: 400 }
      );
    }

    const customer = await prisma.customerGroup.create({
      data: {
        groupName,
        headOfficeAddress,
        taxId: taxId || null,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
      },
      include: { branches: true },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('POST /api/customers error:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
