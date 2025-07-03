export default function PublicLanding() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Research Assistant</h1>
        <p className="mb-4">
          Discover how you can manage and analyze your research interviews with ease.
        </p>
        <a
          href="/auth/signup"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Get Started
        </a>
        <p className="mt-4 text-gray-500 text-sm">
          Already have an account? <a href="/auth/signin" className="text-blue-600 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
} 