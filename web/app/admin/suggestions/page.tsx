'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Suggestions</h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Poll
            </label>
            <select
              value={selectedPoll}
              onChange={(e) => setSelectedPoll(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {polls.map((poll) => (
                <option key={poll.id} value={poll.id}>
                  {poll.title}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading suggestions...</div>
          ) : (
            <div className="space-y-8">
              {/* Pending Suggestions */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Pending Suggestions ({pendingSuggestions.length})
                </h2>
                {pendingSuggestions.length === 0 ? (
                  <div className="text-gray-500 text-sm">No pending suggestions</div>
                ) : (
                  <div className="space-y-3">
                    {pendingSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">{suggestion.text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Submitted: {new Date(suggestion.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => updateSuggestionStatus(suggestion.id, 'Approved')}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateSuggestionStatus(suggestion.id, 'Rejected')}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved Suggestions */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Approved Suggestions ({approvedSuggestions.length})
                </h2>
                {approvedSuggestions.length === 0 ? (
                  <div className="text-gray-500 text-sm">No approved suggestions</div>
                ) : (
                  <div className="space-y-2">
                    {approvedSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-3 border border-green-200 bg-green-50 rounded-lg"
                      >
                        <p className="text-gray-900">{suggestion.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Will be added to next poll instance
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

