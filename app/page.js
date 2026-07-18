export default function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Find your ideal hostel roommate 🏠
      </h1>
      <p className="text-gray-600 mb-8">
        Built for Thapar students. Sign up with your Thapar email, fill your
        preferences, and get matched with compatible roommates.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="/signup"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
        >
          Get Started
        </a>
        <a
          href="/login"
          className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50"
        >
          Login
        </a>
      </div>
    </div>
  );
}
