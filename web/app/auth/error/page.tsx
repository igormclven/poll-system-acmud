'use client';

import { motion } from 'framer-motion';
import AnimatedBackground from '../../components/AnimatedBackground';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/Button';

export default function AuthError() {
  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <GlassCard variant="elevated" className="text-center">
            <motion.div
              className="text-7xl mb-6"
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1.1, 1.1, 1],
              }}
              transition={{
                duration: 0.6,
                times: [0, 0.2, 0.4, 0.6, 1],
              }}
            >
              ⚠️
            </motion.div>
            <motion.h1
              className="text-3xl font-bold text-[var(--foreground)] mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Authentication Error
            </motion.h1>
            <motion.p
              className="text-[var(--foreground-secondary)] mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              There was a problem signing you in. Please try again.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <a href="/auth/signin">
                <Button variant="primary" className="w-full py-3 text-lg">
                  Try Again
                </Button>
              </a>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    </>
  );
}

