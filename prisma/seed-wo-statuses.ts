import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const defaults = [
    { name: 'รอดำเนินการ', code: 'PENDING', color: '#D97706', bgColor: '#FEF3C7', sortOrder: 1, isDefault: true },
    { name: 'กำลังดำเนินการ', code: 'IN_PROGRESS', color: '#2563EB', bgColor: '#DBEAFE', sortOrder: 2 },
    { name: 'เสร็จสิ้น', code: 'COMPLETED', color: '#059669', bgColor: '#D1FAE5', sortOrder: 3 },
    { name: 'จ่ายแล้ว', code: 'PAID', color: '#4F46E5', bgColor: '#E0E7FF', sortOrder: 4 },
    { name: 'ยกเลิก', code: 'CANCELLED', color: '#DC2626', bgColor: '#FEE2E2', sortOrder: 5 },
  ];

  for (const s of defaults) {
    await prisma.workOrderStatusConfig.upsert({
      where: { code: s.code },
      update: { name: s.name, color: s.color, bgColor: s.bgColor, sortOrder: s.sortOrder },
      create: s,
    });
  }
  console.log('✅ Seeded WO statuses successfully');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
