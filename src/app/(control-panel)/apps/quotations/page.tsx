'use client';

import { useState, useEffect, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';
import Link from 'next/link';

type QuotationItem = {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type Quotation = {
  id: string;
  quotationNumber: string;
  date: string;
  customerGroup: { groupName: string };
  branch?: { name: string } | null;
  projectName?: string | null;
  subtotal: number;
  totalAmount: number;
  status: string;
  createdBy: { name: string };
  items: QuotationItem[];
};

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  DRAFT: { label: 'แบบร่าง', bgColor: '#F3F4F6', textColor: '#6B7280' },
  SENT: { label: 'รออนุมัติ', bgColor: '#FEF3C7', textColor: '#D97706' },
  APPROVED: { label: 'อนุมัติ', bgColor: '#D1FAE5', textColor: '#059669' },
  REJECTED: { label: 'ปฏิเสธ', bgColor: '#FEE2E2', textColor: '#DC2626' },
  EXPIRED: { label: 'หมดอายุ', bgColor: '#F3E8FF', textColor: '#7C3AED' },
};

const statusOptions = [
  { value: 'ALL', label: 'แสดงทั้งหมด' },
  { value: 'DRAFT', label: 'แบบร่าง' },
  { value: 'SENT', label: 'รออนุมัติ' },
  { value: 'APPROVED', label: 'อนุมัติ' },
  { value: 'REJECTED', label: 'ปฏิเสธ' },
  { value: 'EXPIRED', label: 'หมดอายุ' },
];

function formatCurrency(amount: number | string) {
  return Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<string[]>([]);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/quotations?${params.toString()}`);
      const data = await res.json();
      setQuotations(Array.isArray(data) ? data : []);
    } catch {
      console.error('Failed to fetch quotations');
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === quotations.length) {
      setSelected([]);
    } else {
      setSelected(quotations.map((q) => q.id));
    }
  };

  return (
    <div className="w-full p-24 md:p-32 lg:p-40">
      {/* Header — FlowAccount style */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-16 mb-32"
      >
        <div>
          <Typography
            sx={{ fontSize: '28px', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.02em' }}
          >
            ใบเสนอราคา
          </Typography>
          <Typography sx={{ fontSize: '16px', color: '#94A3B8', mt: 0.5 }}>
            ใบเสนอราคา {'>'} แสดงทั้งหมด
          </Typography>
        </div>
        <Link href="/apps/quotations/new" passHref>
          <Button
            variant="contained"
            size="large"
            startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
            sx={{
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                boxShadow: '0 6px 20px rgba(34, 197, 94, 0.45)',
              },
            }}
          >
            สร้างใหม่
          </Button>
        </Link>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            mb: 3,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderBottom: '1px solid #F1F5F9',
            }}
          >
            {/* Status filter button style like FlowAccount */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: '10px',
                  fontSize: '15px',
                  bgcolor: statusFilter === 'ALL' ? '#E0F2FE' : '#F8FAFC',
                  border: statusFilter === 'ALL' ? '1.5px solid #38BDF8' : '1px solid #E2E8F0',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  fontWeight: 500,
                  color: statusFilter === 'ALL' ? '#0284C7' : '#475569',
                }}
              >
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '15px' }}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ flex: 1 }} />

            {/* Search */}
            <TextField
              placeholder="ค้นหาจากชื่อลูกค้า, เลขที่เอกสาร, โปรเจ็ค..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{
                minWidth: 350,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  fontSize: '15px',
                  bgcolor: '#F8FAFC',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FuseSvgIcon size={20} color="action">
                      lucide:search
                    </FuseSvgIcon>
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <FuseSvgIcon size={16}>lucide:x</FuseSvgIcon>
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>
        </Paper>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: '#38BDF8' }} />
            </Box>
          ) : quotations.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 10,
              }}
            >
              <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>
                lucide:file-text
              </FuseSvgIcon>
              <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>
                ยังไม่มีใบเสนอราคา
              </Typography>
              <Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>
                กดปุ่ม &quot;สร้างใหม่&quot; เพื่อเริ่มสร้างใบเสนอราคา
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: '#F8FAFC',
                        '& th': {
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#475569',
                          borderBottom: '2px solid #E2E8F0',
                          py: 2,
                        },
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ pl: 3 }}>
                        <Checkbox
                          checked={selected.length === quotations.length && quotations.length > 0}
                          indeterminate={selected.length > 0 && selected.length < quotations.length}
                          onChange={toggleSelectAll}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>วันที่</TableCell>
                      <TableCell>เลขที่เอกสาร</TableCell>
                      <TableCell>ชื่อลูกค้า / ชื่อโปรเจ็ค</TableCell>
                      <TableCell align="right">ยอดรวม (บาท)</TableCell>
                      <TableCell align="center">สถานะ</TableCell>
                      <TableCell align="center" sx={{ width: 60 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quotations.map((q) => {
                      const sc = statusConfig[q.status] || statusConfig['DRAFT'];
                      return (
                        <TableRow
                          key={q.id}
                          hover
                          selected={selected.includes(q.id)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#F0F9FF' },
                            '& td': {
                              fontSize: '15px',
                              color: '#334155',
                              py: 2,
                              borderBottom: '1px solid #F1F5F9',
                            },
                          }}
                        >
                          <TableCell padding="checkbox" sx={{ pl: 3 }}>
                            <Checkbox
                              checked={selected.includes(q.id)}
                              onChange={() => toggleSelect(q.id)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                            {formatDate(q.date)}
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#0284C7',
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              {q.quotationNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '15px', fontWeight: 500 }}>
                              {q.customerGroup?.groupName}
                            </Typography>
                            {q.projectName && (
                              <Typography sx={{ fontSize: '13px', color: '#94A3B8', mt: 0.25 }}>
                                {q.projectName}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 600,
                              fontVariantNumeric: 'tabular-nums',
                              whiteSpace: 'nowrap',
                              fontSize: '16px !important',
                            }}
                          >
                            {formatCurrency(q.totalAmount)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={sc.label}
                              size="small"
                              sx={{
                                bgcolor: sc.bgColor,
                                color: sc.textColor,
                                fontWeight: 600,
                                fontSize: '13px',
                                borderRadius: '8px',
                                px: 0.5,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="เพิ่มเติม">
                              <IconButton size="small">
                                <FuseSvgIcon size={18}>lucide:more-horizontal</FuseSvgIcon>
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Footer / Pagination */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 3,
                  py: 2,
                  borderTop: '1px solid #F1F5F9',
                  bgcolor: '#FAFBFC',
                }}
              >
                <Typography sx={{ fontSize: '14px', color: '#64748B' }}>
                  แสดง {quotations.length} รายการ
                </Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>
                  แสดงยอดรวมทั้งหมด{' '}
                  <Box
                    component="span"
                    sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatCurrency(
                      quotations.reduce((sum, q) => sum + Number(q.totalAmount), 0)
                    )}
                  </Box>{' '}
                  บาท
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </motion.div>
    </div>
  );
}

export default QuotationsPage;
