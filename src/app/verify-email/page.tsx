export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
        <p className="mb-4">
          We've sent a verification link to your email address. Please check your inbox and click the link to activate your account.
        </p>
        <p className="text-gray-500 text-sm">
          Once verified, you can log in with your credentials.
        </p>
      </div>
    </div>
  );
} 