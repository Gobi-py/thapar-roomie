import "./globals.css";
import ThemeToggle from "./ThemeToggle";

export const metadata = {
  title: "Thapar Roomie Finder",
  description: "Find your ideal hostel roommate at Thapar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set dark class before paint so there's no flash of the wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors">
        <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center shadow-sm">
          <a
            href="/matches"
            className="font-bold text-lg text-indigo-600 dark:text-indigo-400"
          >
            🏠 Thapar Roomie
          </a>
          <div className="flex gap-4 text-sm items-center">
            <a
              href="/profile"
              className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              My Profile
            </a>
            <a
              href="/matches"
              className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Matches
            </a>
            <a
              href="/login"
              className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Login
            </a>
            <ThemeToggle />
          </div>
        </nav>
        <main className="max-w-3xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
