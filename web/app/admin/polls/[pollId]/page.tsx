'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

      setMessage(`✅ Instance ${operation}d successfully`);
      
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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading poll details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 text-sm">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            <h2 className="text-xl font-bold mb-2">Error Loading Poll</h2>
            <p>{error || 'Poll not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 text-sm">
            ← Back to Dashboard
          </Link>
          <div className="flex gap-2">
            <Link
              href={`/admin/polls/${pollId}/keys`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              📋 Access Keys
            </Link>
          </div>
        </div>

        {/* Poll Details Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{poll.title}</h1>
              {poll.description && (
                <p className="text-gray-600 mb-4">{poll.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {poll.isRecurring && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    🔄 {getRecurrenceLabel(poll.recurrenceType)}
                  </span>
                )}
                {poll.allowSuggestions && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    💡 Suggestions Enabled
                  </span>
                )}
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  ⏱️ {poll.durationDays || 'N/A'} days duration
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
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
          <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-600 text-sm font-medium mb-1">Status</div>
              <div className="text-2xl font-bold text-green-700">
                {activeInstance ? 'Active' : 'No Active Instance'}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium mb-1">Total Votes</div>
              <div className="text-2xl font-bold text-blue-700">
                {results?.totalVotes || 0}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-600 text-sm font-medium mb-1">Poll ID</div>
              <div className="text-sm font-mono text-purple-700 truncate" title={pollId}>
                {pollId.substring(0, 16)}...
              </div>
            </div>
          </div>
        </div>

        {/* Active Instance */}
        {activeInstance && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🟢 Active Instance</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Instance ID</div>
                  <div className="font-mono text-sm text-gray-900">{activeInstance.instanceId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-semibold text-green-700">{activeInstance.status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Start Date</div>
                  <div className="text-sm text-gray-900">{formatDate(activeInstance.startDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">End Date</div>
                  <div className="text-sm text-gray-900">{formatDate(activeInstance.endDate)}</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Options:</div>
                <div className="grid md:grid-cols-2 gap-2">
                  {activeInstance.options.map((option, index) => (
                    <div key={option.id} className="flex items-center p-3 bg-white rounded border border-gray-200">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-900">{option.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📊 Results</h2>
            {activeInstance && (
              <button
                onClick={() => loadResults(selectedInstanceId)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                🔄 Refresh Results
              </button>
            )}
          </div>

          {loadingResults ? (
            <div className="text-center py-8 text-gray-500">Loading results...</div>
          ) : results && results.totalVotes > 0 && Array.isArray(results.results) ? (
            <div className="space-y-4">
              <div className="mb-4 text-sm text-gray-600">
                Total Votes: <span className="font-bold text-gray-900">{results.totalVotes}</span>
              </div>
              
              {results.results.map((result, index) => (
                <div key={result.optionId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{result.optionText}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">{result.votes}</div>
                      <div className="text-sm text-gray-500">{result.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📭</div>
              <div>No votes yet for this poll instance</div>
            </div>
          )}
        </div>

        {/* All Instances Management */}
        {allInstances.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 All Instances</h2>
            
            <div className="space-y-4">
              {allInstances.map((instance) => (
                <div
                  key={instance.instanceId}
                  className={`border rounded-lg p-4 ${
                    instance.status === 'Active' 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          instance.status === 'Active'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}>
                          {instance.status}
                        </span>
                        <span className="font-mono text-sm text-gray-600">
                          {instance.instanceId}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-600">Start:</span>{' '}
                          <span className="font-medium">{formatDate(instance.startDate)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">End:</span>{' '}
                          <span className="font-medium">{formatDate(instance.endDate)}</span>
                        </div>
                        {instance.closedAt && (
                          <div className="md:col-span-2">
                            <span className="text-gray-600">Closed:</span>{' '}
                            <span className="font-medium text-red-600">{formatDate(instance.closedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedInstanceId(instance.instanceId);
                          loadResults(instance.instanceId);
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        📊 Results
                      </button>
                      
                      {instance.status === 'Active' ? (
                        <button
                          onClick={() => manageInstance('close', instance.instanceId)}
                          disabled={loadingAction}
                          className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm disabled:bg-gray-400"
                        >
                          ⏸️ Close
                        </button>
                      ) : (
                        <button
                          onClick={() => manageInstance('reopen', instance.instanceId)}
                          disabled={loadingAction}
                          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:bg-gray-400"
                        >
                          ▶️ Reopen
                        </button>
                      )}
                      
                      <button
                        onClick={() => manageInstance('delete', instance.instanceId)}
                        disabled={loadingAction}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:bg-gray-400"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {message}
          </div>
        )}

        {error && !loading && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <Link
            href={`/vote?pollId=${pollId}`}
            target="_blank"
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
          >
            👁️ Preview Voting Page
          </Link>
          <Link
            href={`/admin/polls/${pollId}/keys`}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium"
          >
            🔑 Manage Access Keys
          </Link>
        </div>
      </div>
    </div>
  );
}

