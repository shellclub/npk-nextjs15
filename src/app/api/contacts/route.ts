import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/contacts?customerGroupId=xxx — List contacts for a customer group
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerGroupId = searchParams.get('customerGroupId');

    if (!customerGroupId) {
      return NextResponse.json({ error: 'customerGroupId is required' }, { status: 400 });
    }

    const contacts = await prisma.contact.findMany({
      where: { customerGroupId, isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('GET /api/contacts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST /api/contacts — Create a new contact for a customer group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, position, customerGroupId } = body;

    if (!name || !customerGroupId) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อผู้ติดต่อและเลือกลูกค้า' },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        position: position || null,
        customerGroupId,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('POST /api/contacts error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'ผู้ติดต่อนี้มีอยู่แล้วในระบบ' }, { status: 409 });
    }
    return NextResponse.json({ error: 'ไม่สามารถบันทึกข้อมูลผู้ติดต่อได้ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
