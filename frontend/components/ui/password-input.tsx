'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  variant?: 'light' | 'dark';
  inputClassName?: string;
};

const variantStyles = {
  light: {
    input:
      'border-purple-100 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-purple-300 focus:border-purple-400',
    icon: 'text-gray-400',
    toggle: 'text-gray-400 hover:text-gray-600',
  },
  dark: {
    input:
      'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:ring-purple-500',
    icon: 'text-slate-500',
    toggle: 'text-slate-500 hover:text-slate-300',
  },
} as const;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ variant = 'light', className, inputClassName, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const styles = variantStyles[variant];

    return (
      <div className={cn('relative', className)}>
        <Lock
          className={cn('absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none', styles.icon)}
          size={16}
        />
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn(
            'w-full pl-9 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
            styles.input,
            inputClassName,
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors',
            styles.toggle,
          )}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
