/**
 * Toggle Component
 * 
 * A reusable toggle/switch component for boolean values
 */

import React from 'react';
import styles from '@/styles/Toggle.module.css';

export interface ToggleProps {
  id?: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
}

/**
 * Toggle Component
 */
const Toggle: React.FC<ToggleProps> = ({
  id = 'toggle',
  label,
  checked,
  onChange,
  disabled = false,
  description,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <input
          id={id}
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <label htmlFor={id} className={styles.label}>
          <span className={styles.switch} />
          {label && <span className={styles.text}>{label}</span>}
        </label>
      </div>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
};

export default Toggle;
