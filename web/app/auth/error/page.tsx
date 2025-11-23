export default function AuthError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          There was a problem signing you in. Please try again.
        </p>
        <a
          href="/auth/signin"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </a>
      </div>
    </div>
  );
}

