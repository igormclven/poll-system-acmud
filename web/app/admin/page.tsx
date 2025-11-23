'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaLightbulb, FaChartBar, FaCheck, FaKey, FaRedo } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { Input, TextArea } from '../components/Input';

interface Poll {
  id: string;
  title: string;
  description: string;
  isRecurring: boolean;
  allowSuggestions: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const response = await fetch('/api/admin/polls');
      const data = await response.json();
      setPolls(data.polls || []);
    } catch (error) {
      console.error('Error loading polls:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen">
        {/* Header */}
        <motion.header
          className="sticky top-0 z-50 glass-heavy border-b border-[var(--glass-border)]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-[var(--foreground)]">
                  Dashboard
                </h1>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  Manage your polls and view results
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </motion.header>

        <div className="container mx-auto px-4 py-8">
          {/* Action Buttons */}
          <motion.div
            className="mb-8 flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Button
              variant="primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? <><FaTimes className="inline mr-2" />Cancel</> : '+ Create New Poll'}
            </Button>
            <Link href="/admin/suggestions">
              <Button variant="secondary">
                <FaLightbulb className="inline mr-2" /> Manage Suggestions
              </Button>
            </Link>
          </motion.div>

          {/* Create Poll Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GlassCard variant="elevated">
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
                    Create New Poll
                  </h2>
                  <CreatePollForm onSuccess={() => { setShowCreateForm(false); loadPolls(); }} />
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Polls List */}
          {loading ? (
            <div className="text-center py-12">
              <motion.div
                className="inline-block w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="mt-4 text-[var(--foreground-secondary)]">Loading polls...</p>
            </div>
          ) : polls.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <GlassCard variant="elevated" className="text-center py-12">
                <FaChartBar className="text-6xl mb-4 mx-auto text-[var(--foreground-secondary)]" />
                <p className="text-xl text-[var(--foreground-secondary)]">
                  No polls yet. Create your first poll!
                </p>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              {polls.map((poll, index) => (
                <motion.div
                  key={poll.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <PollCard poll={poll} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

function CreatePollForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM'>('WEEKLY');
  const [durationDays, setDurationDays] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allowSuggestions, setAllowSuggestions] = useState(false);
  const [allowMultipleChoice, setAllowMultipleChoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRecurrenceTypeChange = (type: typeof recurrenceType) => {
    setRecurrenceType(type);
    if (type === 'WEEKLY') setDurationDays(7);
    else if (type === 'BIWEEKLY') setDurationDays(14);
    else if (type === 'MONTHLY') setDurationDays(30);
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        title,
        description,
        options: options.filter(o => o.trim()).map(text => ({ id: crypto.randomUUID(), text })),
        isRecurring,
        recurrenceType,
        durationDays,
        allowSuggestions,
        allowMultipleChoice,
      };

      if (startDate) {
        payload.startDate = new Date(startDate).toISOString();
      }
      if (endDate && isRecurring) {
        payload.endDate = new Date(endDate).toISOString();
      }

      const response = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create poll');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Enter poll title"
      />

      <TextArea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Enter poll description (optional)"
      />

      <div>
        <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-3">
          Options
        </label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <motion.div
              key={index}
              className="flex gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 px-4 py-3 rounded-lg glass border-2 border-transparent focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] transition-base"
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => removeOption(index)}
                >
                  <FaTimes />
                </Button>
              )}
            </motion.div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="mt-3 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors"
        >
          + Add option
        </button>
      </div>

      {/* Poll Configuration */}
      <div className="glass rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Poll Configuration</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-[var(--glass-border)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
              />
              <span className="text-sm text-[var(--foreground)] font-medium">Recurring Poll</span>
            </label>

            {isRecurring && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <select
                  value={recurrenceType}
                  onChange={(e) => handleRecurrenceTypeChange(e.target.value as typeof recurrenceType)}
                  className="w-full px-4 py-3 rounded-lg glass border-2 border-transparent focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--foreground)] transition-base"
                >
                  <option value="WEEKLY">Weekly (7 days)</option>
                  <option value="BIWEEKLY">Biweekly (14 days)</option>
                  <option value="MONTHLY">Monthly (30 days)</option>
                  <option value="CUSTOM">Custom duration</option>
                </select>
              </motion.div>
            )}
          </div>

          <Input
            label="Duration (days)"
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            min="1"
            max="365"
          />
        </div>
      </div>

      {/* Schedule */}
      <div className="glass rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Schedule (Optional)</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg glass border-2 border-transparent focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--foreground)] transition-base"
            />
          </div>

          {isRecurring && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                End Date (Recurring Only)
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg glass border-2 border-transparent focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--foreground)] transition-base"
              />
            </div>
          )}
        </div>
      </div>

      {/* Other Options */}
      <div className="glass rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Voting Options</h3>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allowMultipleChoice}
            onChange={(e) => setAllowMultipleChoice(e.target.checked)}
            className="w-5 h-5 rounded border-2 border-[var(--glass-border)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
          />
          <span className="text-sm text-[var(--foreground)] font-medium">Allow multiple choice selection</span>
        </label>
        {allowMultipleChoice && (
          <p className="text-xs text-[var(--foreground-secondary)] ml-7">
            Voters will be able to select multiple options using checkboxes
          </p>
        )}
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allowSuggestions}
            onChange={(e) => setAllowSuggestions(e.target.checked)}
            className="w-5 h-5 rounded border-2 border-[var(--glass-border)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
          />
          <span className="text-sm text-[var(--foreground)] font-medium">Allow user suggestions</span>
        </label>
        {allowSuggestions && (
          <p className="text-xs text-[var(--foreground-secondary)] ml-7">
            Users can submit new option suggestions for future polls
          </p>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 rounded-lg bg-[var(--error-light)] border border-[var(--error)] text-[var(--error)]"
        >
          {error}
        </motion.div>
      )}

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        className="w-full py-4 text-lg"
      >
        Create Poll
      </Button>
    </form>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  return (
    <GlassCard variant="interactive">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-[var(--foreground)] line-clamp-2">
          {poll.title}
        </h3>
        {poll.isRecurring && (
          <motion.span
            className="text-xs bg-[var(--accent-primary)] text-white px-3 py-1 rounded-full font-medium flex items-center gap-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <FaRedo className="text-xs" /> Recurring
          </motion.span>
        )}
      </div>

      {poll.description && (
        <p className="text-sm text-[var(--foreground-secondary)] mb-4 line-clamp-2">
          {poll.description}
        </p>
      )}

      <div className="flex gap-2 text-xs text-[var(--foreground-muted)] mb-4">
        {poll.allowSuggestions && (
          <span className="flex items-center gap-1">
            <FaCheck className="text-green-500" /> Suggestions
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Link href={`/admin/polls/${poll.id}`} className="flex-1">
          <Button variant="primary" className="w-full">
            Manage
          </Button>
        </Link>
        <Link href={`/admin/polls/${poll.id}/keys`} className="flex-1">
          <Button variant="secondary" className="w-full">
            <FaKey className="inline mr-2" /> Keys
          </Button>
        </Link>
      </div>

      <div className="mt-3 text-xs text-[var(--foreground-muted)]">
        Created: {new Date(poll.createdAt).toLocaleDateString()}
      </div>
    </GlassCard>
  );
}
