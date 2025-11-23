'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaClock, FaLightbulb, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { Input } from '../components/Input';
import { checkVoteBlock, setVoteBlock, getRemainingTime } from '../utils/voteBlocker';

function VotePageContent() {
  const searchParams = useSearchParams();
  const pollIdFromUrl = searchParams.get('pollId');
  const keyIdFromUrl = searchParams.get('key');

  const [pollId, setPollId] = useState(pollIdFromUrl || '');
  const [keyId, setKeyId] = useState(keyIdFromUrl || '');
  const [poll, setPoll] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState(''); // For single choice
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]); // For multiple choice
  const [voterName, setVoterName] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState('');

  // Auto-load poll if pollId is in URL
  useEffect(() => {
    if (pollIdFromUrl && !poll) {
      loadPoll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollIdFromUrl]);

  // Check vote block when poll and keyId are available
  useEffect(() => {
    if (pollId && keyId) {
      const blocked = checkVoteBlock(pollId, keyId);
      setIsBlocked(blocked);
      if (blocked) {
        const remaining = getRemainingTime(pollId, keyId);
        setRemainingTime(remaining || '');
      }
    }
  }, [pollId, keyId, poll]);

  // Timer to update remaining time every minute when blocked
  useEffect(() => {
    if (!isBlocked || !pollId || !keyId) return;

    const interval = setInterval(() => {
      const blocked = checkVoteBlock(pollId, keyId);
      setIsBlocked(blocked);
      
      if (blocked) {
        const remaining = getRemainingTime(pollId, keyId);
        setRemainingTime(remaining || '');
      } else {
        setRemainingTime('');
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isBlocked, pollId, keyId]);

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
    const allowMultipleChoice = poll?.activeInstance?.AllowMultipleChoice || false;
    
    // Validate selection
    if (allowMultipleChoice) {
      if (!keyId || selectedOptions.length === 0) {
        setError('Please select at least one option and enter your access key');
        return;
      }
    } else {
      if (!keyId || !selectedOption) {
        setError('Please select an option and enter your access key');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        keyId,
        pollId,
        voterName: voterName || undefined,
      };

      // Send appropriate field based on poll type
      if (allowMultipleChoice) {
        payload.optionIds = selectedOptions;
      } else {
        payload.optionId = selectedOption;
      }

      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      const votedCount = data.votedOptions || 1;
      setMessage(`Vote submitted successfully! ${votedCount > 1 ? `${votedCount} options selected. ` : ''}`);
      setSelectedOption('');
      setSelectedOptions([]);
      setVoterName('');
      
      // Register vote block
      setVoteBlock(pollId, keyId);
      setIsBlocked(true);
      const remaining = getRemainingTime(pollId, keyId);
      setRemainingTime(remaining || '');
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

      setMessage('Suggestion submitted successfully!');
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

                  {/* Vote Block Warning - Show only this when blocked */}
                  {isBlocked ? (
                    <motion.div
                      className="p-6 glass rounded-lg border-2 border-yellow-500 bg-yellow-500/10"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-start gap-3">
                        <FaClock className="text-3xl text-yellow-500" />
                        <div>
                          <h4 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                            Ya votaste!
                          </h4>
                          <p className="text-sm text-[var(--foreground-muted)] flex items-center gap-2">
                            <FaLightbulb className="text-yellow-500" /> Puedes votar en otros polls o usar una clave de acceso diferente.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : message ? (
                    // Show only success message after voting
                    <motion.div
                      className="p-6 glass rounded-lg border-2 border-[var(--success)] bg-[var(--success-light)] text-[var(--success)]"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-3xl text-green-500" />
                        <div>
                          <span className="text-lg font-semibold">{message}</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <>
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
                          {poll.activeInstance.AllowMultipleChoice 
                            ? 'Select one or more options:' 
                            : 'Select an option:'}
                        </label>
                        {poll.activeInstance.AllowMultipleChoice && (
                          <p className="text-xs text-[var(--foreground-muted)] mb-3 flex items-center gap-1">
                            <FaCheck className="text-green-500" /> Multiple choice enabled - you can select as many options as you like
                          </p>
                        )}
                        <div className="space-y-3">
                          {poll.activeInstance.options.map((option: any, index: number) => {
                            const isSelected = poll.activeInstance.AllowMultipleChoice
                              ? selectedOptions.includes(option.id)
                              : selectedOption === option.id;
                            
                            return (
                              <motion.label
                                key={option.id}
                                className={`flex items-center p-4 glass rounded-lg cursor-pointer transition-base border-2 ${
                                  isSelected
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-light)]'
                                    : 'border-transparent hover:border-[var(--glass-border)]'
                                }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {poll.activeInstance.AllowMultipleChoice ? (
                                  <input
                                    type="checkbox"
                                    name="options"
                                    value={option.id}
                                    checked={selectedOptions.includes(option.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedOptions([...selectedOptions, option.id]);
                                      } else {
                                        setSelectedOptions(selectedOptions.filter(id => id !== option.id));
                                      }
                                    }}
                                    className="mr-3 w-5 h-5 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                  />
                                ) : (
                                  <input
                                    type="radio"
                                    name="option"
                                    value={option.id}
                                    checked={selectedOption === option.id}
                                    onChange={(e) => setSelectedOption(e.target.value)}
                                    className="mr-3 w-5 h-5 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                  />
                                )}
                                <span className="text-[var(--foreground)] font-medium">{option.text}</span>
                              </motion.label>
                            );
                          })}
                        </div>
                      </div>

                      <Button
                        onClick={submitVote}
                        disabled={
                          loading || 
                          !keyId || 
                          (poll.activeInstance.AllowMultipleChoice 
                            ? selectedOptions.length === 0 
                            : !selectedOption)
                        }
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
                            <FaLightbulb className="text-2xl text-yellow-500" />
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
                    </>
                  )}
                </motion.div>
              )}

              {/* Error Messages */}
              {error && (
                <motion.div
                  className="mt-4 p-4 glass rounded-lg border-2 border-[var(--error)] bg-[var(--error-light)] text-[var(--error)]"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <FaExclamationTriangle className="text-xl" />
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

