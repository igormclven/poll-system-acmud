'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn('cognito', { callbackUrl: '/admin' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Sign in to manage polls and view results</p>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign in with Cognito'}
        </button>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-indigo-600 hover:text-indigo-800">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

