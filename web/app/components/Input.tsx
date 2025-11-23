'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>, 
  | 'className' 
  | 'onAnimationStart' 
  | 'onAnimationEnd' 
  | 'onAnimationIteration'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDrag'
> {
  label?: string;
  error?: string;
  className?: string;
}

interface TextAreaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>, 
  | 'className' 
  | 'onAnimationStart' 
  | 'onAnimationEnd' 
  | 'onAnimationIteration'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDrag'
> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <motion.label
            className="block text-sm font-medium text-[var(--foreground-secondary)] mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        <motion.input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-lg
            glass border-2
            ${error 
              ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]' 
              : 'border-transparent focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]'
            }
            text-[var(--foreground)]
            placeholder:text-[var(--foreground-muted)]
            focus:outline-none focus:ring-2 focus:ring-offset-0
            transition-base
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          {...props}
        />
        {error && (
          <motion.p
            className="mt-1 text-sm text-[var(--error)]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <motion.label
            className="block text-sm font-medium text-[var(--foreground-secondary)] mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        <motion.textarea
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-lg
            glass border-2
            ${error 
              ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]' 
              : 'border-transparent focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]'
            }
            text-[var(--foreground)]
            placeholder:text-[var(--foreground-muted)]
            focus:outline-none focus:ring-2 focus:ring-offset-0
            transition-base
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
            ${className}
          `}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          {...props}
        />
        {error && (
          <motion.p
            className="mt-1 text-sm text-[var(--error)]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default Input;

