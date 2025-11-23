'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Generate Access Keys</h1>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Keys
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min="1"
                max="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Uses per Key
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry (Days)
              </label>
              <input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={generateKeys}
            disabled={loading}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium mb-6"
          >
            {loading ? 'Generating...' : 'Generate Keys'}
          </button>

          {message && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              {message}
            </div>
          )}

          {keys.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Generated Keys</h2>
                <button
                  onClick={exportKeys}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Export CSV
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {keys.map((key) => (
                  <div
                    key={key.keyId}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 font-mono text-sm text-gray-700">
                      {key.keyId}
                    </div>
                    <button
                      onClick={() => copyToClipboard(key.keyId)}
                      className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-sm"
                    >
                      Copy URL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

