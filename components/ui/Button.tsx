/**
 * Button Component
 * 
 * A reusable, accessible button component with multiple variants and sizes.
 * Follows Airbnb JavaScript Style Guide and modern React patterns.
 * 
 * @component
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Submit
 * </Button>
 * ```
 */

import React from 'react';
import styles from '@/styles/Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant of the button
   */
  variant?: 'primary' | 'secondary' | 'outline';
  
  /**
   * Size of the button
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Whether the button should take full width
   */
  fullWidth?: boolean;
  
  /**
   * Loading state to disable button and show spinner
   */
  isLoading?: boolean;
  
  /**
   * Button content
   */
  children: React.ReactNode;
}

/**
 * Button component with customizable variants and sizes
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  isLoading = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    isLoading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
