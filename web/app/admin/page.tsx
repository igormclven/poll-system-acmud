'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your polls and view results</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            {showCreateForm ? 'Cancel' : '+ Create New Poll'}
          </button>
          <Link
            href="/admin/suggestions"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Manage Suggestions
          </Link>
        </div>

        {/* Create Poll Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Create New Poll</h2>
            <CreatePollForm onSuccess={() => { setShowCreateForm(false); loadPolls(); }} />
          </div>
        )}

        {/* Polls List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading polls...</div>
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">No polls yet. Create your first poll!</div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}
      </div>
    </div>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update duration when recurrence type changes
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
      };

      // Add optional fields if provided
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          + Add option
        </button>
      </div>

      {/* Poll Type and Duration */}
      <div className="border-t pt-4">
        <h3 className="text-md font-semibold text-gray-800 mb-3">Poll Configuration</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="mr-2 w-4 h-4"
              />
              <span className="text-sm text-gray-700 font-medium">Recurring Poll</span>
            </label>

            {isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurrence Type
                </label>
                <select
                  value={recurrenceType}
                  onChange={(e) => handleRecurrenceTypeChange(e.target.value as typeof recurrenceType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="WEEKLY">Weekly (7 days)</option>
                  <option value="BIWEEKLY">Biweekly (14 days)</option>
                  <option value="MONTHLY">Monthly (30 days)</option>
                  <option value="CUSTOM">Custom duration</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (days)
            </label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              min="1"
              max="365"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              How many days the poll will be active
            </p>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="border-t pt-4">
        <h3 className="text-md font-semibold text-gray-800 mb-3">Schedule (Optional)</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to start immediately
            </p>
          </div>

          {isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Recurring Only)
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                When to stop creating new instances
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Other Options */}
      <div className="border-t pt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={allowSuggestions}
            onChange={(e) => setAllowSuggestions(e.target.checked)}
            className="mr-2 w-4 h-4"
          />
          <span className="text-sm text-gray-700">Allow user suggestions</span>
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium"
      >
        {loading ? 'Creating...' : 'Create Poll'}
      </button>
    </form>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-gray-900">{poll.title}</h3>
        {poll.isRecurring && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Recurring</span>
        )}
      </div>

      {poll.description && (
        <p className="text-sm text-gray-600 mb-4">{poll.description}</p>
      )}

      <div className="flex gap-2 text-xs text-gray-500 mb-4">
        {poll.allowSuggestions && <span>✓ Suggestions enabled</span>}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/admin/polls/${poll.id}`}
          className="flex-1 text-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium"
        >
          Manage
        </Link>
        <Link
          href={`/admin/polls/${poll.id}/keys`}
          className="flex-1 text-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
        >
          Access Keys
        </Link>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Created: {new Date(poll.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

