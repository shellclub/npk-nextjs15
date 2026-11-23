# NPK Service — ชุดส่งต่องานออกแบบ (Design Handoff)

ชุดนี้ใช้เปิดใน VS Code แล้วให้ **Claude Code** สร้างหน้าจอจริงด้วย **Next.js + PostgreSQL (Prisma) + Tailwind CSS v4**

## สิ่งที่อยู่ในชุดนี้

```
npk-design-handoff/
├─ CLAUDE.md               ← คำสั่งหลักสำหรับ Claude Code (อ่านอัตโนมัติ)
├─ screenshots/            ← ภาพหน้าจอทุกหน้า 19 หน้า (1440px)
├─ design-source/          ← ไฟล์ออกแบบต้นฉบับ (.dc.html) + index.html เปิดดูในเบราว์เซอร์
├─ docs/
│  ├─ design-system.md     ← สี ฟอนต์ ขนาด คอมโพเนนต์ สีสถานะ ไอคอน
│  ├─ pages.md             ← สเปกทุกหน้า: route, คอลัมน์, ตัวกรอง, ปุ่ม, การทำงาน
│  └─ data-mapping.md      ← จับคู่ฟิลด์หน้าจอ ↔ Prisma และจุดที่ schema ยังขาด
├─ tailwind/globals.css    ← โทเคนธีม Tailwind v4 (@theme)
├─ prisma/schema.prisma    ← สำเนา schema ปัจจุบันจาก repo (ไว้อ้างอิง)
└─ public/npk-logo.png     ← โลโก้บริษัท
```

## วิธีใช้

### แบบที่ 1 — ใช้กับ repo เดิม `npk-nextjs15` (แนะนำ เพราะมี Prisma + API ครบแล้ว)
1. คัดลอกโฟลเดอร์นี้ไปไว้ที่ root ของ repo ตั้งชื่อเป็น `design-handoff/`
2. ย้าย `design-handoff/CLAUDE.md` ไปไว้ที่ root (หรือเพิ่มบรรทัด `@design-handoff/CLAUDE.md` ใน CLAUDE.md เดิม)
3. เปิด VS Code → เปิด Claude Code แล้วสั่งตามตัวอย่างด้านล่าง

### แบบที่ 2 — เริ่มโปรเจกต์ใหม่
```bash
npx create-next-app@latest npk-service --ts --tailwind --app --src-dir --eslint
cd npk-service
npm i prisma @prisma/client lucide-react react-hook-form zod @hookform/resolvers next-auth@beta
npx prisma init --datasource-provider postgresql
```
จากนั้นคัดลอกโฟลเดอร์นี้เข้าไปเป็น `design-handoff/` แล้วเริ่มสั่ง Claude Code

> ดูภาพออกแบบแบบคลิกได้: `npx serve design-handoff/design-source` แล้วเปิด http://localhost:3000

## ตัวอย่างคำสั่งสำหรับ Claude Code (สั่งทีละขั้น)

1. `อ่าน design-handoff/CLAUDE.md และ docs ทั้งหมด แล้ววางแผนการสร้างระบบตาม docs/pages.md ยังไม่ต้องเขียนโค้ด`
2. `ตั้งค่า Tailwind theme จาก tailwind/globals.css, ฟอนต์ Prompt/Sarabun ด้วย next/font และสร้างคอมโพเนนต์พื้นฐานใน src/components/ui ตาม docs/design-system.md`
3. `สร้าง layout หลัก (sidebar + top bar) ให้ตรงกับ screenshots/Dashboard.png`
4. `สร้างหน้าเข้าสู่ระบบตาม screenshots/Main.png และ design-source/Main.dc.html เชื่อม next-auth`
5. `สร้างหน้า ใบเสนอราคา (รายการ + สร้างใหม่) ตาม docs/pages.md ข้อ 2–3 เชื่อม Prisma`
6. ทำต่อทีละหน้าตามลำดับใน `docs/pages.md`
7. `ตรวจ docs/data-mapping.md หัวข้อฟิลด์ที่ schema ยังไม่มี แล้วเสนอ migration ให้ผมอนุมัติก่อน`

## สิ่งที่ต้องตัดสินใจก่อนเริ่ม (ดูรายละเอียดใน docs/data-mapping.md)
- รูปแบบเลขที่เอกสารของ ใบแจ้งหนี้ / ใบกำกับภาษี / ใบสำคัญรับ / ใบสำคัญจ่าย / 50 ทวิ (ในแบบใช้ INV-/TX-/RV-/PV-/WHT- เป็นตัวอย่าง)
- ฟิลด์ใหม่ที่หน้าจอต้องใช้แต่ schema ยังไม่มี เช่น วิธียืนยันงาน ไฟล์ PO ลูกค้า ความเชี่ยวชาญทีมช่าง การชำระบางส่วน
- ชื่อสถานะ WO ให้ดึงจากตาราง `WorkOrderStatusConfig` เสมอ (ในแบบบางหน้ายังใช้ชื่อเก่า)

ข้อความใน [วงเล็บเหลี่ยม] และตัวเลขทั้งหมดในแบบเป็นข้อมูลตัวอย่าง
