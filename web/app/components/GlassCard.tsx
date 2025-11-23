'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'interactive';
  className?: string;
}

const variants = {
  default: {
    hover: { scale: 1 },
  },
  elevated: {
    hover: { scale: 1 },
  },
  interactive: {
    hover: { scale: 1.02, y: -4 },
    tap: { scale: 0.98 },
  },
};

export default function GlassCard({ 
  children, 
  variant = 'default', 
  className = '',
  ...props 
}: GlassCardProps) {
  const baseClasses = 'glass rounded-2xl';
  const variantClasses = {
    default: 'p-6',
    elevated: 'p-8 hover-glow',
    interactive: 'p-6 hover-lift cursor-pointer',
  };

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      variants={variants[variant]}
      initial="initial"
      whileHover="hover"
      whileTap={variant === 'interactive' ? 'tap' : undefined}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

