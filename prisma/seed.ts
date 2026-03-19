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
  const existingCompany = await prisma.company.findFirst();
  const company = existingCompany || await prisma.company.create({
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
  const existingAdmin = await prisma.user.findFirst({ where: { email: 'admin@npkservice.com' } });
  const admin = existingAdmin || await prisma.user.create({
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

  const existingCustomers = await prisma.customerGroup.count();
  if (existingCustomers === 0) {
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
  } else {
    console.log('⏭️ ข้อมูลลูกค้ามีอยู่แล้ว, ข้าม');
  }

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

  const existingTeams = await prisma.technicianTeam.count();
  if (existingTeams === 0) {
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
  } else {
    console.log('⏭️ ข้อมูลทีมช่างมีอยู่แล้ว, ข้าม');
  }

  // ========================================
  // 5. ใบเสนอราคา Demo (6 ใบ)
  // ========================================
  const existingQuotations = await prisma.quotation.count();
  if (existingQuotations > 0) {
    console.log('⏭️ ใบเสนอราคามีอยู่แล้ว, ข้าม');
  } else {
  const allCustomers = await prisma.customerGroup.findMany({
    include: { branches: true },
  });
  const adminUser = await prisma.user.findFirst();

  if (adminUser && allCustomers.length > 0) {
    const quotationsData = [
      {
        quotationNumber: 'npk-260301-001',
        date: new Date('2026-03-01'),
        customer: allCustomers[0], // ศุภมิตร
        branchIndex: 0, // store036
        contactPerson: 'คุณสมชาย',
        projectName: 'ติดตั้งระบบ CCTV สาขา Rayong',
        status: 'APPROVED' as const,
        validDays: 30,
        discountPercent: 5,
        vatPercent: 7,
        notes: 'ติดตั้งภายใน 15 วันทำการ',
        warranty: 'รับประกันอุปกรณ์ 2 ปี, งานติดตั้ง 1 ปี',
        items: [
          { description: 'กล้อง CCTV Hikvision 2MP (DS-2CE10DF0T-FS)', unit: 'ตัว', quantity: 16, unitPrice: 2500 },
          { description: 'เครื่องบันทึก DVR 16CH Hikvision', unit: 'เครื่อง', quantity: 1, unitPrice: 12000 },
          { description: 'HDD WD Purple 4TB สำหรับกล้องวงจรปิด', unit: 'ตัว', quantity: 2, unitPrice: 4500 },
          { description: 'สาย RG6 + สายไฟ พร้อมอุปกรณ์เดินสาย', unit: 'ล็อต', quantity: 1, unitPrice: 15000 },
          { description: 'ค่าติดตั้งระบบกล้องวงจรปิดพร้อมตั้งค่า', unit: 'งาน', quantity: 1, unitPrice: 25000 },
          { description: 'จอ Monitor 22" สำหรับดูภาพกล้อง', unit: 'ตัว', quantity: 1, unitPrice: 4500 },
        ],
      },
      {
        quotationNumber: 'npk-260305-001',
        date: new Date('2026-03-05'),
        customer: allCustomers[1], // เซ็นทรัล พัฒนา
        branchIndex: 0, // Central World
        contactPerson: 'คุณสมศรี',
        projectName: 'ปรับปรุงระบบ Network ชั้น 3-5',
        status: 'SENT' as const,
        validDays: 30,
        discountPercent: 3,
        vatPercent: 7,
        notes: 'ทำงานนอกเวลาทำการ (22:00-06:00)',
        warranty: 'รับประกันงานติดตั้ง 1 ปี',
        items: [
          { description: 'Switch Cisco SG350-28P 28-Port PoE', unit: 'เครื่อง', quantity: 6, unitPrice: 35000 },
          { description: 'Access Point Cisco Business CBW240AC', unit: 'ตัว', quantity: 12, unitPrice: 8500 },
          { description: 'สาย UTP Cat6A พร้อมเข้าหัว RJ45', unit: 'จุด', quantity: 120, unitPrice: 650 },
          { description: 'Patch Panel 24 Port Cat6A', unit: 'ตัว', quantity: 6, unitPrice: 3500 },
          { description: 'ตู้ Rack 42U พร้อมอุปกรณ์', unit: 'ตู้', quantity: 1, unitPrice: 18000 },
          { description: 'ค่าติดตั้งและตั้งค่าระบบเครือข่าย', unit: 'งาน', quantity: 1, unitPrice: 45000 },
        ],
      },
      {
        quotationNumber: 'npk-260308-001',
        date: new Date('2026-03-08'),
        customer: allCustomers[2], // HomePro
        branchIndex: 0, // HomePro ราชพฤกษ์
        contactPerson: 'คุณวิชัย',
        projectName: 'ติดตั้งระบบ Access Control',
        status: 'APPROVED' as const,
        validDays: 15,
        discountPercent: 0,
        vatPercent: 7,
        notes: '',
        warranty: 'รับประกันอุปกรณ์ 1 ปี, งานติดตั้ง 6 เดือน',
        items: [
          { description: 'เครื่องสแกนลายนิ้วมือ ZKTeco SpeedFace-V5L', unit: 'เครื่อง', quantity: 4, unitPrice: 15000 },
          { description: 'อุปกรณ์ล็อคประตูไฟฟ้า Magnetic Lock 600lbs', unit: 'ตัว', quantity: 4, unitPrice: 3500 },
          { description: 'แหล่งจ่ายไฟ Access Control 12V 5A', unit: 'ตัว', quantity: 4, unitPrice: 2500 },
          { description: 'สายสัญญาณและอุปกรณ์เดินสาย', unit: 'ล็อต', quantity: 1, unitPrice: 8000 },
          { description: 'ค่าติดตั้งพร้อมตั้งค่าระบบ', unit: 'งาน', quantity: 1, unitPrice: 18000 },
        ],
      },
      {
        quotationNumber: 'npk-260310-001',
        date: new Date('2026-03-10'),
        customer: allCustomers[3], // สยามพิวรรธน์
        branchIndex: 0, // Siam Paragon
        contactPerson: 'คุณนิภา',
        projectName: 'ย้ายจุดระบบ IT ชั้น B1',
        status: 'REJECTED' as const,
        validDays: 30,
        discountPercent: 0,
        vatPercent: 7,
        notes: 'ลูกค้าแจ้งว่างบประมาณเกิน ขอเสนอใหม่',
        warranty: 'รับประกันงานติดตั้ง 1 ปี',
        items: [
          { description: 'ย้ายจุด LAN พร้อมเดินสายใหม่', unit: 'จุด', quantity: 30, unitPrice: 1200 },
          { description: 'ย้ายจุด CCTV พร้อมติดตั้งใหม่', unit: 'จุด', quantity: 8, unitPrice: 2500 },
          { description: 'ค่ารื้อถอนระบบเดิม', unit: 'งาน', quantity: 1, unitPrice: 15000 },
          { description: 'อุปกรณ์สิ้นเปลือง (แคลมป์, ท่อ PVC, กล่องพัก)', unit: 'ล็อต', quantity: 1, unitPrice: 12000 },
        ],
      },
      {
        quotationNumber: 'npk-260312-001',
        date: new Date('2026-03-12'),
        customer: allCustomers[4], // เดอะมอลล์กรุ๊ป
        branchIndex: 1, // The Mall งามวงศ์วาน
        contactPerson: 'คุณประภา',
        projectName: 'ติดตั้ง WiFi สำหรับลูกค้า Free WiFi Zone',
        status: 'APPROVED' as const,
        validDays: 30,
        discountPercent: 10,
        vatPercent: 7,
        notes: 'ระยะเวลาติดตั้ง 7 วันทำการ',
        warranty: 'รับประกันอุปกรณ์ 3 ปี, งานติดตั้ง 1 ปี',
        items: [
          { description: 'Access Point Ubiquiti UniFi U6 Pro', unit: 'ตัว', quantity: 20, unitPrice: 6500 },
          { description: 'Switch Ubiquiti USW-Pro-24-PoE', unit: 'เครื่อง', quantity: 2, unitPrice: 28000 },
          { description: 'UniFi Cloud Gateway Ultra', unit: 'เครื่อง', quantity: 1, unitPrice: 8500 },
          { description: 'สาย UTP Cat6 เดินใหม่พร้อมอุปกรณ์', unit: 'จุด', quantity: 20, unitPrice: 550 },
          { description: 'ค่าออกแบบระบบ WiFi (Site Survey)', unit: 'งาน', quantity: 1, unitPrice: 15000 },
          { description: 'ค่าติดตั้งและตั้งค่า Captive Portal', unit: 'งาน', quantity: 1, unitPrice: 35000 },
        ],
      },
      {
        quotationNumber: 'npk-260315-001',
        date: new Date('2026-03-15'),
        customer: allCustomers[0], // ศุภมิตร
        branchIndex: 1, // store037 Chonburi
        contactPerson: 'คุณสมชาย',
        projectName: 'เพิ่มกล้อง CCTV สาขา Chonburi',
        status: 'DRAFT' as const,
        validDays: 30,
        discountPercent: 5,
        vatPercent: 7,
        notes: '',
        warranty: 'รับประกันอุปกรณ์ 2 ปี, งานติดตั้ง 1 ปี',
        items: [
          { description: 'กล้อง CCTV Hikvision 4MP ColorVu (DS-2CE72KF0T)', unit: 'ตัว', quantity: 8, unitPrice: 4200 },
          { description: 'เครื่องบันทึก DVR 8CH Hikvision', unit: 'เครื่อง', quantity: 1, unitPrice: 8500 },
          { description: 'HDD WD Purple 2TB', unit: 'ตัว', quantity: 1, unitPrice: 2800 },
          { description: 'สาย RG6 + สายไฟ พร้อมอุปกรณ์เดินสาย', unit: 'ล็อต', quantity: 1, unitPrice: 8000 },
          { description: 'ค่าติดตั้งและตั้งค่าระบบ', unit: 'งาน', quantity: 1, unitPrice: 15000 },
        ],
      },
    ];

    for (const q of quotationsData) {
      const branch = q.customer.branches[q.branchIndex];

      // Calculate amounts
      const subtotal = q.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const discountAmount = (subtotal * q.discountPercent) / 100;
      const afterDiscount = subtotal - discountAmount;
      const vatAmount = (afterDiscount * q.vatPercent) / 100;
      const totalAmount = afterDiscount + vatAmount;

      await prisma.quotation.create({
        data: {
          quotationNumber: q.quotationNumber,
          date: q.date,
          customerGroupId: q.customer.id,
          branchId: branch?.id || null,
          contactPerson: q.contactPerson,
          projectName: q.projectName,
          subtotal,
          discountPercent: q.discountPercent,
          discountAmount,
          vatPercent: q.vatPercent,
          vatAmount,
          totalAmount,
          status: q.status,
          notes: q.notes,
          validDays: q.validDays,
          warranty: q.warranty,
          createdById: adminUser.id,
          items: {
            createMany: {
              data: q.items.map((item, idx) => ({
                itemOrder: idx + 1,
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.quantity * item.unitPrice,
              })),
            },
          },
        },
      });
    }
    console.log('✅ ใบเสนอราคา:', quotationsData.length, 'ใบ');
  }
  } // end else (existingQuotations === 0)

  // ========================================
  // 6. Work Order Demo (5 รายการ)
  // ========================================
  const existingWO = await prisma.workOrder.count();
  if (existingWO > 0) {
    console.log('⏭️ Work Order มีอยู่แล้ว, ข้าม');
  } else {
    const allQuotations = await prisma.quotation.findMany({
      where: { status: 'APPROVED' },
      include: { customerGroup: true, branch: true },
      orderBy: { createdAt: 'asc' },
    });
    const allTeams = await prisma.technicianTeam.findMany();
    const adminUser2 = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    if (adminUser2 && allQuotations.length > 0 && allTeams.length > 0) {
      const woData = [
        {
          woNumber: 'WO-260301-001',
          quotationIndex: 0,
          teamIndex: 0,
          date: new Date('2026-03-02'),
          startDate: new Date('2026-03-05'),
          endDate: new Date('2026-03-07'),
          description: 'ติดตั้งระบบ CCTV สาขา Rayong ตามใบเสนอราคา',
          status: 'COMPLETED' as const,
          notes: 'งานเสร็จตามกำหนด ลูกค้ารับมอบงานเรียบร้อย',
        },
        {
          woNumber: 'WO-260305-001',
          quotationIndex: 1,
          teamIndex: 1,
          date: new Date('2026-03-06'),
          startDate: new Date('2026-03-08'),
          endDate: new Date('2026-03-10'),
          description: 'ติดตั้ง WiFi Free WiFi Zone - เดอะมอลล์ งามวงศ์วาน',
          status: 'PAID' as const,
          notes: 'จ่ายเงินช่างเรียบร้อย',
        },
        {
          woNumber: 'WO-260308-001',
          quotationIndex: 2,
          teamIndex: 0,
          date: new Date('2026-03-09'),
          startDate: new Date('2026-03-12'),
          endDate: null,
          description: 'ติดตั้งระบบ Access Control HomePro ราชพฤกษ์',
          status: 'IN_PROGRESS' as const,
          notes: 'กำลังดำเนินการติดตั้ง คาดเสร็จ 15/03',
        },
        {
          woNumber: 'WO-260312-001',
          quotationIndex: 0,
          teamIndex: 2,
          date: new Date('2026-03-13'),
          startDate: null,
          endDate: null,
          description: 'ติดตั้ง CCTV เพิ่มเติม สาขา Rayong (phase 2)',
          status: 'PENDING' as const,
          notes: 'รอทีมช่างยืนยันวันเริ่มงาน',
        },
        {
          woNumber: 'WO-260315-001',
          quotationIndex: 0,
          teamIndex: 1,
          date: new Date('2026-03-16'),
          startDate: new Date('2026-03-18'),
          endDate: new Date('2026-03-19'),
          description: 'ซ่อมแซมระบบกล้อง CCTV สาขา Rayong (กล้องชำรุด 3 ตัว)',
          status: 'COMPLETED' as const,
          notes: 'เปลี่ยนกล้องใหม่ 3 ตัว ตรวจสอบเรียบร้อย',
        },
      ];

      for (const wo of woData) {
        const q = allQuotations[wo.quotationIndex % allQuotations.length];
        const team = allTeams[wo.teamIndex % allTeams.length];
        await prisma.workOrder.create({
          data: {
            woNumber: wo.woNumber,
            quotationId: q.id,
            branchId: q.branchId || null,
            teamId: team.id,
            date: wo.date,
            startDate: wo.startDate,
            endDate: wo.endDate,
            description: wo.description,
            totalAmount: Number(q.totalAmount),
            status: wo.status,
            notes: wo.notes,
            createdById: adminUser2.id,
          },
        });
      }
      console.log('✅ Work Order:', woData.length, 'รายการ');
    } else {
      console.log('⚠️ ข้ามการสร้าง Work Order (ไม่พบข้อมูลที่จำเป็น)');
    }
  }

  // ========================================
  // 7. ใบสั่งซื้อ (Purchase Orders) - 3 รายการ
  // ========================================
  const existingPO = await prisma.purchaseOrder.count();
  if (existingPO > 0) {
    console.log('⏭️ Purchase Order มีอยู่แล้ว, ข้าม');
  } else {
    const allWO = await prisma.workOrder.findMany({ orderBy: { createdAt: 'asc' } });
    const allTeams2 = await prisma.technicianTeam.findMany();
    if (allWO.length > 0 && allTeams2.length > 0) {
      const poList = [
        {
          poNumber: 'PO-260305-001', workOrderIndex: 0, teamIndex: 0,
          date: new Date('2026-03-05'), status: 'APPROVED' as const,
          notes: 'สั่งวัสดุติดตั้ง CCTV สาขา Rayong',
          items: [
            { description: 'กล้อง CCTV Hikvision 2MP', unit: 'ตัว', quantity: 16, unitPrice: 1800 },
            { description: 'DVR 16CH Hikvision', unit: 'เครื่อง', quantity: 1, unitPrice: 8500 },
            { description: 'HDD WD Purple 4TB', unit: 'ตัว', quantity: 2, unitPrice: 3200 },
            { description: 'สาย RG6 + อุปกรณ์', unit: 'ล็อต', quantity: 1, unitPrice: 9500 },
          ],
        },
        {
          poNumber: 'PO-260308-001', workOrderIndex: 1, teamIndex: 1,
          date: new Date('2026-03-08'), status: 'APPROVED' as const,
          notes: 'สั่ง AP และ Switch สำหรับ Free WiFi Zone',
          items: [
            { description: 'Access Point UniFi U6 Pro', unit: 'ตัว', quantity: 20, unitPrice: 4800 },
            { description: 'Switch USW-Pro-24-PoE', unit: 'เครื่อง', quantity: 2, unitPrice: 21000 },
            { description: 'UniFi Cloud Gateway Ultra', unit: 'เครื่อง', quantity: 1, unitPrice: 6200 },
            { description: 'สาย UTP Cat6 พร้อมอุปกรณ์', unit: 'ล็อต', quantity: 1, unitPrice: 7500 },
          ],
        },
        {
          poNumber: 'PO-260312-001', workOrderIndex: 2, teamIndex: 0,
          date: new Date('2026-03-12'), status: 'DRAFT' as const,
          notes: 'สั่งอุปกรณ์ Access Control',
          items: [
            { description: 'เครื่องสแกนลายนิ้วมือ ZKTeco', unit: 'เครื่อง', quantity: 4, unitPrice: 11000 },
            { description: 'Magnetic Lock 600lbs', unit: 'ตัว', quantity: 4, unitPrice: 2500 },
            { description: 'Power Supply 12V 5A', unit: 'ตัว', quantity: 4, unitPrice: 1800 },
          ],
        },
      ];

      for (const po of poList) {
        const wo = allWO[po.workOrderIndex % allWO.length];
        const team = allTeams2[po.teamIndex % allTeams2.length];
        const totalAmount = po.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
        await prisma.purchaseOrder.create({
          data: {
            poNumber: po.poNumber,
            workOrderId: wo.id,
            teamId: team.id,
            date: po.date,
            totalAmount,
            status: po.status,
            notes: po.notes,
            items: {
              createMany: {
                data: po.items.map((item, idx) => ({
                  itemOrder: idx + 1,
                  description: item.description,
                  unit: item.unit,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  amount: item.quantity * item.unitPrice,
                })),
              },
            },
          },
        });
      }
      console.log('✅ Purchase Order:', poList.length, 'รายการ');
    }
  }

  // ========================================
  // 8. ใบแจ้งหนี้ (Invoices) - 5 รายการ
  // ========================================
  const existingInv = await prisma.invoice.count();
  if (existingInv > 0) {
    console.log('⏭️ Invoice มีอยู่แล้ว, ข้าม');
  } else {
    const allWO2 = await prisma.workOrder.findMany({ orderBy: { createdAt: 'asc' } });
    if (allWO2.length > 0) {
      const invData = [
        {
          invoiceNumber: 'INV-260307-001', workOrderIndex: 0,
          date: new Date('2026-03-07'), dueDate: new Date('2026-03-22'),
          subtotal: 90250, vatPercent: 7, status: 'PAID' as const,
          notes: 'ชำระเรียบร้อย โอนเงินวันที่ 20/03/26',
        },
        {
          invoiceNumber: 'INV-260310-001', workOrderIndex: 1,
          date: new Date('2026-03-10'), dueDate: new Date('2026-03-25'),
          subtotal: 185400, vatPercent: 7, status: 'PAID' as const,
          notes: 'ชำระเต็มจำนวน',
        },
        {
          invoiceNumber: 'INV-260314-001', workOrderIndex: 2,
          date: new Date('2026-03-14'), dueDate: new Date('2026-03-29'),
          subtotal: 110000, vatPercent: 7, status: 'UNPAID' as const,
          notes: 'รอชำระเงิน',
        },
        {
          invoiceNumber: 'INV-260316-001', workOrderIndex: 4,
          date: new Date('2026-03-16'), dueDate: new Date('2026-03-31'),
          subtotal: 45000, vatPercent: 7, status: 'PARTIAL' as const,
          notes: 'ชำระแล้วบางส่วน 20,000 บาท รอชำระส่วนที่เหลือ',
        },
        {
          invoiceNumber: 'INV-260318-001', workOrderIndex: 3,
          date: new Date('2026-03-18'), dueDate: new Date('2026-04-02'),
          subtotal: 75000, vatPercent: 7, status: 'UNPAID' as const,
          notes: null,
        },
      ];

      for (const inv of invData) {
        const wo = allWO2[inv.workOrderIndex % allWO2.length];
        const vatAmount = (inv.subtotal * inv.vatPercent) / 100;
        const totalAmount = inv.subtotal + vatAmount;
        await prisma.invoice.create({
          data: {
            invoiceNumber: inv.invoiceNumber,
            workOrderId: wo.id,
            date: inv.date,
            dueDate: inv.dueDate,
            subtotal: inv.subtotal,
            vatPercent: inv.vatPercent,
            vatAmount,
            totalAmount,
            status: inv.status,
            notes: inv.notes,
          },
        });
      }
      console.log('✅ Invoice:', invData.length, 'รายการ');
    }
  }

  // ========================================
  // 9. ใบกำกับภาษี (Tax Invoices) - 2 รายการ (สำหรับ Invoice ที่ PAID)
  // ========================================
  const existingTI = await prisma.taxInvoice.count();
  if (existingTI > 0) {
    console.log('⏭️ Tax Invoice มีอยู่แล้ว, ข้าม');
  } else {
    const paidInvoices = await prisma.invoice.findMany({ where: { status: 'PAID' } });
    let tiCount = 0;
    for (const inv of paidInvoices) {
      tiCount++;
      await prisma.taxInvoice.create({
        data: {
          taxInvoiceNumber: `TI-260320-${String(tiCount).padStart(3, '0')}`,
          invoiceId: inv.id,
          date: new Date('2026-03-20'),
          subtotal: Number(inv.subtotal),
          vatAmount: Number(inv.vatAmount),
          totalAmount: Number(inv.totalAmount),
          notes: 'ออกใบกำกับภาษีเมื่อชำระเงินครบ',
        },
      });
    }
    console.log('✅ Tax Invoice:', tiCount, 'รายการ');
  }

  // ========================================
  // 10. ใบสำคัญรับ (Receipt Vouchers) - รับเงินจากลูกค้า
  // ========================================
  const existingRV = await prisma.receiptVoucher.count();
  if (existingRV > 0) {
    console.log('⏭️ Receipt Voucher มีอยู่แล้ว, ข้าม');
  } else {
    const paidInvoicesForRV = await prisma.invoice.findMany({
      where: { status: 'PAID' },
      orderBy: { date: 'asc' },
    });
    const rvData = [
      ...paidInvoicesForRV.map((inv, idx) => ({
        voucherNumber: `RV-260320-${String(idx + 1).padStart(3, '0')}`,
        invoiceId: inv.id,
        date: new Date('2026-03-20'),
        amount: Number(inv.totalAmount),
        paymentMethod: 'TRANSFER' as const,
        bankName: 'ธนาคารกสิกรไทย',
        notes: `รับชำระค่างาน INV ${inv.invoiceNumber}`,
      })),
      // เพิ่มใบสำคัญรับที่ไม่ผูก invoice (เงินสด)
      {
        voucherNumber: 'RV-260315-001',
        invoiceId: null,
        date: new Date('2026-03-15'),
        amount: 25000,
        paymentMethod: 'CASH' as const,
        bankName: null,
        notes: 'รับเงินมัดจำงานซ่อม',
      },
    ];

    for (const rv of rvData) {
      await prisma.receiptVoucher.create({
        data: {
          voucherNumber: rv.voucherNumber,
          invoiceId: rv.invoiceId,
          date: rv.date,
          amount: rv.amount,
          paymentMethod: rv.paymentMethod,
          bankName: rv.bankName,
          notes: rv.notes,
        },
      });
    }
    console.log('✅ Receipt Voucher:', rvData.length, 'รายการ');
  }

  // ========================================
  // 11. ใบสำคัญจ่าย (Payment Vouchers) - จ่ายเงินให้ช่าง/ผู้ขาย
  // ========================================
  const existingPV = await prisma.paymentVoucher.count();
  if (existingPV > 0) {
    console.log('⏭️ Payment Voucher มีอยู่แล้ว, ข้าม');
  } else {
    const pvData = [
      {
        voucherNumber: 'PV-260310-001', date: new Date('2026-03-10'),
        payeeName: 'นายสุชาติ วิเศษกุล (ทีม A)', amount: 35000,
        paymentMethod: 'TRANSFER' as const, bankName: 'ธนาคารกรุงไทย',
        description: 'ค่าจ้างทีมช่าง A - งานติดตั้ง CCTV สาขา Rayong',
        notes: 'โอนเงินเข้าบัญชีหัวหน้าทีม',
      },
      {
        voucherNumber: 'PV-260312-001', date: new Date('2026-03-12'),
        payeeName: 'นายวิชัย เจริญสุข (ทีม B)', amount: 42000,
        paymentMethod: 'TRANSFER' as const, bankName: 'ธนาคารกสิกรไทย',
        description: 'ค่าจ้างทีมช่าง B - งานติดตั้ง WiFi Free WiFi Zone',
        notes: null,
      },
      {
        voucherNumber: 'PV-260315-001', date: new Date('2026-03-15'),
        payeeName: 'บริษัท ไอที ซัพพลาย จำกัด', amount: 125000,
        paymentMethod: 'CHEQUE' as const, bankName: 'ธนาคารกรุงเทพ',
        description: 'ค่าอุปกรณ์ CCTV + สาย RG6 (จากใบสั่งซื้อ PO-260305-001)',
        notes: 'เช็คเลขที่ 012345',
      },
      {
        voucherNumber: 'PV-260318-001', date: new Date('2026-03-18'),
        payeeName: 'บริษัท เน็ตเวิร์ค โปร จำกัด', amount: 158000,
        paymentMethod: 'TRANSFER' as const, bankName: 'ธนาคารกสิกรไทย',
        description: 'ค่าอุปกรณ์ WiFi AP + Switch (จากใบสั่งซื้อ PO-260308-001)',
        notes: 'โอนเงินผ่าน Internet Banking',
      },
    ];

    const createdPVs = [];
    for (const pv of pvData) {
      const created = await prisma.paymentVoucher.create({
        data: {
          voucherNumber: pv.voucherNumber,
          date: pv.date,
          payeeName: pv.payeeName,
          amount: pv.amount,
          paymentMethod: pv.paymentMethod,
          bankName: pv.bankName,
          description: pv.description,
          notes: pv.notes,
        },
      });
      createdPVs.push(created);
    }
    console.log('✅ Payment Voucher:', pvData.length, 'รายการ');

    // ========================================
    // 12. หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ) - 2 รายการ (สำหรับค่าจ้างทีมช่าง)
    // ========================================
    const whtData = [
      {
        whtNumber: 'WHT-260310-001',
        paymentVoucherId: createdPVs[0].id,
        payeeName: 'นายสุชาติ วิเศษกุล',
        payeeTaxId: '1-1234-56789-01-2',
        payeeAddress: '123/45 หมู่ 3 ต.สนามชัย อ.เมือง จ.สุพรรณบุรี 72000',
        incomeType: 'ค่าจ้างทำของ (มาตรา 40(7))',
        taxRate: 3,
        incomeAmount: 35000,
        taxAmount: 1050,
        date: new Date('2026-03-10'),
        notes: 'หัก ณ ที่จ่าย 3% ค่าจ้างทีมช่าง',
      },
      {
        whtNumber: 'WHT-260312-001',
        paymentVoucherId: createdPVs[1].id,
        payeeName: 'นายวิชัย เจริญสุข',
        payeeTaxId: '1-9876-54321-98-7',
        payeeAddress: '456/78 หมู่ 5 ต.ท่าพี่เลี้ยง อ.เมือง จ.สุพรรณบุรี 72000',
        incomeType: 'ค่าจ้างทำของ (มาตรา 40(7))',
        taxRate: 3,
        incomeAmount: 42000,
        taxAmount: 1260,
        date: new Date('2026-03-12'),
        notes: 'หัก ณ ที่จ่าย 3% ค่าจ้างทีมช่าง',
      },
    ];

    for (const wht of whtData) {
      await prisma.withholdingTax.create({ data: wht });
    }
    console.log('✅ Withholding Tax (50 ทวิ):', whtData.length, 'รายการ');
  }

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
