import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Poll System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create, manage, and participate in polls with ease
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Vote in a Poll</h2>
            <p className="text-gray-600 mb-6">
              Have a voting link? Use your unique access key to participate in polls.
            </p>
            <Link
              href="/vote"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Voting
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-600 mb-6">
              Create polls, manage access keys, and view results.
            </p>
            <Link
              href="/admin"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center text-gray-500">
          <p className="text-sm">
            Serverless Poll System • Built with Next.js, AWS Lambda, and DynamoDB
          </p>
        </div>
      </div>
    </div>
  );
}
