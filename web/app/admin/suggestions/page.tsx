'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLightbulb, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import AnimatedBackground from '../../components/AnimatedBackground';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/Button';

interface Suggestion {
  id: string;
  pollId: string;
  text: string;
  status: string;
  targetWeek: string;
  createdAt: string;
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedPoll, setSelectedPoll] = useState('');
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPolls();
  }, []);

  useEffect(() => {
    if (selectedPoll) {
      loadSuggestions();
    }
  }, [selectedPoll]);

  const loadPolls = async () => {
    try {
      const response = await fetch('/api/admin/polls');
      const data = await response.json();
      setPolls(data.polls || []);
      if (data.polls?.length > 0) {
        setSelectedPoll(data.polls[0].id);
      }
    } catch (error) {
      console.error('Error loading polls:', error);
    }
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/suggestions?pollId=${selectedPoll}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSuggestionStatus = async (suggestionId: string, status: string) => {
    try {
      await fetch('/api/admin/suggestions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: selectedPoll,
          suggestionId,
          status,
        }),
      });
      loadSuggestions();
    } catch (error) {
      console.error('Error updating suggestion:', error);
    }
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'Pending');
  const approvedSuggestions = suggestions.filter(s => s.status === 'Approved');

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
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
                <FaLightbulb className="text-4xl text-yellow-500" />
                <h1 className="text-3xl font-bold text-[var(--foreground)]">Manage Suggestions</h1>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                  Select Poll
                </label>
                <select
                  value={selectedPoll}
                  onChange={(e) => setSelectedPoll(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg glass border-2 border-transparent focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--foreground)] transition-base"
                >
                  {polls.map((poll) => (
                    <option key={poll.id} value={poll.id}>
                      {poll.title}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <motion.div
                    className="inline-block w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <p className="mt-4 text-[var(--foreground-secondary)]">Loading suggestions...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Pending Suggestions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                      <FaClock className="text-yellow-500" />
                      Pending Suggestions ({pendingSuggestions.length})
                    </h2>
                    {pendingSuggestions.length === 0 ? (
                      <div className="text-[var(--foreground-muted)] text-sm p-6 glass rounded-lg text-center">
                        No pending suggestions
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <AnimatePresence>
                          {pendingSuggestions.map((suggestion, index) => (
                            <motion.div
                              key={suggestion.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.05 }}
                              className="p-4 glass rounded-lg border-2 border-transparent hover:border-[var(--accent-primary)] transition-base"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <p className="text-[var(--foreground)] font-medium mb-2">{suggestion.text}</p>
                                  <p className="text-xs text-[var(--foreground-muted)]">
                                    Submitted: {new Date(suggestion.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <Button
                                    onClick={() => updateSuggestionStatus(suggestion.id, 'Approved')}
                                    variant="primary"
                                    className="text-sm"
                                  >
                                    <FaCheck className="inline mr-1" /> Approve
                                  </Button>
                                  <Button
                                    onClick={() => updateSuggestionStatus(suggestion.id, 'Rejected')}
                                    variant="danger"
                                    className="text-sm"
                                  >
                                    <FaTimes className="inline mr-1" /> Reject
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>

                  {/* Approved Suggestions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                      <FaCheck className="text-green-500" />
                      Approved Suggestions ({approvedSuggestions.length})
                    </h2>
                    {approvedSuggestions.length === 0 ? (
                      <div className="text-[var(--foreground-muted)] text-sm p-6 glass rounded-lg text-center">
                        No approved suggestions
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {approvedSuggestions.map((suggestion, index) => (
                          <motion.div
                            key={suggestion.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                            className="p-4 glass rounded-lg border-2 border-[var(--success)] bg-[var(--success-light)]"
                          >
                            <p className="text-[var(--foreground)] font-medium mb-1">{suggestion.text}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">
                              Will be added to next poll instance
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </>
  );
}

