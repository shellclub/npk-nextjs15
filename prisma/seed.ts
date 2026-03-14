import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 เริ่ม Seed ข้อมูล...');

  // ========================================
  // 1. ข้อมูลบริษัท NPK
  // ========================================
  const company = await prisma.company.create({
    data: {
      nameTh: 'บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด',
      nameEn: 'NPK SERVICE & SUPPLY CO.,LTD',
      addressTh: 'สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000',
      addressEn: '210/19 Moo 4, Sanamchai, Mueang Suphanburi, Suphanburi 72000',
      taxId: '0725564001451',
      phones: ['09-8942-9891', '06-5961-9799', '09-3694-4591'],
      email: 'npkservice.supply@gmail.com',
      bankAccounts: {
        createMany: {
          data: [
            {
              bank: 'ธนาคารกสิกรไทย',
              branch: 'สุพรรณบุรี',
              accountName: 'บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด',
              accountNumber: '157-1-12345-6',
              accountType: 'ออมทรัพย์',
            },
            {
              bank: 'ธนาคารกรุงเทพ',
              branch: 'สุพรรณบุรี',
              accountName: 'บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด',
              accountNumber: '903-0-98765-4',
              accountType: 'กระแสรายวัน',
            },
          ],
        },
      },
    },
  });
  console.log('✅ ข้อมูลบริษัท:', company.nameTh);

  // ========================================
  // 2. ผู้ใช้งาน
  // ========================================
  const admin = await prisma.user.create({
    data: {
      email: 'admin@npkservice.com',
      password: '$2b$10$examplehashedpassword', // placeholder
      name: 'ผู้ดูแลระบบ NPK',
      role: 'ADMIN',
    },
  });
  console.log('✅ ผู้ใช้งาน:', admin.name);

  // ========================================
  // 3. ข้อมูลลูกค้า (5 กลุ่ม)
  // ========================================
  const customers = [
    {
      groupName: 'บริษัท ศุภมิตร จำกัด',
      headOfficeAddress: '1468 ถนนพัฒนาการ แขวงพัฒนาการ เขตสวนหลวง กรุงเทพฯ 10250',
      taxId: '0105528152401',
      contactName: 'คุณสมชาย',
      contactPhone: '02-123-4567',
      branches: [
        { code: 'store036', name: 'Lotuss 10089 H0539:Rayong A5' },
        { code: 'store037', name: 'Lotuss 10090 H0540:Chonburi A3' },
      ],
    },
    {
      groupName: 'บริษัท เซ็นทรัล พัฒนา จำกัด (มหาชน)',
      headOfficeAddress: '999/9 ถนนพระราม1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330',
      taxId: '0107536000269',
      contactName: 'คุณสมศรี',
      contactPhone: '02-987-6543',
      branches: [
        { code: 'CPN001', name: 'Central World' },
        { code: 'CPN002', name: 'Central Ladprao' },
        { code: 'CPN003', name: 'Central Westgate' },
      ],
    },
    {
      groupName: 'บริษัท โฮมโปร เซ็นเตอร์ จำกัด (มหาชน)',
      headOfficeAddress: '31 ซอยพัฒนาการ 20 แขวงสวนหลวง เขตสวนหลวง กรุงเทพฯ 10250',
      taxId: '0107537001528',
      contactName: 'คุณวิชัย',
      contactPhone: '02-765-4321',
      branches: [
        { code: 'HP001', name: 'HomePro ราชพฤกษ์' },
        { code: 'HP002', name: 'HomePro รังสิต' },
      ],
    },
    {
      groupName: 'บริษัท สยามพิวรรธน์ จำกัด',
      headOfficeAddress: '989 ถนนพระราม1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330',
      taxId: '0105531012345',
      contactName: 'คุณนิภา',
      contactPhone: '02-555-9999',
      branches: [
        { code: 'SP001', name: 'Siam Paragon' },
      ],
    },
    {
      groupName: 'บริษัท เดอะมอลล์กรุ๊ป จำกัด',
      headOfficeAddress: '3522 ถนนลาดพร้าว แขวงคลองจั่น เขตบางกะปิ กรุงเทพฯ 10240',
      taxId: '0105527098765',
      contactName: 'คุณประภา',
      contactPhone: '02-310-1000',
      branches: [
        { code: 'TMG001', name: 'The Mall บางแค' },
        { code: 'TMG002', name: 'The Mall งามวงศ์วาน' },
      ],
    },
  ];

  for (const cust of customers) {
    await prisma.customerGroup.create({
      data: {
        groupName: cust.groupName,
        headOfficeAddress: cust.headOfficeAddress,
        taxId: cust.taxId,
        contactName: cust.contactName,
        contactPhone: cust.contactPhone,
        branches: {
          createMany: {
            data: cust.branches.map((b) => ({
              code: b.code,
              name: b.name,
            })),
          },
        },
      },
    });
  }
  console.log('✅ ข้อมูลลูกค้า:', customers.length, 'กลุ่ม');

  // ========================================
  // 4. ข้อมูลทีมช่าง (4 ทีม)
  // ========================================
  const teams = [
    {
      teamName: 'ทีม A',
      leaderName: 'นายสุชาติ วิเศษกุล',
      leaderPhone: '081-234-5678',
      members: [
        { name: 'นายประยุทธ์ แก้วดี', phone: '082-111-2222' },
        { name: 'นายสมพงษ์ ใจดี', phone: '083-333-4444' },
      ],
    },
    {
      teamName: 'ทีม B',
      leaderName: 'นายวิชัย เจริญสุข',
      leaderPhone: '084-567-8901',
      members: [
        { name: 'นายอนุชา สุขใจ', phone: '085-555-6666' },
        { name: 'นายกิตติ ดีงาม', phone: '086-777-8888' },
      ],
    },
    {
      teamName: 'ทีม C',
      leaderName: 'นายประสิทธิ์ มั่นคง',
      leaderPhone: '087-890-1234',
      members: [
        { name: 'นายธนา พิทักษ์', phone: '088-999-0000' },
      ],
    },
    {
      teamName: 'ทีม D',
      leaderName: 'นายสมชาย รุ่งเรือง',
      leaderPhone: '089-012-3456',
      members: [
        { name: 'นายอำนาจ แข็งแกร่ง', phone: '090-111-2222' },
        { name: 'นายพิชัย กล้าหาญ', phone: '091-333-4444' },
        { name: 'นายสุวรรณ ทองดี', phone: '092-555-6666' },
      ],
    },
  ];

  for (const team of teams) {
    await prisma.technicianTeam.create({
      data: {
        teamName: team.teamName,
        leaderName: team.leaderName,
        leaderPhone: team.leaderPhone,
        members: {
          createMany: {
            data: team.members.map((m) => ({
              name: m.name,
              phone: m.phone,
            })),
          },
        },
      },
    });
  }
  console.log('✅ ข้อมูลทีมช่าง:', teams.length, 'ทีม');

  console.log('\n🎉 Seed ข้อมูลเสร็จสมบูรณ์!');
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
