'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { Input } from '../components/Input';

function VotePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pollIdFromUrl = searchParams.get('pollId');
  const keyIdFromUrl = searchParams.get('key');

  const [pollId, setPollId] = useState(pollIdFromUrl || '');
  const [keyId, setKeyId] = useState(keyIdFromUrl || '');
  const [poll, setPoll] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [voterName, setVoterName] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Auto-load poll if pollId is in URL
  useEffect(() => {
    if (pollIdFromUrl && !poll) {
      loadPoll();
    }
  }, [pollIdFromUrl]);

  const loadPoll = async () => {
    if (!pollId) {
      setError('Please enter a Poll ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/poll/${pollId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load poll');
      }

      if (!data.activeInstance) {
        throw new Error('No active poll instance found');
      }

      setPoll(data);
      setMessage('');
    } catch (err: any) {
      setError(err.message);
      setPoll(null);
    } finally {
      setLoading(false);
    }
  };

  const submitVote = async () => {
    if (!keyId || !selectedOption) {
      setError('Please select an option and enter your access key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId,
          pollId,
          optionId: selectedOption,
          voterName: voterName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      setMessage(`✅ Vote submitted successfully! Remaining uses: ${data.remainingUses}`);
      setSelectedOption('');
      setVoterName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitSuggestion = async () => {
    if (!suggestion) {
      setError('Please enter a suggestion');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          text: suggestion,
          targetWeek: 'next',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit suggestion');
      }

      setMessage('✅ Suggestion submitted successfully!');
      setSuggestion('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard variant="elevated">
              {/* Load Poll Section */}
              {!poll && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Input
                    label="Poll ID"
                    type="text"
                    value={pollId}
                    onChange={(e) => setPollId(e.target.value)}
                    placeholder="Enter Poll ID"
                  />
                  <Button
                    onClick={loadPoll}
                    loading={loading}
                    variant="primary"
                    className="w-full mt-4"
                  >
                    Load Poll
                  </Button>
                </motion.div>
              )}

              {/* Poll Display */}
              {poll && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="mb-6 p-6 glass rounded-lg border-2 border-[var(--accent-primary)]">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">{poll.poll.title}</h2>
                    {poll.poll.description && (
                      <p className="text-[var(--foreground-secondary)]">{poll.poll.description}</p>
                    )}
                  </div>

                  {/* Access Key Input - Only show if not provided in URL */}
                  {!keyIdFromUrl && (
                    <div className="mb-6">
                      <Input
                        label="Access Key"
                        type="text"
                        value={keyId}
                        onChange={(e) => setKeyId(e.target.value)}
                        placeholder="Enter your access key"
                      />
                    </div>
                  )}

                  {/* Voter Name (Optional) */}
                  <div className="mb-6">
                    <Input
                      label="Your Name (Optional)"
                      type="text"
                      value={voterName}
                      onChange={(e) => setVoterName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Options */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-3">
                      Select an option:
                    </label>
                    <div className="space-y-3">
                      {poll.activeInstance.options.map((option: any, index: number) => (
                        <motion.label
                          key={option.id}
                          className={`flex items-center p-4 glass rounded-lg cursor-pointer transition-base border-2 ${
                            selectedOption === option.id
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-light)]'
                              : 'border-transparent hover:border-[var(--glass-border)]'
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <input
                            type="radio"
                            name="option"
                            value={option.id}
                            checked={selectedOption === option.id}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="mr-3 w-5 h-5 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                          />
                          <span className="text-[var(--foreground)] font-medium">{option.text}</span>
                        </motion.label>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={submitVote}
                    disabled={loading || !selectedOption || !keyId}
                    loading={loading}
                    variant="primary"
                    className="w-full py-4 text-lg"
                  >
                    Submit Vote
                  </Button>

                  {/* Suggestions Section */}
                  {poll.poll.allowSuggestions && (
                    <motion.div
                      className="mt-8 pt-8 glass-border"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                        <span className="text-2xl">💡</span>
                        Suggest a New Option
                      </h3>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={suggestion}
                          onChange={(e) => setSuggestion(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-lg glass border-2 border-transparent focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] transition-base"
                          placeholder="Your suggestion"
                        />
                        <Button
                          onClick={submitSuggestion}
                          disabled={loading || !suggestion}
                          loading={loading}
                          variant="secondary"
                        >
                          Submit
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Messages */}
              {message && (
                <motion.div
                  className="mt-4 p-4 glass rounded-lg border-2 border-[var(--success)] bg-[var(--success-light)] text-[var(--success)]"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    <span>{message}</span>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  className="mt-4 p-4 glass rounded-lg border-2 border-[var(--error)] bg-[var(--error-light)] text-[var(--error)]"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <span>{error}</span>
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

export default function VotePage() {
  return (
    <Suspense fallback={
      <>
        <AnimatedBackground />
        <div className="min-h-screen py-12 px-4 flex items-center justify-center">
          <GlassCard variant="elevated" className="text-center">
            <motion.div
              className="inline-block w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="mt-4 text-[var(--foreground-secondary)]">Loading poll...</p>
          </GlassCard>
        </div>
      </>
    }>
      <VotePageContent />
    </Suspense>
  );
}

