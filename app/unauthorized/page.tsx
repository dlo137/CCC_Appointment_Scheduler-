import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900">403</h1>
      <p className="mt-3 text-lg text-gray-500">
        You don&apos;t have permission to view this page.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        Go home
      </Link>
    </div>
  );
}
