'use client';

import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';

/* ── Helpers ── */
function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('th-TH');
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
}

/* ── Types ── */
type DashboardData = {
  quotations: { total: number; draft: number; sent: number; approved: number; cancelled: number; totalAmount: number };
  workOrders: { total: number; pending: number; inProgress: number; completed: number; paid: number; cancelled: number; totalAmount: number };
  purchaseOrders: { total: number; pending: number; approved: number; cancelled: number; totalAmount: number };
  invoices: { total: number; unpaid: number; partial: number; paid: number; cancelled: number; totalAmount: number; paidAmount: number };
  receiptVouchers: { total: number; totalAmount: number };
  paymentVouchers: { total: number; totalAmount: number };
  taxInvoices: { total: number; totalAmount: number };
  withholdingTax: { total: number; totalAmount: number };
  recentQuotations: { id: string; number: string; customer: string; project: string; amount: number; status: string; date: string }[];
  recentWorkOrders: { id: string; number: string; customer: string; project: string; amount: number; status: string; date: string }[];
  monthlyChart: { month: string; label: string; income: number; expense: number }[];
};

const statusColors: Record<string, string> = {
  DRAFT: '#94A3B8', SENT: '#F59E0B', APPROVED: '#22C55E', REJECTED: '#EF4444', CANCELLED: '#9CA3AF',
  PENDING: '#F59E0B', IN_PROGRESS: '#3B82F6', COMPLETED: '#22C55E', PAID: '#8B5CF6',
  UNPAID: '#EF4444', PARTIAL: '#F59E0B',
};
const statusLabels: Record<string, string> = {
  DRAFT: 'แบบร่าง', SENT: 'รออนุมัติ', APPROVED: 'อนุมัติ', REJECTED: 'ปฏิเสธ', CANCELLED: 'ยกเลิก',
  PENDING: 'รอดำเนินการ', IN_PROGRESS: 'กำลังดำเนินการ', COMPLETED: 'เสร็จสิ้น', PAID: 'จ่ายแล้ว',
  UNPAID: 'ค้างชำระ', PARTIAL: 'ชำระบางส่วน',
};

/* ── Stat Card ── */
function StatCard({ icon, label, value, amount, gradient, delay, onClick }: {
  icon: string; label: string; value: number; amount: number; gradient: string; delay: number; onClick?: () => void;
}) {
  return (
    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay, duration: 0.4 } }}>
      <Paper onClick={onClick}
        sx={{
          p: 2.5, borderRadius: '16px', cursor: onClick ? 'pointer' : 'default',
          background: '#fff', border: '1px solid #F1F5F9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.2s ease',
          '&:hover': onClick ? { boxShadow: '0 8px 25px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' } : {},
          position: 'relative', overflow: 'hidden',
        }}>
        <Box sx={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: gradient, opacity: 0.08 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FuseSvgIcon size={20} sx={{ color: '#fff' }}>{icon}</FuseSvgIcon>
          </Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>{label}</Typography>
        </Box>
        <Typography sx={{ fontSize: '32px', fontWeight: 800, color: '#1E293B', lineHeight: 1.1, mb: 0.5 }}>{value}</Typography>
        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#94A3B8' }}>
          ยอดรวม <Box component="span" sx={{ fontWeight: 700, color: '#475569' }}>{fmtShort(amount)}</Box> บาท
        </Typography>
      </Paper>
    </motion.div>
  );
}

/* ── Mini Bar Chart ── */
function MiniBarChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 160, px: 1 }}>
      {data.map((d, i) => (
        <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ display: 'flex', gap: '3px', alignItems: 'flex-end', width: '100%', height: 130 }}>
            <Tooltip title={`รายรับ: ${fmt(d.income)} บาท`} arrow>
              <motion.div
                initial={{ height: 0 }} animate={{ height: `${(d.income / maxVal) * 100}%` }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                style={{ flex: 1, background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)', borderRadius: '6px 6px 2px 2px', minHeight: d.income > 0 ? 8 : 0, cursor: 'pointer' }}
              />
            </Tooltip>
            <Tooltip title={`รายจ่าย: ${fmt(d.expense)} บาท`} arrow>
              <motion.div
                initial={{ height: 0 }} animate={{ height: `${(d.expense / maxVal) * 100}%` }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.5 }}
                style={{ flex: 1, background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)', borderRadius: '6px 6px 2px 2px', minHeight: d.expense > 0 ? 8 : 0, cursor: 'pointer' }}
              />
            </Tooltip>
          </Box>
          <Typography sx={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500, textAlign: 'center' }}>{d.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

/* ── Status Ring ── */
function StatusRing({ segments, size = 100 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return (
    <Box sx={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ fontSize: '13px', color: '#CBD5E1' }}>ไม่มีข้อมูล</Typography>
    </Box>
  );
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {segments.filter(s => s.value > 0).map((seg, i) => {
          const pct = seg.value / total;
          const dashLength = pct * circumference;
          const dashOffset = -offset * circumference;
          offset += pct;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={seg.color} strokeWidth={8}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'all 0.6s ease' }}
            />
          );
        })}
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{total}</Typography>
        <Typography sx={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>รายการ</Typography>
      </Box>
    </Box>
  );
}

/* ── Main Dashboard ── */
export default function NPKDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: '#3B82F6' }} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: 2 }}>
        <FuseSvgIcon size={64} sx={{ color: '#CBD5E1' }}>lucide:server-off</FuseSvgIcon>
        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ไม่สามารถโหลดข้อมูลได้</Typography>
      </Box>
    );
  }

  const incomeTotal = data.receiptVouchers.totalAmount;
  const expenseTotal = data.paymentVouchers.totalAmount;
  const netProfit = incomeTotal - expenseTotal;

  const header = (
    <Box sx={{ py: 3, px: { xs: 2, md: 4 } }}>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
          NPK Service & Supply
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>
            แดชบอร์ด
          </Typography>
          <Chip label={new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 600, fontSize: '13px', borderRadius: '10px' }} />
        </Box>
      </motion.div>
    </Box>
  );

  const content = (
    <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>

      {/* ── ROW 1: Key Summary Cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard icon="lucide:file-text" label="ใบเสนอราคา" value={data.quotations.total} amount={data.quotations.totalAmount}
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)" delay={0.1} onClick={() => router.push('/apps/quotations')} />
        <StatCard icon="lucide:clipboard-check" label="ตอบรับทำงาน (WO)" value={data.workOrders.total} amount={data.workOrders.totalAmount}
          gradient="linear-gradient(135deg, #8B5CF6, #6D28D9)" delay={0.15} onClick={() => router.push('/apps/work-orders')} />
        <StatCard icon="lucide:shopping-cart" label="ใบสั่งซื้อ (PO)" value={data.purchaseOrders.total} amount={data.purchaseOrders.totalAmount}
          gradient="linear-gradient(135deg, #F59E0B, #D97706)" delay={0.2} onClick={() => router.push('/apps/purchase-orders')} />
        <StatCard icon="lucide:receipt" label="ใบแจ้งหนี้" value={data.invoices.total} amount={data.invoices.totalAmount}
          gradient="linear-gradient(135deg, #22C55E, #16A34A)" delay={0.25} onClick={() => router.push('/apps/invoices')} />
      </Box>

      {/* ── ROW 2: Finance Summary + Monthly Chart ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' }, gap: 2, mb: 3 }}>

        {/* Finance Overview */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.3 } }}>
          <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: '100%' }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FuseSvgIcon size={16} sx={{ color: '#fff' }}>lucide:wallet</FuseSvgIcon>
              </Box>
              ภาพรวมการเงิน
            </Typography>

            {/* Income */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>รายรับ</Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#059669' }}>{fmt(incomeTotal)}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={incomeTotal > 0 ? 100 : 0}
                sx={{ height: 8, borderRadius: 4, bgcolor: '#ECFDF5', '& .MuiLinearProgress-bar': { bgcolor: '#22C55E', borderRadius: 4 } }} />
            </Box>

            {/* Expense */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>รายจ่าย</Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#DC2626' }}>{fmt(expenseTotal)}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={incomeTotal > 0 ? Math.min((expenseTotal / incomeTotal) * 100, 100) : 0}
                sx={{ height: 8, borderRadius: 4, bgcolor: '#FEF2F2', '& .MuiLinearProgress-bar': { bgcolor: '#EF4444', borderRadius: 4 } }} />
            </Box>

            {/* Net Profit */}
            <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: netProfit >= 0 ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${netProfit >= 0 ? '#BBF7D0' : '#FECACA'}`, mt: 2 }}>
              <Typography sx={{ fontSize: '13px', color: '#64748B', fontWeight: 500, mb: 0.5 }}>กำไรสุทธิ</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 800, color: netProfit >= 0 ? '#059669' : '#DC2626' }}>
                {netProfit >= 0 ? '+' : ''}{fmt(netProfit)} <Box component="span" sx={{ fontSize: '14px', fontWeight: 600 }}>บาท</Box>
              </Typography>
            </Paper>

            {/* Finance mini cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#F8FAFC', cursor: 'pointer', '&:hover': { bgcolor: '#F1F5F9' } }}
                onClick={() => router.push('/apps/tax-invoices')}>
                <Typography sx={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>ใบกำกับภาษี</Typography>
                <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>{data.taxInvoices.total}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#F8FAFC', cursor: 'pointer', '&:hover': { bgcolor: '#F1F5F9' } }}
                onClick={() => router.push('/apps/withholding-tax')}>
                <Typography sx={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>หัก ณ ที่จ่าย</Typography>
                <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#7C3AED' }}>{fmt(data.withholdingTax.totalAmount)}</Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* Monthly Chart */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.35 } }}>
          <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FuseSvgIcon size={16} sx={{ color: '#fff' }}>lucide:bar-chart-3</FuseSvgIcon>
                </Box>
                รายรับ-รายจ่ายรายเดือน
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: '#22C55E' }} />
                  <Typography sx={{ fontSize: '12px', color: '#64748B' }}>รายรับ</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: '#EF4444' }} />
                  <Typography sx={{ fontSize: '12px', color: '#64748B' }}>รายจ่าย</Typography>
                </Box>
              </Box>
            </Box>
            <MiniBarChart data={data.monthlyChart} />
          </Paper>
        </motion.div>
      </Box>

      {/* ── ROW 3: Module Status Breakdowns ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>

        {/* Quotation Status */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.4 } }}>
          <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', '&:hover': { boxShadow: '0 8px 25px rgba(0,0,0,0.08)' } }}
            onClick={() => router.push('/apps/quotations')}>
            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', mb: 2 }}>สถานะใบเสนอราคา</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <StatusRing segments={[
                { value: data.quotations.draft, color: '#94A3B8', label: 'แบบร่าง' },
                { value: data.quotations.sent, color: '#F59E0B', label: 'รออนุมัติ' },
                { value: data.quotations.approved, color: '#22C55E', label: 'อนุมัติ' },
                { value: data.quotations.cancelled, color: '#E5E7EB', label: 'ยกเลิก' },
              ]} />
              <Box sx={{ flex: 1 }}>
                {[
                  { label: 'แบบร่าง', value: data.quotations.draft, color: '#94A3B8' },
                  { label: 'รออนุมัติ', value: data.quotations.sent, color: '#F59E0B' },
                  { label: 'อนุมัติ', value: data.quotations.approved, color: '#22C55E' },
                ].map((s, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                      <Typography sx={{ fontSize: '13px', color: '#64748B' }}>{s.label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{s.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* Work Order Status */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.45 } }}>
          <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', '&:hover': { boxShadow: '0 8px 25px rgba(0,0,0,0.08)' } }}
            onClick={() => router.push('/apps/work-orders')}>
            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', mb: 2 }}>สถานะใบสั่งงาน</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <StatusRing segments={[
                { value: data.workOrders.pending, color: '#F59E0B', label: 'รอ' },
                { value: data.workOrders.inProgress, color: '#3B82F6', label: 'กำลังทำ' },
                { value: data.workOrders.completed, color: '#22C55E', label: 'เสร็จ' },
                { value: data.workOrders.paid, color: '#8B5CF6', label: 'จ่ายแล้ว' },
              ]} />
              <Box sx={{ flex: 1 }}>
                {[
                  { label: 'รอดำเนินการ', value: data.workOrders.pending, color: '#F59E0B' },
                  { label: 'กำลังดำเนินการ', value: data.workOrders.inProgress, color: '#3B82F6' },
                  { label: 'เสร็จสิ้น', value: data.workOrders.completed, color: '#22C55E' },
                  { label: 'จ่ายแล้ว', value: data.workOrders.paid, color: '#8B5CF6' },
                ].map((s, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                      <Typography sx={{ fontSize: '13px', color: '#64748B' }}>{s.label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{s.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* Invoice Status */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}>
          <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', '&:hover': { boxShadow: '0 8px 25px rgba(0,0,0,0.08)' } }}
            onClick={() => router.push('/apps/invoices')}>
            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', mb: 2 }}>สถานะใบแจ้งหนี้</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <StatusRing segments={[
                { value: data.invoices.unpaid, color: '#EF4444', label: 'ค้างชำระ' },
                { value: data.invoices.partial, color: '#F59E0B', label: 'บางส่วน' },
                { value: data.invoices.paid, color: '#22C55E', label: 'ชำระแล้ว' },
              ]} />
              <Box sx={{ flex: 1 }}>
                {[
                  { label: 'ค้างชำระ', value: data.invoices.unpaid, color: '#EF4444' },
                  { label: 'ชำระบางส่วน', value: data.invoices.partial, color: '#F59E0B' },
                  { label: 'ชำระแล้ว', value: data.invoices.paid, color: '#22C55E' },
                ].map((s, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                      <Typography sx={{ fontSize: '13px', color: '#64748B' }}>{s.label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{s.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Box>

      {/* ── ROW 4: Recent Activity Tables ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 3 }}>

        {/* Recent Quotations */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.55 } }}>
          <Paper sx={{ borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                <FuseSvgIcon size={18} sx={{ color: '#3B82F6' }}>lucide:file-text</FuseSvgIcon>
                ใบเสนอราคาล่าสุด
              </Typography>
              <Chip label="ดูทั้งหมด" size="small" clickable onClick={() => router.push('/apps/quotations')}
                sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', fontWeight: 600, fontSize: '12px', '&:hover': { bgcolor: '#DBEAFE' } }} />
            </Box>
            {data.recentQuotations.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '14px', color: '#94A3B8' }}>ยังไม่มีข้อมูล</Typography>
              </Box>
            ) : (
              data.recentQuotations.map((q, i) => (
                <Box key={q.id}
                  sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, borderBottom: i < data.recentQuotations.length - 1 ? '1px solid #F8FAFC' : 'none', cursor: 'pointer', '&:hover': { bgcolor: '#FAFBFC' } }}
                  onClick={() => router.push(`/apps/quotations/${q.id}`)}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#0284C7' }}>{q.number}</Typography>
                    <Typography sx={{ fontSize: '12px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.customer} · {q.project}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{fmt(q.amount)}</Typography>
                    <Chip label={statusLabels[q.status] || q.status} size="small"
                      sx={{ bgcolor: `${statusColors[q.status] || '#94A3B8'}15`, color: statusColors[q.status] || '#94A3B8', fontWeight: 600, fontSize: '11px', height: 22, borderRadius: '6px' }} />
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        </motion.div>

        {/* Recent Work Orders */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.6 } }}>
          <Paper sx={{ borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                <FuseSvgIcon size={18} sx={{ color: '#8B5CF6' }}>lucide:clipboard-check</FuseSvgIcon>
                ใบสั่งงานล่าสุด
              </Typography>
              <Chip label="ดูทั้งหมด" size="small" clickable onClick={() => router.push('/apps/work-orders')}
                sx={{ bgcolor: '#F3E8FF', color: '#8B5CF6', fontWeight: 600, fontSize: '12px', '&:hover': { bgcolor: '#EDE9FE' } }} />
            </Box>
            {data.recentWorkOrders.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '14px', color: '#94A3B8' }}>ยังไม่มีข้อมูล</Typography>
              </Box>
            ) : (
              data.recentWorkOrders.map((wo, i) => (
                <Box key={wo.id}
                  sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, borderBottom: i < data.recentWorkOrders.length - 1 ? '1px solid #F8FAFC' : 'none', cursor: 'pointer', '&:hover': { bgcolor: '#FAFBFC' } }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#8B5CF6' }}>{wo.number}</Typography>
                    <Typography sx={{ fontSize: '12px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {wo.customer} · {wo.project}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{fmt(wo.amount)}</Typography>
                    <Chip label={statusLabels[wo.status] || wo.status} size="small"
                      sx={{ bgcolor: `${statusColors[wo.status] || '#94A3B8'}15`, color: statusColors[wo.status] || '#94A3B8', fontWeight: 600, fontSize: '11px', height: 22, borderRadius: '6px' }} />
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        </motion.div>
      </Box>

      {/* ── ROW 5: Quick Links ── */}
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.65 } }}>
        <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', mb: 2 }}>ลิงก์ด่วน</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.5 }}>
            {[
              { icon: 'lucide:file-plus', label: 'สร้างใบเสนอราคา', url: '/apps/quotations/new', color: '#3B82F6' },
              { icon: 'lucide:clipboard-plus', label: 'สร้างใบสั่งงาน', url: '/apps/work-orders', color: '#8B5CF6' },
              { icon: 'lucide:check-circle-2', label: 'งานเสร็จแล้ว', url: '/apps/completed-works', color: '#22C55E' },
              { icon: 'lucide:clock', label: 'รอจ่ายช่าง', url: '/apps/pending-payments', color: '#F59E0B' },
              { icon: 'lucide:receipt', label: 'ใบสำคัญรับ', url: '/apps/receipt-vouchers', color: '#059669' },
              { icon: 'lucide:wallet', label: 'ใบสำคัญจ่าย', url: '/apps/payment-vouchers', color: '#DC2626' },
            ].map((item, i) => (
              <Box key={i} onClick={() => router.push(item.url)}
                sx={{
                  p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  transition: 'all 0.2s', '&:hover': { bgcolor: '#F1F5F9', transform: 'translateY(-2px)' },
                }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FuseSvgIcon size={18} sx={{ color: item.color }}>{item.icon}</FuseSvgIcon>
                </Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );

  return <FusePageSimple header={header} content={content} />;
}
