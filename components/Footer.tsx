import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy text-white/70 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-10 grid sm:grid-cols-3 gap-8 text-sm">
        <div>
          <p className="text-white font-bold text-lg mb-2">
            FAB<span className="text-gold">HOUSE</span>
          </p>
          <p>Trusted property listings for Nigeria and the diaspora.</p>
        </div>

        <div>
          <p className="text-white font-semibold mb-2">Explore</p>
          <div className="flex flex-col gap-1.5">
            <Link href="/listings?purpose=sale" className="hover:text-gold transition">For Sale</Link>
            <Link href="/listings?purpose=rent" className="hover:text-gold transition">To Rent</Link>
            <Link href="/pricing" className="hover:text-gold transition">Pricing</Link>
          </div>
        </div>

        <div>
          <p className="text-white font-semibold mb-2">Legal</p>
          <div className="flex flex-col gap-1.5">
            <Link href="/privacy" className="hover:text-gold transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gold transition">Terms of Service</Link>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-white/50">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            Your data is protected under NDPR
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Fabhouse. All rights reserved.
      </div>
    </footer>
  );
}
