import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const Card = ({ children, className = '', ...props }: CardProps) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
