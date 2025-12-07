import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline';
  
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-blue-500 hover:bg-blue-700',
    secondary: 'bg-gray-500 hover:bg-gray-700',
    danger: 'bg-red-500 hover:bg-red-700',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
