import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/branches
 * Create a new branch for a customer group.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerGroupId, code, name, address, contactName, contactPhone } = body;

    if (!customerGroupId || !code?.trim() || !name?.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสสาขาและชื่อสาขา' }, { status: 400 });
    }

    const branch = await prisma.customerBranch.create({
      data: {
        customerGroupId,
        code: code.trim(),
        name: name.trim(),
        address: address?.trim() || null,
        contactName: contactName?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'รหัสสาขานี้มีอยู่แล้วในระบบ' }, { status: 409 });
    }
    return NextResponse.json({ error: 'ไม่สามารถบันทึกข้อมูลสาขาได้ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
