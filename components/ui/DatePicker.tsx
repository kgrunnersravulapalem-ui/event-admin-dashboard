/**
 * DatePicker Component
 * 
 * A custom date picker component that matches the minimal design system
 */

'use client';

import React from 'react';
import styles from '@/styles/DatePicker.module.css';

export interface DatePickerProps {
  /**
   * Label for the date picker
   */
  label?: string;
  
  /**
   * Name attribute for the input
   */
  name?: string;
  
  /**
   * Current value
   */
  value: string;
  
  /**
   * Change handler
   */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Minimum date (YYYY-MM-DD format)
   */
  min?: string;
  
  /**
   * Maximum date (YYYY-MM-DD format)
   */
  max?: string;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
}

/**
 * DatePicker component with minimal styling
 */
const DatePicker: React.FC<DatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
  error,
  disabled = false,
}) => {
  const inputId = name || `datepicker-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        <input
          id={inputId}
          name={name}
          type="date"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          disabled={disabled}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
      </div>
      
      {error && (
        <p id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default DatePicker;
