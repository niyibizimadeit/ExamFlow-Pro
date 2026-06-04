import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 mb-6">
          <span className="text-4xl font-bold text-slate-300">404</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Page Not Found</h1>
        <p className="text-slate-500 text-sm mb-8">The page you are looking for does not exist or has been moved.</p>
        <Link
          href="/login"
          className="inline-flex px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
