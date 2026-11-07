import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable accessible Button component.
 * Renders a React Router <Link> when `to` is provided, an <a> when `href` is provided,
 * or a native <button> element otherwise. Meets 44x44px minimum touch target size.
 */
export default function Button({
  children,
  to,
  href,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  onClick,
  disabled = false,
  ...rest
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const widthClass = fullWidth ? 'btn-full' : '';
  const combinedClass = `btn ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={combinedClass} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClass} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={combinedClass}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
