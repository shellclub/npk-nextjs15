/**
 * Custom MUI Date Adapter for Thai Buddhist Era (พ.ศ.)
 *
 * - Displays calendar in Thai language (เดือน/วัน ภาษาไทย)
 * - Converts year display from ค.ศ. to พ.ศ. (+543)
 * - Internal Date values remain in ค.ศ. (CE) for database storage
 */
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { th } from 'date-fns/locale/th';

export class AdapterDateFnsBE extends AdapterDateFns {
  constructor(options?: any) {
    super({ ...options, locale: th });

    // Save original formatByString (it's defined as a class field/property in parent)
    const originalFormat = this.formatByString.bind(this);

    /**
     * Override formatByString to convert CE year → BE year (พ.ศ.) in output.
     * Calendar headers, input fields, etc. will show พ.ศ.
     * Internal Date objects are NOT modified — they stay in CE for DB storage.
     *
     * IMPORTANT: Only replaces 4-digit years to avoid corrupting day numbers
     * (e.g. day "26" should NOT become "69").
     */
    this.formatByString = (date: Date, formatString: string): string => {
      const result = originalFormat(date, formatString);
      const ceYear = date.getFullYear();
      const beYear = ceYear + 543;

      // Replace only 4-digit CE year with BE year (e.g., 2026 → 2569)
      const ceYearStr = String(ceYear);
      const beYearStr = String(beYear);

      return result.replaceAll(ceYearStr, beYearStr);
    };
  }
}

/**
 * Thai locale text overrides for MUI DatePicker UI labels
 */
export const thaiLocaleText = {
  // Toolbar
  datePickerToolbarTitle: 'เลือกวันที่',
  dateTimePickerToolbarTitle: 'เลือกวันเวลา',
  timePickerToolbarTitle: 'เลือกเวลา',

  // Action bar buttons
  cancelButtonLabel: 'ยกเลิก',
  clearButtonLabel: 'ล้าง',
  okButtonLabel: 'ตกลง',
  todayButtonLabel: 'วันนี้',

  // Navigation
  previousMonth: 'เดือนก่อนหน้า',
  nextMonth: 'เดือนถัดไป',

  // Calendar header
  calendarWeekNumberHeaderLabel: 'สัปดาห์',
};
