'use client';

import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';

function PendingPaymentsPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <Paper className="rounded-2xl shadow-sm p-48 max-w-480 mx-auto">
          <Box className="mb-24">
            <FuseSvgIcon className="text-blue-500" size={64}>lucide:construction</FuseSvgIcon>
          </Box>
          <Typography className="text-24 font-bold mb-8">
            งานเสร็จรอจ่ายช่าง
          </Typography>
          <Typography color="text.secondary" className="text-14">
            โมดูลนี้อยู่ระหว่างการพัฒนา จะเปิดใช้งานเร็ว ๆ นี้
          </Typography>
          <Typography color="text.secondary" className="text-12 mt-16">
            Coming Soon
          </Typography>
        </Paper>
      </motion.div>
    </div>
  );
}

export default PendingPaymentsPage;
