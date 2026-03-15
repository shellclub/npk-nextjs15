import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/technicians — List all technician teams
export async function GET() {
  try {
    const teams = await prisma.technicianTeam.findMany({
      where: { isActive: true },
      include: { members: true },
      orderBy: { teamName: 'asc' },
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error('GET /api/technicians error:', error);
    return NextResponse.json({ error: 'Failed to fetch technicians' }, { status: 500 });
  }
}
