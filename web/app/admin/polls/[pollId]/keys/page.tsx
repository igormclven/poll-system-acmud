'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedBackground from '../../../../components/AnimatedBackground';
import GlassCard from '../../../../components/GlassCard';
import Button from '../../../../components/Button';
import { Input } from '../../../../components/Input';

export default function PollKeysPage({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = use(params);
  const [keys, setKeys] = useState<any[]>([]);
  const [count, setCount] = useState(10);
  const [maxUses, setMaxUses] = useState(1);
  const [expiryDays, setExpiryDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const generateKeys = async () => {
    setLoading(true);
    setMessage('');

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const response = await fetch('/api/admin/access-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          count,
          maxUses,
          expiryDate: expiryDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate keys');
      }

      setKeys(data.keys);
      setMessage(`✅ Successfully generated ${data.keys.length} access keys`);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (keyId: string) => {
    const url = `${window.location.origin}/vote?pollId=${pollId}&key=${keyId}`;
    navigator.clipboard.writeText(url);
    setMessage('✅ Voting URL copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  const exportKeys = () => {
    const csv = keys.map(k => 
      `${k.keyId},${window.location.origin}/vote?pollId=${pollId}&key=${k.keyId},${k.maxUses},${k.expiryDate}`
    ).join('\n');
    const blob = new Blob([`KeyID,VotingURL,MaxUses,ExpiryDate\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poll-${pollId}-keys.csv`;
    a.click();
  };

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link 
              href="/admin" 
              className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard variant="elevated">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🔑</span>
                <h1 className="text-3xl font-bold text-[var(--foreground)]">Generate Access Keys</h1>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Input
                  label="Number of Keys"
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  min="1"
                  max="1000"
                />

                <Input
                  label="Max Uses per Key"
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  min="1"
                />

                <Input
                  label="Expiry (Days)"
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  min="1"
                />
              </div>

              <Button
                onClick={generateKeys}
                loading={loading}
                variant="primary"
                className="w-full py-4 text-lg mb-6"
              >
                Generate Keys
              </Button>

              {message && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 glass rounded-lg border-2 border-[var(--accent-primary)] bg-[var(--accent-primary-light)] text-[var(--accent-primary)]"
                >
                  {message}
                </motion.div>
              )}

              {keys.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                      <span>📋</span>
                      Generated Keys ({keys.length})
                    </h2>
                    <Button
                      onClick={exportKeys}
                      variant="secondary"
                    >
                      📥 Export CSV
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {keys.map((key, index) => (
                      <motion.div
                        key={key.keyId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 glass rounded-lg hover:border-[var(--accent-primary)] border-2 border-transparent transition-base"
                      >
                        <div className="flex-1 font-mono text-sm text-[var(--foreground)] break-all pr-4">
                          {key.keyId}
                        </div>
                        <Button
                          onClick={() => copyToClipboard(key.keyId)}
                          variant="ghost"
                          className="shrink-0"
                        >
                          📋 Copy URL
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </>
  );
}

