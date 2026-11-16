"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { BILLING_ENABLED } from "@/config/features";

const BUY_LINKS = [
  { label: "Houses for Sale", href: "/listings?purpose=sale&type=house" },
  { label: "Flats & Apartments", href: "/listings?purpose=sale&type=flat" },
  { label: "Land for Sale", href: "/listings?purpose=sale&type=land" },
  { label: "Commercial Property", href: "/listings?purpose=sale&type=commercial" },
  { label: "All Properties for Sale", href: "/listings?purpose=sale" },
];

const RENT_LINKS = [
  { label: "Houses to Rent", href: "/listings?purpose=rent&type=house" },
  { label: "Flats & Apartments", href: "/listings?purpose=rent&type=flat" },
  { label: "Office Space", href: "/listings?purpose=rent&type=commercial" },
  { label: "Land Lease", href: "/listings?purpose=rent&type=land" },
  { label: "All Properties to Rent", href: "/listings?purpose=rent" },
];

const SHORTLET_LINKS = [
  { label: "Shortlets in Lagos", href: "/listings?purpose=shortlet&state=Lagos" },
  { label: "Shortlets in Abuja", href: "/listings?purpose=shortlet&state=Abuja" },
  { label: "Shortlets in Lekki", href: "/listings?purpose=shortlet&city=Lekki" },
  { label: "All Shortlets", href: "/listings?purpose=shortlet" },
];

function NavDropdown({ label, links }: { label: string; links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 hover:text-gold transition text-sm"
      >
        {label} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-navy/10 py-1 z-50">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-navy hover:bg-gold/10 hover:text-gold-dark transition"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50">
      {!BILLING_ENABLED && (
        <div className="bg-gold text-navy text-center text-sm font-semibold py-1.5 px-4">
          🎉 Free to list and browse during launch — no charges, no card required.
        </div>
      )}
      <nav className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-wide shrink-0">
          FAB<span className="text-gold">HOUSE</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <NavDropdown label="Buy" links={BUY_LINKS} />
          <NavDropdown label="Rent" links={RENT_LINKS} />
          <NavDropdown label="Shortlet" links={SHORTLET_LINKS} />
          <Link href="/listings" className="hover:text-gold transition">Browse All</Link>
          <Link href="/pricing" className="hover:text-gold transition">Pricing</Link>
          {session?.user && (
            <Link href="/saved" className="hover:text-gold transition">Saved</Link>
          )}
          {session?.user && ["agent", "developer", "admin"].includes((session.user as any).role) && (
            <Link href="/dashboard" className="hover:text-gold transition">Dashboard</Link>
          )}
          {(session?.user as any)?.role === "admin" && (
            <Link href="/admin" className="hover:text-gold transition">Admin</Link>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <Link href="/account" className="hidden sm:inline text-white/70 hover:text-gold transition">
                Hi, {session.user.name?.split(" ")[0]}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gold transition">Sign in</Link>
              <Link
                href="/register"
                className="bg-gold text-navy font-semibold px-3 py-1.5 rounded-md hover:bg-gold-light transition"
              >
                Get started
              </Link>
            </>
          )}
          {/* Mobile menu toggle */}
          <button
            className="md:hidden ml-1 p-1"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 bg-white mb-1" />
            <span className="block w-5 h-0.5 bg-white mb-1" />
            <span className="block w-5 h-0.5 bg-white" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy border-t border-white/10 px-6 py-4 flex flex-col gap-3 text-sm text-white">
          <p className="text-white/40 text-xs uppercase tracking-wider">Buy</p>
          {BUY_LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="hover:text-gold">{l.label}</Link>)}
          <p className="text-white/40 text-xs uppercase tracking-wider mt-2">Rent</p>
          {RENT_LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="hover:text-gold">{l.label}</Link>)}
          <p className="text-white/40 text-xs uppercase tracking-wider mt-2">Shortlet</p>
          {SHORTLET_LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="hover:text-gold">{l.label}</Link>)}
          <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
            <Link href="/listings" onClick={() => setMobileOpen(false)} className="hover:text-gold">Browse All</Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="hover:text-gold">Pricing</Link>
            {session?.user && <Link href="/saved" onClick={() => setMobileOpen(false)} className="hover:text-gold">Saved</Link>}
            {session?.user && ["agent", "developer", "admin"].includes((session.user as any).role) && (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="hover:text-gold">Dashboard</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
