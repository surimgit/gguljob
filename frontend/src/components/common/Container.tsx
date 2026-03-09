import type { HTMLAttributes } from 'react';

type ContainerProps = HTMLAttributes<HTMLDivElement>;

const Container = ({ children, className = '', ...props }: ContainerProps) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Container;
