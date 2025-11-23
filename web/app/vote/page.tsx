'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Vote in Poll</h1>

          {/* Load Poll Section */}
          {!poll && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pollId}
                  onChange={(e) => setPollId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Poll ID"
                />
                <button
                  onClick={loadPoll}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Load Poll'}
                </button>
              </div>
            </div>
          )}

          {/* Poll Display */}
          {poll && (
            <div>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{poll.poll.title}</h2>
                {poll.poll.description && (
                  <p className="text-gray-600">{poll.poll.description}</p>
                )}
              </div>

              {/* Access Key Input - Only show if not provided in URL */}
              {!keyIdFromUrl && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Key
                  </label>
                  <input
                    type="text"
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your access key"
                  />
                </div>
              )}

              {/* Voter Name (Optional) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>

              {/* Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select an option:
                </label>
                <div className="space-y-2">
                  {poll.activeInstance.options.map((option: any) => (
                    <label
                      key={option.id}
                      className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="option"
                        value={option.id}
                        checked={selectedOption === option.id}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-gray-900">{option.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={submitVote}
                disabled={loading || !selectedOption || !keyId}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? 'Submitting...' : 'Submit Vote'}
              </button>

              {/* Suggestions Section */}
              {poll.poll.allowSuggestions && (
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Suggest a New Option
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your suggestion"
                    />
                    <button
                      onClick={submitSuggestion}
                      disabled={loading || !suggestion}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    }>
      <VotePageContent />
    </Suspense>
  );
}

