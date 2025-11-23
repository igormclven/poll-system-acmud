'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedBackground from './components/AnimatedBackground';
import GlassCard from './components/GlassCard';

export default function Home() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = 'https://acmud.org';
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <GlassCard variant="elevated" className="text-center max-w-2xl">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.2,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <motion.h1 
                  className="text-6xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    backgroundSize: '200% auto',
                  }}
                >
                  Poll System
                </motion.h1>
                
                <motion.p
                  className="text-2xl text-[var(--foreground-secondary)] mb-8 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  ACM UD
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="flex items-center justify-center gap-2"
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Redirigiendo a acmud.org...
                  </p>
                </motion.div>
              </motion.div>
            </GlassCard>
          </motion.div>
        </div>

        <motion.footer
          className="w-full py-6 text-center glass-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="glass inline-block px-6 py-3 rounded-full">
            <p className="text-sm text-[var(--foreground-secondary)]">
              © 2025 ACM UD
            </p>
          </div>
        </motion.footer>
      </div>
    </>
  );
}
