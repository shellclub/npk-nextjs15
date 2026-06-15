'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type MonthData = {
  month: number;
  quotationTotal: number;
  actualCost: number;
  actualRevenue: number;
  woCount: number;
};

type ReportData = {
  year: number;
  yearCE: number;
  monthly: MonthData[];
  totals: { quotationTotal: number; actualCost: number; actualRevenue: number; woCount: number };
  vat7: { quotationTotal: number; actualCost: number; actualRevenue: number };
};

type MonthWO = {
  id: string; woNumber: string; date: string; status: string;
  projectName: string; quotationNumber: string; teamName: string;
  quotationTotal: number; actualCost: number; actualRevenue: number;
};

type MonthDetailData = {
  year: number; month: number;
  workOrders: MonthWO[];
  summary: { quotationTotal: number; actualCost: number; actualRevenue: number; woCount: number };
};

type Team = { id: string; teamName: string; leaderName: string };

const monthNames = [
  'เดือนมกราคม', 'เดือนกุมภาพันธ์', 'เดือนมีนาคม', 'เดือนเมษายน',
  'เดือนพฤษภาคม', 'เดือนมิถุนายน', 'เดือนกรกฎาคม', 'เดือนสิงหาคม',
  'เดือนกันยายน', 'เดือนตุลาคม', 'เดือนพฤศจิกายน', 'เดือนธันวาคม',
];

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ReportsPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear() + 543;
  const [yearFilter, setYearFilter] = useState(currentYear);
  const [teamFilter, setTeamFilter] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [monthDetail, setMonthDetail] = useState<MonthDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');
  const [selectedMonth, setSelectedMonth] = useState(0);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Load teams
  useEffect(() => {
    fetch('/api/technicians').then(r => r.json()).then(d => setTeams(Array.isArray(d) ? d : [])).catch(() => setTeams([]));
  }, []);

  // Load report
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ year: String(yearFilter) });
      if (teamFilter) p.set('teamId', teamFilter);
      const res = await fetch(`/api/reports/monthly-summary?${p}`);
      const d = await res.json();
      setReportData(d);
    } catch { setReportData(null); } finally { setLoading(false); }
  }, [yearFilter, teamFilter]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const loadMonthDetail = useCallback(async (month: number) => {
    setMonthLoading(true);
    try {
      const p = new URLSearchParams({ year: String(yearFilter), month: String(month) });
      if (teamFilter) p.set('teamId', teamFilter);
      const res = await fetch(`/api/reports/monthly-summary?${p}`);
      const d = await res.json();
      setMonthDetail(d.workOrders ? d : null);
    } catch { setMonthDetail(null); } finally { setMonthLoading(false); }
  }, [yearFilter, teamFilter]);

  const handleMonthClick = (month: number) => {
    setSelectedMonth(month);
    setViewMode('monthly');
    loadMonthDetail(month);
  };

  const handleBackToYear = () => {
    setViewMode('yearly');
    setSelectedMonth(0);
    setMonthDetail(null);
  };

  // ===== HEADER =====
  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Box className="flex items-center justify-between px-24 mb-8">
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>
              รายงาน {'>'} สรุปรายปี
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            <FuseSvgIcon sx={{ color: '#0284C7', mr: 1 }} size={28}>lucide:bar-chart-3</FuseSvgIcon>
            📊 รูปแบบรายงาน
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {/* Export Buttons */}
          <Button variant="outlined" size="small" startIcon={<FuseSvgIcon size={16}>lucide:file-spreadsheet</FuseSvgIcon>}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '13px', borderColor: '#22C55E', color: '#22C55E', '&:hover': { bgcolor: '#F0FDF4', borderColor: '#16A34A' } }}>
            ไฟล์รายงาน
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box className="flex items-center gap-12 px-24 flex-wrap">
        {/* Year Filter */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {yearOptions.map(y => (
            <Chip key={y} label={`ปี ${y}`} size="small"
              onClick={() => { setYearFilter(y); setViewMode('yearly'); }}
              sx={{
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                bgcolor: yearFilter === y ? '#0284C7' : '#F1F5F9',
                color: yearFilter === y ? '#fff' : '#475569',
                '&:hover': { bgcolor: yearFilter === y ? '#0369A1' : '#E2E8F0' },
              }} />
          ))}
        </Box>

        {/* Team Filter */}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>เลือกทีมช่าง</InputLabel>
          <Select value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            label="เลือกทีมช่าง"
            sx={{ borderRadius: '10px', bgcolor: '#fff', fontSize: '14px' }}>
            <MenuItem value="">ทั้งหมด</MenuItem>
            {teams.map(t => (
              <MenuItem key={t.id} value={t.id}>{t.teamName}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {viewMode === 'monthly' && selectedMonth > 0 && (
          <Chip label={`${monthNames[selectedMonth - 1]} พ.ศ. ${yearFilter}`} size="small"
            sx={{ bgcolor: '#DBEAFE', color: '#2563EB', fontWeight: 700 }} />
        )}
        {viewMode === 'monthly' && (
          <Button variant="text" startIcon={<FuseSvgIcon size={16}>lucide:arrow-left</FuseSvgIcon>}
            onClick={handleBackToYear}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#0284C7', fontSize: '14px' }}>
            กลับหน้ารายปี
          </Button>
        )}
      </Box>
    </div>
  );

  // ===== CONTENT =====
  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-hidden rounded-b-none" elevation={0}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#38BDF8' }} /></Box>
      ) : !reportData ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
          <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:bar-chart-3</FuseSvgIcon>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ไม่สามารถโหลดข้อมูลได้</Typography>
        </Box>
      ) : viewMode === 'monthly' && selectedMonth > 0 ? (
        monthLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#38BDF8' }} /></Box>
        ) : !monthDetail ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ไม่พบข้อมูลเดือนนี้</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, px: 3, py: 2 }}>
              <Box sx={{ bgcolor: '#EFF6FF', borderRadius: '12px', p: 2, border: '1px solid #BFDBFE' }}>
                <Typography sx={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600, mb: 0.5 }}>จำนวน WO</Typography>
                <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E40AF' }}>{monthDetail.summary.woCount}</Typography>
              </Box>
              <Box sx={{ bgcolor: '#FFF7ED', borderRadius: '12px', p: 2, border: '1px solid #FED7AA' }}>
                <Typography sx={{ fontSize: '12px', color: '#EA580C', fontWeight: 600, mb: 0.5 }}>ยอดเสนอราคา</Typography>
                <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#C2410C' }}>{fmt(monthDetail.summary.quotationTotal)}</Typography>
              </Box>
              <Box sx={{ bgcolor: '#FEF2F2', borderRadius: '12px', p: 2, border: '1px solid #FECACA' }}>
                <Typography sx={{ fontSize: '12px', color: '#DC2626', fontWeight: 600, mb: 0.5 }}>ต้นทุนรวม</Typography>
                <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#B91C1C' }}>{fmt(monthDetail.summary.actualCost)}</Typography>
              </Box>
              <Box sx={{ bgcolor: '#F0FDF4', borderRadius: '12px', p: 2, border: '1px solid #BBF7D0' }}>
                <Typography sx={{ fontSize: '12px', color: '#16A34A', fontWeight: 600, mb: 0.5 }}>กำไรสุทธิ</Typography>
                <Typography sx={{ fontSize: '22px', fontWeight: 800, color: monthDetail.summary.actualRevenue >= 0 ? '#15803D' : '#DC2626' }}>
                  {fmt(monthDetail.summary.actualRevenue)}
                </Typography>
              </Box>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { fontSize: '14px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC' } }}>
                    <TableCell>เลข WO</TableCell>
                    <TableCell>วันที่</TableCell>
                    <TableCell>โครงการ</TableCell>
                    <TableCell>ทีมช่าง</TableCell>
                    <TableCell align="right">เสนอราคา</TableCell>
                    <TableCell align="right">ต้นทุน</TableCell>
                    <TableCell align="right">กำไร</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthDetail.workOrders.map(wo => (
                    <TableRow key={wo.id} hover onClick={() => router.push(`/apps/work-orders/${wo.id}`)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F0F9FF' }, '& td': { fontSize: '14px', py: 1.5, borderBottom: '1px solid #F1F5F9' } }}>
                      <TableCell sx={{ fontWeight: 700, color: '#0284C7' }}>{wo.woNumber}</TableCell>
                      <TableCell>{new Date(wo.date).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell>{wo.projectName}</TableCell>
                      <TableCell>{wo.teamName}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#C2410C', fontVariantNumeric: 'tabular-nums' }}>{fmt(wo.quotationTotal)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>{fmt(wo.actualCost)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: wo.actualRevenue >= 0 ? '#15803D' : '#DC2626', fontVariantNumeric: 'tabular-nums' }}>{fmt(wo.actualRevenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )
      ) : (
        <>
          {/* Summary Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, px: 3, py: 2 }}>
            <Box sx={{ bgcolor: '#EFF6FF', borderRadius: '12px', p: 2, border: '1px solid #BFDBFE' }}>
              <Typography sx={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600, mb: 0.5 }}>จำนวน WO ทั้งปี</Typography>
              <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E40AF' }}>{reportData.totals.woCount}</Typography>
              <Typography sx={{ fontSize: '11px', color: '#64748B' }}>รายการ</Typography>
            </Box>
            <Box sx={{ bgcolor: '#FFF7ED', borderRadius: '12px', p: 2, border: '1px solid #FED7AA' }}>
              <Typography sx={{ fontSize: '12px', color: '#EA580C', fontWeight: 600, mb: 0.5 }}>ยอดเสนอราคา</Typography>
              <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#C2410C' }}>{fmt(reportData.totals.quotationTotal)}</Typography>
              <Typography sx={{ fontSize: '11px', color: '#64748B' }}>บาท (ก่อน VAT)</Typography>
            </Box>
            <Box sx={{ bgcolor: '#FEF2F2', borderRadius: '12px', p: 2, border: '1px solid #FECACA' }}>
              <Typography sx={{ fontSize: '12px', color: '#DC2626', fontWeight: 600, mb: 0.5 }}>ต้นทุนรวม</Typography>
              <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#B91C1C' }}>{fmt(reportData.totals.actualCost)}</Typography>
              <Typography sx={{ fontSize: '11px', color: '#64748B' }}>บาท</Typography>
            </Box>
            <Box sx={{ bgcolor: '#F0FDF4', borderRadius: '12px', p: 2, border: '1px solid #BBF7D0' }}>
              <Typography sx={{ fontSize: '12px', color: '#16A34A', fontWeight: 600, mb: 0.5 }}>กำไรสุทธิ</Typography>
              <Typography sx={{ fontSize: '22px', fontWeight: 800, color: reportData.totals.actualRevenue >= 0 ? '#15803D' : '#DC2626' }}>
                {fmt(reportData.totals.actualRevenue)}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#64748B' }}>บาท</Typography>
            </Box>
          </Box>

          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontSize: '14px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC' } }}>
                  <TableCell sx={{ width: 50 }}>#</TableCell>
                  <TableCell>เดือน</TableCell>
                  <TableCell align="right" sx={{ color: '#EA580C !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <FuseSvgIcon size={16}>lucide:file-text</FuseSvgIcon> เสนอราคา
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#DC2626 !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <FuseSvgIcon size={16}>lucide:trending-down</FuseSvgIcon> ต้นทุนที่แท้จริง
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#16A34A !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <FuseSvgIcon size={16}>lucide:trending-up</FuseSvgIcon> รายได้ที่แท้จริง
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.monthly.map((m, idx) => {
                  const hasData = m.woCount > 0;
                  return (
                    <TableRow key={m.month} hover
                      onClick={() => hasData && handleMonthClick(m.month)}
                      sx={{
                        cursor: hasData ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: hasData ? '#F0F9FF' : 'transparent' },
                        '& td': { fontSize: '14px', py: 1.5, borderBottom: '1px solid #F1F5F9' },
                      }}>
                      <TableCell sx={{ fontWeight: 600, color: '#94A3B8' }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 600, color: hasData ? '#0F172A' : '#CBD5E1' }}>
                            {monthNames[idx]} พ.ศ. {yearFilter}
                          </Typography>
                          {hasData && (
                            <Chip label={`${m.woCount} WO`} size="small"
                              sx={{ height: 20, fontSize: '10px', fontWeight: 700, bgcolor: '#DBEAFE', color: '#2563EB' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{
                        fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                        color: hasData ? '#C2410C' : '#E2E8F0',
                        fontSize: hasData ? '15px !important' : '14px',
                      }}>
                        {hasData ? fmt(m.quotationTotal) : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{
                        fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                        color: hasData ? '#DC2626' : '#E2E8F0',
                        fontSize: hasData ? '15px !important' : '14px',
                      }}>
                        {hasData ? fmt(m.actualCost) : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{
                        fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                        color: hasData ? (m.actualRevenue >= 0 ? '#15803D' : '#DC2626') : '#E2E8F0',
                        fontSize: hasData ? '15px !important' : '14px',
                      }}>
                        {hasData ? fmt(m.actualRevenue) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* ===== TOTAL ROW ===== */}
                <TableRow sx={{
                  bgcolor: '#FFFBEB',
                  '& td': { borderBottom: '2px solid #FDE68A', py: 2, fontSize: '16px !important' },
                }}>
                  <TableCell />
                  <TableCell>
                    <Typography sx={{ fontWeight: 800, color: '#D97706', fontSize: '16px' }}>
                      รวม
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#C2410C', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(reportData.totals.quotationTotal)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(reportData.totals.actualCost)}
                  </TableCell>
                  <TableCell align="right" sx={{
                    fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                    color: reportData.totals.actualRevenue >= 0 ? '#15803D' : '#DC2626',
                  }}>
                    {fmt(reportData.totals.actualRevenue)}
                  </TableCell>
                </TableRow>

                {/* ===== VAT 7% ROW ===== */}
                <TableRow sx={{
                  bgcolor: '#FEF3C7',
                  '& td': { borderBottom: '2px solid #FCD34D', py: 1.5 },
                }}>
                  <TableCell />
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: '#B45309', fontSize: '14px' }}>
                      ภาษี 7%
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#B45309', fontVariantNumeric: 'tabular-nums', fontSize: '14px' }}>
                    {fmt(reportData.vat7.quotationTotal)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#B45309', fontVariantNumeric: 'tabular-nums', fontSize: '14px' }}>
                    {fmt(reportData.vat7.actualCost)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#B45309', fontVariantNumeric: 'tabular-nums', fontSize: '14px' }}>
                    {fmt(reportData.vat7.actualRevenue)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, borderTop: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontSize: '14px', color: '#64748B' }}>
              แสดง 12 เดือน • ปี พ.ศ. {yearFilter}
              {teamFilter && ` • ทีม: ${teams.find(t => t.id === teamFilter)?.teamName || ''}`}
            </Typography>
            <Tooltip title="คลิกที่แถวเดือนที่มีข้อมูลเพื่อดูรายละเอียด" arrow>
              <Typography sx={{ fontSize: '13px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                <FuseSvgIcon size={14}>lucide:info</FuseSvgIcon>
                คลิกที่เดือนเพื่อดูรายละเอียด
              </Typography>
            </Tooltip>
          </Box>
        </>
      )}
    </Paper>
  );

  return <Root header={header} content={content} />;
}

export default ReportsPage;
