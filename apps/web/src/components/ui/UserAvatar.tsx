'use client';

interface UserAvatarProps {
  name: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function UserAvatar({ name, size = 'md', className = '' }: UserAvatarProps) {
  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ${sizeMap[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
