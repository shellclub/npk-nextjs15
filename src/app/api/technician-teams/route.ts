import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/technician-teams — List all active teams
export async function GET() {
  try {
    const teams = await prisma.technicianTeam.findMany({
      where: { isActive: true },
      include: {
        members: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { teamName: 'asc' },
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error('GET /api/technician-teams error:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}
