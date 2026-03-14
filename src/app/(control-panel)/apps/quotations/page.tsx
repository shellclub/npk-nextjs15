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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
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

const statusConfig: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  DRAFT: { label: 'แบบร่าง', color: 'default' },
  SENT: { label: 'ส่งแล้ว', color: 'info' },
  APPROVED: { label: 'อนุมัติ', color: 'success' },
  REJECTED: { label: 'ปฏิเสธ', color: 'error' },
  EXPIRED: { label: 'หมดอายุ', color: 'warning' },
};

const tabStatuses = ['ALL', 'DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'];
const tabLabels = ['ทั้งหมด', 'แบบร่าง', 'ส่งแล้ว', 'อนุมัติ', 'ปฏิเสธ', 'หมดอายุ'];

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
  const [tabIndex, setTabIndex] = useState(0);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tabStatuses[tabIndex] !== 'ALL') params.set('status', tabStatuses[tabIndex]);
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
  }, [tabIndex, search]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return (
    <div className="w-full p-24 md:p-32">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-16 mb-24"
      >
        <div>
          <Typography className="text-28 font-bold">ใบเสนอราคา</Typography>
          <Typography color="text.secondary" className="text-15">
            จัดการใบเสนอราคาทั้งหมด
          </Typography>
        </div>
        <Link href="/apps/quotations/new" passHref>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
            className="rounded-xl px-24"
          >
            สร้างใบเสนอราคา
          </Button>
        </Link>
      </motion.div>

      {/* Search + Tabs */}
      <Paper className="rounded-2xl shadow-sm mb-24">
        <Box className="p-16 pb-0">
          <TextField
            placeholder="ค้นหาเลขที่ ชื่อโครงการ หรือลูกค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FuseSvgIcon size={20} color="action">lucide:search</FuseSvgIcon>
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
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          className="px-16 mt-8"
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabLabels.map((label, i) => (
            <Tab key={i} label={label} />
          ))}
        </Tabs>
      </Paper>

      {/* Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <TableContainer component={Paper} className="rounded-2xl shadow-sm">
          {loading ? (
            <Box className="flex items-center justify-center py-64">
              <CircularProgress />
            </Box>
          ) : quotations.length === 0 ? (
            <Box className="flex flex-col items-center justify-center py-64">
              <FuseSvgIcon
                className="text-gray-400 mb-16"
                size={56}
              >
                lucide:file-text
              </FuseSvgIcon>
              <Typography color="text.secondary" className="text-16">
                ยังไม่มีใบเสนอราคา
              </Typography>
              <Typography color="text.secondary" className="text-13 mt-4">
                กดปุ่ม &quot;สร้างใบเสนอราคา&quot; เพื่อเริ่มต้น
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-bold text-15">เลขที่</TableCell>
                  <TableCell className="font-bold text-15">วันที่</TableCell>
                  <TableCell className="font-bold text-15">ลูกค้า</TableCell>
                  <TableCell className="font-bold text-15">สาขา</TableCell>
                  <TableCell className="font-bold text-15">โครงการ</TableCell>
                  <TableCell className="font-bold text-15" align="right">
                    ยอดรวม (บาท)
                  </TableCell>
                  <TableCell className="font-bold text-15" align="center">
                    สถานะ
                  </TableCell>
                  <TableCell className="font-bold text-15" align="center">
                    จัดการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotations.map((q) => (
                  <TableRow
                    key={q.id}
                    hover
                    className="cursor-pointer transition-colors"
                  >
                    <TableCell className="font-semibold text-blue-600 text-14">
                      {q.quotationNumber}
                    </TableCell>
                    <TableCell className="text-14">{formatDate(q.date)}</TableCell>
                    <TableCell className="text-14 max-w-200 truncate">
                      {q.customerGroup?.groupName}
                    </TableCell>
                    <TableCell className="text-14">
                      {q.branch?.name || '-'}
                    </TableCell>
                    <TableCell className="text-14 max-w-200 truncate">
                      {q.projectName || '-'}
                    </TableCell>
                    <TableCell align="right" className="text-14 font-semibold tabular-nums">
                      {formatCurrency(q.totalAmount)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={statusConfig[q.status]?.label || q.status}
                        color={statusConfig[q.status]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box className="flex items-center justify-center gap-4">
                        <Tooltip title="ดูรายละเอียด">
                          <IconButton size="small">
                            <FuseSvgIcon size={18}>lucide:eye</FuseSvgIcon>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="แก้ไข">
                          <IconButton size="small">
                            <FuseSvgIcon size={18}>lucide:pencil</FuseSvgIcon>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="พิมพ์ PDF">
                          <IconButton size="small">
                            <FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </motion.div>

      {/* Summary Footer */}
      {!loading && quotations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-16 flex items-center justify-between"
        >
          <Typography color="text.secondary" className="text-14">
            แสดง {quotations.length} รายการ
          </Typography>
          <Typography className="text-15 font-semibold">
            ยอดรวมทั้งหมด:{' '}
            <span className="text-blue-600">
              {formatCurrency(quotations.reduce((sum, q) => sum + Number(q.totalAmount), 0))} บาท
            </span>
          </Typography>
        </motion.div>
      )}
    </div>
  );
}

export default QuotationsPage;
