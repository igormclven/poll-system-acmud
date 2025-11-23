'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaKey, FaRedo, FaLightbulb, FaClock, FaCheckCircle, FaExclamationTriangle, FaChartBar, FaClipboard, FaEye, FaPause, FaPlay, FaTrash, FaFileDownload } from 'react-icons/fa';
import AnimatedBackground from '../../../components/AnimatedBackground';
import GlassCard from '../../../components/GlassCard';
import Button from '../../../components/Button';

interface Poll {
  id: string;
  title: string;
  description: string;
  isRecurring: boolean;
  recurrenceType: string;
  durationDays: number;
  startDate?: string;
  endDate?: string;
  allowSuggestions: boolean;
  createdAt: string;
}

interface PollInstance {
  instanceId: string;
  status: string;
  startDate: string;
  endDate: string;
  closedAt?: string;
  options: Array<{ id: string; text: string }>;
  createdAt: string;
}

interface PollResults {
  instanceId: string;
  totalVotes: number;
  results: Array<{
    optionId: string;
    optionText: string;
    votes: number;
    percentage: number;
  }>;
}

export default function ManagePollPage({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = use(params);
  const router = useRouter();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [activeInstance, setActiveInstance] = useState<PollInstance | null>(null);
  const [allInstances, setAllInstances] = useState<PollInstance[]>([]);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');

  useEffect(() => {
    loadPollDetails();
  }, [pollId]);

  const loadPollDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/poll/${pollId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load poll');
      }

      setPoll(data.poll);
      setActiveInstance(data.activeInstance || null);
      setAllInstances(data.allInstances || []);
      
      // Set the active instance as selected by default
      if (data.activeInstance) {
        setSelectedInstanceId(data.activeInstance.instanceId);
        loadResults(data.activeInstance.instanceId);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (instanceId: string) => {
    setLoadingResults(true);
    try {
      const response = await fetch(`/api/results/${instanceId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load results');
      }

      console.log('Results data:', data); // Debug log
      
      // Handle both old format (object) and new format (array)
      if (data.results && !Array.isArray(data.results)) {
        // Old format: convert object to array
        const resultsArray = Object.entries(data.results).map(([optionId, votes]) => ({
          optionId,
          optionText: optionId,
          votes: votes as number,
          percentage: data.totalVotes > 0 ? ((votes as number) / data.totalVotes) * 100 : 0,
        }));
        setResults({
          ...data,
          results: resultsArray,
        });
      } else {
        // New format: use as is
        setResults(data);
      }
    } catch (err: any) {
      console.error('Error loading results:', err);
      setResults(null);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleInstanceChange = (instanceId: string) => {
    setSelectedInstanceId(instanceId);
    loadResults(instanceId);
  };

  const manageInstance = async (operation: 'close' | 'reopen' | 'delete', instanceId: string) => {
    const confirmations = {
      close: 'Are you sure you want to close this instance? No more votes will be accepted.',
      reopen: 'Are you sure you want to reopen this instance? Voting will be enabled again.',
      delete: 'Are you sure you want to DELETE this instance? This will remove all votes and cannot be undone!',
    };

    if (!confirm(confirmations[operation])) {
      return;
    }

    setLoadingAction(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          instanceId,
          operation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to manage instance');
      }

      setMessage(`Instance ${operation}d successfully`);
      
      // Reload poll details
      await loadPollDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const getRecurrenceLabel = (type: string) => {
    const labels: Record<string, string> = {
      WEEKLY: 'Weekly',
      BIWEEKLY: 'Biweekly',
      MONTHLY: 'Monthly',
      CUSTOM: 'Custom',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <>
        <AnimatedBackground />
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <motion.div
                className="inline-block w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="mt-4 text-[var(--foreground-secondary)]">Loading poll details...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !poll) {
    return (
      <>
        <AnimatedBackground />
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <Link 
                href="/admin" 
                className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] text-sm font-medium inline-flex items-center gap-2 transition-colors"
              >
                <span>←</span>
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <GlassCard className="border-2 border-[var(--error)] bg-[var(--error-light)]">
              <h2 className="text-xl font-bold mb-2 text-[var(--error)] flex items-center gap-2">
                <FaExclamationTriangle />
                Error Loading Poll
              </h2>
              <p className="text-[var(--error)]">{error || 'Poll not found'}</p>
            </GlassCard>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 flex items-center justify-between"
          >
            <Link 
              href="/admin" 
              className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </Link>
            <Link href={`/admin/polls/${pollId}/keys`}>
              <Button variant="primary">
                <FaKey className="inline mr-2" /> Access Keys
              </Button>
            </Link>
          </motion.div>

          {/* Poll Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard variant="elevated" className="mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{poll.title}</h1>
                  {poll.description && (
                    <p className="text-[var(--foreground-secondary)] mb-4">{poll.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {poll.isRecurring && (
                      <span className="px-3 py-1 glass rounded-full text-sm font-medium text-[var(--accent-primary)] border border-[var(--accent-primary)] flex items-center gap-1">
                        <FaRedo /> {getRecurrenceLabel(poll.recurrenceType)}
                      </span>
                    )}
                    {poll.allowSuggestions && (
                      <span className="px-3 py-1 glass rounded-full text-sm font-medium text-[var(--accent-secondary)] border border-[var(--accent-secondary)] flex items-center gap-1">
                        <FaLightbulb /> Suggestions Enabled
                      </span>
                    )}
                    <span className="px-3 py-1 glass rounded-full text-sm font-medium text-[var(--foreground-secondary)] border border-[var(--glass-border)] flex items-center gap-1">
                      <FaClock /> {poll.durationDays || 'N/A'} days duration
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-[var(--foreground-muted)]">
                  <div>Created: {formatDate(poll.createdAt)}</div>
                  {poll.startDate && (
                    <div>Starts: {formatDate(poll.startDate)}</div>
                  )}
                  {poll.endDate && (
                    <div>Ends: {formatDate(poll.endDate)}</div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 glass-border">
                <motion.div
                  className="glass rounded-lg p-4 border-2 border-[var(--success)]"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-[var(--success)] text-sm font-medium mb-1">Status</div>
                  <div className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
                    {activeInstance ? <><span className="text-green-500">●</span> Active</> : <><span className="text-gray-400">●</span> Inactive</>}
                  </div>
                </motion.div>
                <motion.div
                  className="glass rounded-lg p-4 border-2 border-[var(--accent-primary)]"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-[var(--accent-primary)] text-sm font-medium mb-1">Total Votes</div>
                  <div className="text-2xl font-bold text-[var(--foreground)]">
                    {results?.totalVotes || 0}
                  </div>
                </motion.div>
                <motion.div
                  className="glass rounded-lg p-4 border-2 border-[var(--accent-tertiary)]"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-[var(--accent-tertiary)] text-sm font-medium mb-1">Poll ID</div>
                  <div className="text-sm font-mono text-[var(--foreground)] truncate" title={pollId}>
                    {pollId.substring(0, 16)}...
                  </div>
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Active Instance */}
          {activeInstance && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard variant="elevated" className="mb-6 border-2 border-[var(--success)]">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <span className="text-green-500">●</span>
                  Active Instance
                </h2>
                <div className="glass rounded-lg p-6 border border-[var(--success)]">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-[var(--foreground-muted)]">Instance ID</div>
                      <div className="font-mono text-sm text-[var(--foreground)]">{activeInstance.instanceId}</div>
                    </div>
                    <div>
                      <div className="text-sm text-[var(--foreground-muted)]">Status</div>
                      <div className="font-semibold text-[var(--success)]">{activeInstance.status}</div>
                    </div>
                    <div>
                      <div className="text-sm text-[var(--foreground-muted)]">Start Date</div>
                      <div className="text-sm text-[var(--foreground)]">{formatDate(activeInstance.startDate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-[var(--foreground-muted)]">End Date</div>
                      <div className="text-sm text-[var(--foreground)]">{formatDate(activeInstance.endDate)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm font-medium text-[var(--foreground-secondary)] mb-2">Options:</div>
                    <div className="grid md:grid-cols-2 gap-2">
                      {activeInstance.options.map((option, index) => (
                        <motion.div
                          key={option.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="flex items-center p-3 glass rounded border border-[var(--glass-border)]"
                        >
                          <span className="w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-xs font-bold mr-3">
                            {index + 1}
                          </span>
                          <span className="text-[var(--foreground)]">{option.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard variant="elevated">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
                  <FaChartBar />
                  Results
                </h2>
                {activeInstance && (
                  <Button
                    onClick={() => loadResults(selectedInstanceId)}
                    variant="primary"
                  >
                    <FaRedo className="inline mr-2" /> Refresh Results
                  </Button>
                )}
              </div>

              {loadingResults ? (
                <div className="text-center py-12">
                  <motion.div
                    className="inline-block w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <p className="mt-4 text-[var(--foreground-secondary)]">Loading results...</p>
                </div>
              ) : results && results.totalVotes > 0 && Array.isArray(results.results) ? (
                <div className="space-y-4">
                  <div className="mb-4 text-sm text-[var(--foreground-secondary)]">
                    Total Votes: <span className="font-bold text-[var(--foreground)]">{results.totalVotes}</span>
                  </div>
                  
                  {results.results.map((result, index) => (
                    <motion.div
                      key={result.optionId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass rounded-lg p-4 border-2 border-transparent hover:border-[var(--accent-primary)] transition-base"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </span>
                          <span className="font-medium text-[var(--foreground)]">{result.optionText}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[var(--accent-primary)]">{result.votes}</div>
                          <div className="text-sm text-[var(--foreground-muted)]">{result.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full glass rounded-full h-3 mt-3 overflow-hidden">
                        <motion.div
                          className="h-3 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${result.percentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 + 0.2 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--foreground-muted)]">
                  <FaFileDownload className="text-6xl mb-4 mx-auto opacity-50" />
                  <div>No votes yet for this poll instance</div>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* All Instances Management */}
          {allInstances.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard variant="elevated" className="mt-6">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
                  <FaClipboard />
                  All Instances
                </h2>
                
                <div className="space-y-4">
                  {allInstances.map((instance, index) => (
                    <motion.div
                      key={instance.instanceId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className={`glass rounded-lg p-4 border-2 ${
                        instance.status === 'Active' 
                          ? 'border-[var(--success)] bg-[var(--success-light)]' 
                          : 'border-[var(--glass-border)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              instance.status === 'Active'
                                ? 'bg-[var(--success)] text-white'
                                : 'glass text-[var(--foreground-muted)] border border-[var(--glass-border)]'
                            }`}>
                              {instance.status}
                            </span>
                            <span className="font-mono text-sm text-[var(--foreground-muted)]">
                              {instance.instanceId}
                            </span>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-[var(--foreground-muted)]">Start:</span>{' '}
                              <span className="font-medium text-[var(--foreground)]">{formatDate(instance.startDate)}</span>
                            </div>
                            <div>
                              <span className="text-[var(--foreground-muted)]">End:</span>{' '}
                              <span className="font-medium text-[var(--foreground)]">{formatDate(instance.endDate)}</span>
                            </div>
                            {instance.closedAt && (
                              <div className="md:col-span-2">
                                <span className="text-[var(--foreground-muted)]">Closed:</span>{' '}
                                <span className="font-medium text-[var(--error)]">{formatDate(instance.closedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          <Button
                            onClick={() => {
                              setSelectedInstanceId(instance.instanceId);
                              loadResults(instance.instanceId);
                            }}
                            variant="secondary"
                            className="text-sm"
                          >
                            <FaChartBar className="inline mr-1" /> Results
                          </Button>
                          
                          {instance.status === 'Active' ? (
                            <Button
                              onClick={() => manageInstance('close', instance.instanceId)}
                              disabled={loadingAction}
                              variant="secondary"
                              className="text-sm"
                            >
                              <FaPause className="inline mr-1" /> Close
                            </Button>
                          ) : (
                            <Button
                              onClick={() => manageInstance('reopen', instance.instanceId)}
                              disabled={loadingAction}
                              variant="primary"
                              className="text-sm"
                            >
                              <FaPlay className="inline mr-1" /> Reopen
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => manageInstance('delete', instance.instanceId)}
                            disabled={loadingAction}
                            variant="danger"
                            className="text-sm"
                          >
                            <FaTrash className="inline mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-6"
              >
                <GlassCard className="border-2 border-[var(--success)] bg-[var(--success-light)]">
                  <div className="flex items-center gap-2 text-[var(--success)]">
                    <FaCheckCircle className="text-xl" />
                    <span>{message}</span>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {error && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-6"
              >
                <GlassCard className="border-2 border-[var(--error)] bg-[var(--error-light)]">
                  <div className="flex items-center gap-2 text-[var(--error)]">
                    <FaExclamationTriangle className="text-xl" />
                    <span>{error}</span>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 grid md:grid-cols-2 gap-4"
          >
            <Link
              href={`/vote?pollId=${pollId}`}
              target="_blank"
            >
              <Button variant="secondary" className="w-full py-4 text-lg">
                <FaEye className="inline mr-2" /> Preview Voting Page
              </Button>
            </Link>
            <Link href={`/admin/polls/${pollId}/keys`}>
              <Button variant="primary" className="w-full py-4 text-lg">
                <FaKey className="inline mr-2" /> Manage Access Keys
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}

