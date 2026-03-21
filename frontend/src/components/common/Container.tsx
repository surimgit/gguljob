import type { HTMLAttributes } from 'react';

type ContainerProps = HTMLAttributes<HTMLDivElement>;

const Container = ({ children, className = '', ...props }: ContainerProps) => {
  return (
    <div className={`w-full px-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Container;
