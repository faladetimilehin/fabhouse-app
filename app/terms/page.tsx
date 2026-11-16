export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-navy/80">
      <h1 className="text-3xl font-bold text-navy mb-2">Terms of Service</h1>
      <p className="text-sm text-navy/50 mb-8">Last updated: [insert date]</p>

      <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800 mb-8">
        <strong>Before publishing this live:</strong> this draft reflects how Fabhouse actually works today, but it
        hasn't been reviewed by a lawyer. Have one check it — especially the liability, dispute resolution, and
        governing law sections — before relying on it as your real terms.
      </div>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">1. What Fabhouse is</h2>
      <p>
        Fabhouse is a listing platform that connects property buyers, renters, agents, and developers in Nigeria
        and the diaspora. We provide the platform for listing and discovering property — we are not a party to
        any sale, tenancy, or transaction between users, and we do not verify legal title, survey accuracy, or the
        truthfulness of listing details beyond our admin review process.
      </p>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">2. Accounts</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>You must provide accurate information when registering</li>
        <li>You're responsible for keeping your password secure and for activity under your account</li>
        <li>You must be able to legally enter into agreements to use Fabhouse (typically 18+)</li>
        <li>We may suspend accounts that violate these terms, post fraudulent listings, or abuse the platform</li>
      </ul>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">3. Listings</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Agents and developers must have the right to list any property they post</li>
        <li>Listings are reviewed before going live, but approval doesn't guarantee accuracy or legitimacy</li>
        <li>We may reject or remove listings that are fraudulent, misleading, duplicated, or violate these terms</li>
        <li>You're responsible for keeping your listing's status (active/sold/rented/withdrawn) up to date</li>
      </ul>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">4. Fees</h2>
      <p>
        Fabhouse is free to use during our launch period. If paid plans are introduced later, pricing will be
        shown clearly before you're charged, and existing free usage won't be retroactively billed.
      </p>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">5. Conduct</h2>
      <p>You agree not to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Post false, fraudulent, or misleading listings</li>
        <li>Use the platform to harass, scam, or mislead other users</li>
        <li>Attempt to access accounts or data that aren't yours</li>
        <li>Use automated tools to scrape or abuse the platform</li>
      </ul>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">6. Disclaimer & liability</h2>
      <p>
        Fabhouse is provided "as is." We do our best to keep listings accurate and agents verified, but we can't
        guarantee the accuracy of listings, the legitimacy of any user, or the outcome of any transaction. Property
        transactions carry inherent risk — always conduct independent due diligence (legal title checks, physical
        inspection where possible, and professional advice) before making a purchase or rental decision.
      </p>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">7. Changes</h2>
      <p>
        We may update these terms as the platform evolves. Material changes will be communicated by email or a
        notice on the site.
      </p>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">8. Contact</h2>
      <p>
        Questions about these terms: <a href="mailto:hello@fabhouse.ng" className="text-gold-dark font-semibold hover:underline">hello@fabhouse.ng</a>.
      </p>

      <p className="mt-8 text-sm text-navy/50">
        See also our <a href="/privacy" className="text-gold-dark hover:underline">Privacy Policy</a>.
      </p>
    </div>
  );
}
