interface BadgeProps {
  label: string;
  variant?: 'tech' | 'status' | 'accent';
}

const variantStyles = {
  tech: 'border border-gray-300 text-gray-700 bg-white',
  status: 'bg-amber-100 text-amber-700',
  accent: 'bg-primary text-white',
};

const Badge = ({ label, variant = 'tech' }: BadgeProps) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}>
      {label}
    </span>
  );
};

export default Badge;
