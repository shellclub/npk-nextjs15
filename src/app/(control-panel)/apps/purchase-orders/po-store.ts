// ===== Shared PO Types & Data Store =====

export type SubItem = {
  id: string;
  description: string;
  qty: number;
  unit: string;
  materialUnitPrice: number;
  labourUnitPrice: number;
};

export type MainItem = {
  id: string;
  title: string;
  subItems: SubItem[];
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  date: string;
  dueDate: string;
  referenceNo: string;
  branchSite: string;
  contractorName: string;
  contractorAddress: string;
  contractorPhone: string;
  workName: string;
  discountPercent: number;
  vat3Percent: number;
  vat7Percent: number;
  paymentTerms: string[];
  notes: string;
  status: string;
  items: MainItem[];
};

// ===== Mock Teams =====
export const mockTeams = [
  { id: '1', name: 'คุณขวัญชัย มั่นคง', phone: '092-6492694', address: '210/10 หมู่ 4 ตำบลสนามชัย อำเภอเมือง จังหวัดสุพรรณบุรี 72000' },
  { id: '2', name: 'คุณสมศักดิ์ พงษ์ดี', phone: '081-345-6789', address: '15/2 ม.3 ต.ท่าพี่เลี้ยง อ.เมือง จ.สุพรรณบุรี 72000' },
  { id: '3', name: 'คุณวิเชียร ประสงค์ดี', phone: '085-789-0123', address: '88 ม.5 ต.รั้วใหญ่ อ.เมือง จ.สุพรรณบุรี 72000' },
  { id: '4', name: 'คุณสำราญ เจริญสุข', phone: '088-901-2345', address: '9/1 ม.2 ต.สนามชัย อ.เมือง จ.สุพรรณบุรี 72000' },
];

export const defaultPaymentTerms = [
  'ผู้รับจ้างทำงานตาม Poตามเลขที่อ้างอิง เสร็จให้ถ่ายสำเนา ใบรับงาน และส่งรูปภาพก่อน-หลังทำงาน มาทาง Line ของบริษัท และส่งตัวจริงตามที่อยู่ที่กำหนด',
  'การจ่ายเงินบริษัทจะจ่ายให้ภายใน 15 วันหลังจากงานเสร็จสมบูรณ์และเอกสารครบตามที่กำหนด',
  'ผู้รับจ้างต้องรับประกันผลงานตามระเวลาที่กำหนด ตามราคานี้เท่านั้น',
];

// ===== Helpers =====
export function fmt(n: number | string) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function calcPOTotals(po: PurchaseOrder) {
  let subtotal = 0;
  po.items.forEach(main => {
    main.subItems.forEach(sub => {
      subtotal += sub.qty * (sub.materialUnitPrice + sub.labourUnitPrice);
    });
  });
  const discountAmount = subtotal * po.discountPercent / 100;
  const afterDiscount = subtotal - discountAmount;
  const vat3Amount = afterDiscount * po.vat3Percent / 100;
  const vat7Amount = afterDiscount * po.vat7Percent / 100;
  const grandTotal = afterDiscount + vat7Amount - vat3Amount;
  return { subtotal, discountAmount, afterDiscount, vat3Amount, vat7Amount, grandTotal };
}

export function numberToThaiText(num: number): string {
  const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  if (num === 0) return 'ศูนย์บาทถ้วน';
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  function convertGroup(n: number): string {
    if (n === 0) return '';
    const s = String(n);
    let result = '';
    for (let i = 0; i < s.length; i++) {
      const digit = parseInt(s[i]);
      const pos = s.length - 1 - i;
      if (digit === 0) continue;
      if (pos === 1 && digit === 1) { result += 'สิบ'; continue; }
      if (pos === 1 && digit === 2) { result += 'ยี่สิบ'; continue; }
      if (pos === 0 && digit === 1 && s.length > 1) { result += 'เอ็ด'; continue; }
      result += units[digit] + positions[pos];
    }
    return result;
  }
  let result = '';
  if (intPart >= 1000000) {
    result += convertGroup(Math.floor(intPart / 1000000)) + 'ล้าน';
    const remainder = intPart % 1000000;
    if (remainder > 0) result += convertGroup(remainder);
  } else {
    result = convertGroup(intPart);
  }
  result += 'บาท';
  if (decPart > 0) {
    result += convertGroup(decPart) + 'สตางค์';
  } else {
    result += 'ถ้วน';
  }
  return result;
}

// ===== Status Config =====
export const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  DRAFT: { label: 'แบบร่าง', bgColor: '#F8FAFC', textColor: '#64748B', borderColor: '#CBD5E1' },
  APPROVED: { label: 'อนุมัติ', bgColor: '#ECFDF5', textColor: '#059669', borderColor: '#6EE7B7' },
  ORDERED: { label: 'สั่งซื้อแล้ว', bgColor: '#EFF6FF', textColor: '#2563EB', borderColor: '#93C5FD' },
  RECEIVED: { label: 'รับแล้ว', bgColor: '#EEF2FF', textColor: '#4F46E5', borderColor: '#A5B4FC' },
  CANCELLED: { label: 'ยกเลิก', bgColor: '#FEF2F2', textColor: '#DC2626', borderColor: '#FCA5A5' },
};

export const statusOptions = [
  { value: 'ALL', label: 'แสดงทั้งหมด' }, { value: 'DRAFT', label: 'แบบร่าง' },
  { value: 'APPROVED', label: 'อนุมัติ' }, { value: 'ORDERED', label: 'สั่งซื้อแล้ว' },
  { value: 'RECEIVED', label: 'รับแล้ว' },
];

// ===== Initial Data (shared across pages) =====
const initialPOs: PurchaseOrder[] = [
  {
    id: '1', poNumber: 'PO2026/0001', date: '2024-11-26', dueDate: '',
    referenceNo: 'QT-2568-0001', branchSite: 'รพ ศุภมิตร',
    contractorName: 'คุณขวัญชัย', contractorAddress: '210/10 หมู่ 4 ตำบลสนามชัย อำเภอเมือง จังหวัดสุพรรณบุรี 72000', contractorPhone: '092-6492694',
    workName: 'งานปรับปรุงบันได รพ ศุภมิตร',
    discountPercent: 0, vat3Percent: 3, vat7Percent: 7,
    paymentTerms: defaultPaymentTerms, notes: '', status: 'APPROVED',
    items: [
      {
        id: '1', title: 'ชั้นที่ 1 (ฝั่งขวา)',
        subItems: [
          { id: '1-1', description: 'งานรื้อผนังเบาขนาดพื้นที่ 12.92 ตารางเมตรออก', qty: 1, unit: 'งาน', materialUnitPrice: 15000, labourUnitPrice: 8000 },
          { id: '1-2', description: 'งานเสริมความกว้างบันไดด้วยเหล็กฉาก50x50x5mm พร้อมย้ายราวบันไดเดิม', qty: 1, unit: 'งาน', materialUnitPrice: 25000, labourUnitPrice: 12000 },
        ],
      },
      {
        id: '2', title: 'ชั้นที่ 2 (ฝั่งขวา)',
        subItems: [
          { id: '2-1', description: 'งานรื้อผนังก่ออิฐขนาดพื้นที่ 8.93 ตรม.', qty: 1, unit: 'งาน', materialUnitPrice: 0, labourUnitPrice: 12000 },
          { id: '2-2', description: 'งานเสริมความกว้างบันไดด้วยเหล็กฉาก 50x50x5mm พร้อมย้ายราวบันไดเดิม', qty: 1, unit: 'งาน', materialUnitPrice: 25000, labourUnitPrice: 12000 },
          { id: '2-3', description: 'ต่อเติมพื้นชั้น 2 เพื่อทำชานพักให้เป็นไปตามกฎกระทรวง 50 cm', qty: 1, unit: 'งาน', materialUnitPrice: 18000, labourUnitPrice: 10000 },
        ],
      },
      {
        id: '3', title: 'ชั้นที่ 3 (ฝั่งขวา)',
        subItems: [
          { id: '3-1', description: 'งานรื้อผนังก่ออิฐขนาดพื้นที่ 30.74 ตารางเมตร', qty: 1, unit: 'งาน', materialUnitPrice: 0, labourUnitPrice: 18000 },
          { id: '3-2', description: 'งานยกเลิกห้องน้ำเดิมรื้อถอนก๊านแพง สุขภัณฑ์ ฝ้าเพดาน พร้อมซ่อมพื้น', qty: 1, unit: 'งาน', materialUnitPrice: 5000, labourUnitPrice: 15000 },
          { id: '3-3', description: 'งานเสริมความกว้างบันไดด้วยเหล็กฉาก 50x50x5mm พร้อมย้ายราวบันไดเดิม', qty: 1, unit: 'งาน', materialUnitPrice: 25000, labourUnitPrice: 12000 },
          { id: '3-4', description: 'งานรื้อผนังเบาขนาดพื้นที่ 11 ตารางเมตรออก เพื่อขยายชานพักให้ได้ตามกฎกระทรวง', qty: 1, unit: 'งาน', materialUnitPrice: 8558, labourUnitPrice: 15000 },
        ],
      },
    ],
  },
  {
    id: '2', poNumber: 'PO2026/0002', date: '2024-12-02', dueDate: '2024-12-20',
    referenceNo: 'WO-2568-0015', branchSite: 'โลตัส สุพรรณบุรี',
    contractorName: 'คุณสมศักดิ์', contractorAddress: '15/2 ม.3 ต.ท่าพี่เลี้ยง อ.เมือง จ.สุพรรณบุรี 72000', contractorPhone: '081-345-6789',
    workName: 'งานซ่อมระบบไฟฟ้า',
    discountPercent: 0, vat3Percent: 3, vat7Percent: 7,
    paymentTerms: defaultPaymentTerms, notes: '', status: 'DRAFT',
    items: [
      {
        id: '1', title: 'งานระบบไฟฟ้าชั้น 2',
        subItems: [
          { id: '1-1', description: 'งานเดินสายไฟใหม่ชั้น 2', qty: 1, unit: 'งาน', materialUnitPrice: 15000, labourUnitPrice: 10000 },
          { id: '1-2', description: 'งานติดตั้งตู้ MDB ใหม่', qty: 1, unit: 'ชุด', materialUnitPrice: 12000, labourUnitPrice: 8000 },
        ],
      },
    ],
  },
  {
    id: '3', poNumber: 'PO2026/0003', date: '2024-12-05', dueDate: '2024-12-25',
    referenceNo: 'QT-2568-0012', branchSite: 'รพ เกษมราษฎร์',
    contractorName: 'คุณวิเชียร', contractorAddress: '88 ม.5 ต.รั้วใหญ่ อ.เมือง จ.สุพรรณบุรี 72000', contractorPhone: '085-789-0123',
    workName: 'งานซ่อมระบบประปา',
    discountPercent: 5, vat3Percent: 3, vat7Percent: 7,
    paymentTerms: defaultPaymentTerms, notes: 'เร่งด่วน', status: 'ORDERED',
    items: [
      {
        id: '1', title: 'งานระบบประปาชั้น 3',
        subItems: [
          { id: '1-1', description: 'งานซ่อมท่อน้ำรั่ว ห้องน้ำชั้น 3', qty: 1, unit: 'งาน', materialUnitPrice: 20000, labourUnitPrice: 15000 },
          { id: '1-2', description: 'งานเปลี่ยนปั๊มน้ำ', qty: 1, unit: 'ชุด', materialUnitPrice: 18500, labourUnitPrice: 10000 },
        ],
      },
      {
        id: '2', title: 'งานเปลี่ยนวาล์ว',
        subItems: [
          { id: '2-1', description: 'งานเปลี่ยนวาล์วน้ำ', qty: 3, unit: 'ตัว', materialUnitPrice: 3000, labourUnitPrice: 2000 },
        ],
      },
    ],
  },
  {
    id: '4', poNumber: 'PO2026/0004', date: '2024-12-10', dueDate: '2024-12-30',
    referenceNo: 'WO-2568-0020', branchSite: 'แม็คโคร สุพรรณบุรี',
    contractorName: 'คุณสำราญ', contractorAddress: '9/1 ม.2 ต.สนามชัย อ.เมือง จ.สุพรรณบุรี 72000', contractorPhone: '088-901-2345',
    workName: 'งานทาสีภายนอกอาคาร',
    discountPercent: 0, vat3Percent: 3, vat7Percent: 7,
    paymentTerms: defaultPaymentTerms, notes: '', status: 'RECEIVED',
    items: [
      {
        id: '1', title: 'งานทาสีด้านหน้าและด้านข้าง',
        subItems: [
          { id: '1-1', description: 'งานทาสีภายนอก ด้านหน้าอาคาร', qty: 1, unit: 'งาน', materialUnitPrice: 35000, labourUnitPrice: 30000 },
          { id: '1-2', description: 'งานทาสีภายนอก ด้านข้างอาคาร', qty: 1, unit: 'งาน', materialUnitPrice: 30000, labourUnitPrice: 25000 },
        ],
      },
    ],
  },
  {
    id: '5', poNumber: 'PO2026/0005', date: '2024-12-15', dueDate: '',
    referenceNo: '', branchSite: '',
    contractorName: 'คุณขวัญชัย', contractorAddress: '210/10 หมู่ 4 ตำบลสนามชัย อำเภอเมือง จังหวัดสุพรรณบุรี 72000', contractorPhone: '092-6492694',
    workName: 'งานติดตั้งแอร์',
    discountPercent: 0, vat3Percent: 3, vat7Percent: 7,
    paymentTerms: defaultPaymentTerms, notes: '', status: 'CANCELLED',
    items: [
      {
        id: '1', title: 'งานติดตั้งแอร์',
        subItems: [
          { id: '1-1', description: 'งานติดตั้งแอร์ Daikin 24000 BTU', qty: 2, unit: 'ชุด', materialUnitPrice: 12000, labourUnitPrice: 5500 },
        ],
      },
    ],
  },
];

// ===== In-Memory Store =====
let _poData: PurchaseOrder[] = [...initialPOs];
let _nextId = 6;

export function getAllPOs(): PurchaseOrder[] {
  return _poData;
}

export function getPOById(id: string): PurchaseOrder | undefined {
  return _poData.find(po => po.id === id);
}

export function addPO(po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status'>): PurchaseOrder {
  const newPO: PurchaseOrder = {
    ...po,
    id: String(_nextId),
    poNumber: `PO2026/${String(_nextId).padStart(4, '0')}`,
    status: 'DRAFT',
  };
  _nextId++;
  _poData = [newPO, ..._poData];
  return newPO;
}

export function updatePO(id: string, updates: Partial<PurchaseOrder>): PurchaseOrder | undefined {
  const index = _poData.findIndex(po => po.id === id);
  if (index === -1) return undefined;
  _poData[index] = { ..._poData[index], ...updates };
  return _poData[index];
}

export function updatePOStatus(id: string, status: string): PurchaseOrder | undefined {
  return updatePO(id, { status });
}
