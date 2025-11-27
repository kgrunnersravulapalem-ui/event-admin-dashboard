/**
 * Input Component
 * 
 * A reusable, accessible input component with validation support.
 * Follows Airbnb JavaScript Style Guide and modern React patterns.
 * 
 * @component
 * @example
 * ```tsx
 * <Input
 *   label="Name"
 *   placeholder="Enter your name"
 *   required
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 * />
 * ```
 */

import React from 'react';
import styles from '@/styles/Input.module.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Label for the input field
   */
  label?: string;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Helper text to display below input
   */
  helperText?: string;
  
  /**
   * Size variant
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Icon element to display on the left
   */
  icon?: React.ReactNode;
}

/**
 * Input component with label, validation, and helper text support
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'medium',
      icon,
      required,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${React.useId()}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const wrapperClasses = [
      styles.inputWrapper,
      styles[size],
      error && styles.error,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      styles.input,
      icon && styles.withIcon,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        
        <div className={styles.inputContainer}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            required={required}
            {...props}
          />
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

Input.displayName = 'Input';

export default Input;
