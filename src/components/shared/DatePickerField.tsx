'use client';

import { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { parse, format, isValid } from 'date-fns';

type DatePickerFieldProps = {
  label: string;
  /** Value as ISO string 'YYYY-MM-DD' or empty string */
  value: string;
  /** Callback with ISO string 'YYYY-MM-DD' or '' */
  onChange: (value: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  helperText?: string;
};

/**
 * Reusable Date Picker component that wraps MUI DatePicker.
 * - Accepts/emits ISO date strings (YYYY-MM-DD) for form state
 * - Displays in Thai format with Buddhist Era (พ.ศ.) via global AdapterDateFnsBE
 * - Clicking anywhere on the field opens the calendar popup
 * - Uses controlled open state + high z-index popper for MUI Dialog compatibility
 */
export default function DatePickerField({
  label,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  required = false,
  size = 'medium',
  fullWidth = true,
  helperText,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  // Parse ISO string to Date object
  const dateValue = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;
  const isValidDate = dateValue && isValid(dateValue);

  const canInteract = !readOnly && !disabled;

  return (
    <DatePicker
      label={label}
      value={isValidDate ? dateValue : null}
      onChange={(newDate: Date | null) => {
        // onChange always emits CE (ค.ศ.) ISO string for database storage
        if (newDate && isValid(newDate)) {
          onChange(format(newDate, 'yyyy-MM-dd'));
        } else {
          onChange('');
        }
      }}
      open={canInteract ? open : false}
      onOpen={() => { if (canInteract) setOpen(true); }}
      onClose={() => setOpen(false)}
      readOnly={readOnly}
      disabled={disabled}
      format="dd/MM/yyyy"
      slotProps={{
        textField: {
          size,
          fullWidth,
          required,
          helperText,
          onClick: () => {
            if (canInteract) setOpen(true);
          },
          sx: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              cursor: canInteract ? 'pointer' : 'default',
            },
            '& .MuiOutlinedInput-input, & .MuiInputBase-input': {
              cursor: canInteract ? 'pointer' : 'default',
            },
            '& .MuiDateSectionInput-root, & [data-sectionindex]': {
              cursor: canInteract ? 'pointer' : 'default',
            },
          },
        },
        popper: {
          sx: {
            // Ensure calendar popup appears above MUI Dialog (z-index 9999)
            zIndex: 99999,
          },
        },
        actionBar: {
          actions: ['clear', 'today'],
        },
      }}
    />
  );
}
