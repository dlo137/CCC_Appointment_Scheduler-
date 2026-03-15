import Link from "next/link";

const links = [
  { href: "/book", label: "Book" },
  { href: "/appointments", label: "My Appointments" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-gray-900 hover:text-brand-500 transition-colors"
        >
          Watson <span className="text-brand-500">Booking</span>
        </Link>

        <div className="flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}
