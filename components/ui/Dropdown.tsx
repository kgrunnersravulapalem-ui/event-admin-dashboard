/**
 * Dropdown Component
 * 
 * A reusable, accessible select/dropdown component.
 * Follows Airbnb JavaScript Style Guide and modern React patterns.
 * 
 * @component
 * @example
 * ```tsx
 * <Dropdown
 *   label="Category"
 *   options={[
 *     { value: '3K', label: '3K Run' },
 *     { value: '5K', label: '5K Run' }
 *   ]}
 *   value={category}
 *   onChange={(e) => setCategory(e.target.value)}
 * />
 * ```
 */

import React from 'react';
import styles from '@/styles/Dropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Label for the dropdown
   */
  label?: string;
  
  /**
   * Array of options to display
   */
  options: DropdownOption[];
  
  /**
   * Placeholder text when no option is selected
   */
  placeholder?: string;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Helper text to display below dropdown
   */
  helperText?: string;
  
  /**
   * Size variant
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Dropdown component with label, validation, and helper text support
 */
const Dropdown = React.forwardRef<HTMLSelectElement, DropdownProps>(
  (
    {
      label,
      options,
      placeholder = 'Select an option',
      error,
      helperText,
      size = 'medium',
      required,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${React.useId()}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const wrapperClasses = [
      styles.selectWrapper,
      styles[size],
      error && styles.error,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        
        <div className={styles.selectContainer}>
          <select
            ref={ref}
            id={selectId}
            className={styles.select}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            required={required}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className={styles.arrow}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        {error && (
          <span id={errorId} className={styles.errorMessage} role="alert">
            {error}
          </span>
        )}
        
        {!error && helperText && (
          <span id={helperId} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export default Dropdown;
