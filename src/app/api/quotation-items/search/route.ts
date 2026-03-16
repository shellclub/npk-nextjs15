import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/quotation-items/search?q=keyword
 * Search existing quotation items by description for autocomplete suggestions.
 * Returns unique items with description, unit, and unitPrice.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  if (q.length < 1) {
    return NextResponse.json([]);
  }

  try {
    // Search items matching the keyword, get distinct description+unit+unitPrice combos
    const items = await prisma.quotationItem.findMany({
      where: {
        description: { contains: q, mode: 'insensitive' },
      },
      select: {
        description: true,
        unit: true,
        unitPrice: true,
      },
      orderBy: { description: 'asc' },
      take: 50,
    });

    // Deduplicate by description (keep the latest unit+price)
    const uniqueMap = new Map<string, { description: string; unit: string; unitPrice: number }>();
    for (const item of items) {
      if (!uniqueMap.has(item.description)) {
        uniqueMap.set(item.description, {
          description: item.description,
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
        });
      }
    }

    return NextResponse.json(Array.from(uniqueMap.values()));
  } catch (error) {
    console.error('Error searching items:', error);
    return NextResponse.json([]);
  }
}
