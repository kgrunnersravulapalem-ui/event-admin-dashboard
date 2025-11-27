/**
 * Card Component
 * 
 * A simple card container component for layout purposes.
 * Follows minimal and modern design principles.
 * 
 * @component
 * @example
 * ```tsx
 * <Card>
 *   <h2>Title</h2>
 *   <p>Content goes here</p>
 * </Card>
 * ```
 */

import React from 'react';
import styles from '@/styles/Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card content
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Card component for wrapping content with consistent styling
 */
const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  const cardClasses = [styles.card, className].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

export default Card;
