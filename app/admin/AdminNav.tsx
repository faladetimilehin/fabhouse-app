"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/pending", label: "Pending Review" },
  { href: "/admin/listings", label: "All Listings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/audit-log", label: "Audit Log" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-navy/10 mb-8">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              active ? "border-gold text-navy" : "border-transparent text-navy/50 hover:text-navy"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
