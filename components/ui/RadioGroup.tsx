/**
 * RadioGroup Component
 * 
 * A mobile-optimized radio button group for easy selection.
 * Provides better UX than dropdowns on touch devices.
 * 
 * @component
 * @example
 * ```tsx
 * <RadioGroup
 *   label="Gender"
 *   name="gender"
 *   options={[
 *     { value: 'male', label: 'Male' },
 *     { value: 'female', label: 'Female' }
 *   ]}
 *   value={gender}
 *   onChange={(e) => setGender(e.target.value)}
 * />
 * ```
 */

import React from 'react';
import styles from '@/styles/RadioGroup.module.css';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  /**
   * Label for the radio group
   */
  label?: string;

  /**
   * Name attribute for the radio inputs
   */
  name: string;

  /**
   * Array of radio options
   */
  options: RadioOption[];

  /**
   * Currently selected value
   */
  value?: string;

  /**
   * Change handler
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Layout direction
   */
  direction?: 'vertical' | 'horizontal';

  /**
   * Whether the radio group is disabled
   */
  disabled?: boolean;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Number of columns for grid layout
   */
  columns?: number;
}

/**
 * RadioGroup component for mobile-friendly option selection
 */
const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  error,
  required,
  direction = 'vertical',
  columns,
  disabled,
  className = '',
}) => {
  const groupId = `radio-group-${React.useId()}`;
  const errorId = `${groupId}-error`;

  const wrapperClasses = [
    styles.radioGroupWrapper,
    direction === 'horizontal' && !columns && styles.horizontal,
    error && styles.error,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const containerStyle = columns
    ? {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
    }
    : undefined;

  return (
    <div className={wrapperClasses}>
      {label && (
        <div className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </div>
      )}

      <div
        className={styles.optionsContainer}
        style={containerStyle}
        role="radiogroup"
        aria-labelledby={label ? groupId : undefined}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      >
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          const isChecked = value === option.value;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={styles.radioOption}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={isChecked}
                onChange={onChange}
                disabled={disabled}
                className={styles.radioInput}
                aria-checked={isChecked}
              />
              <span className={styles.radioLabel}>
                <span className={styles.radioButton} aria-hidden="true" />
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <span id={errorId} className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default RadioGroup;
