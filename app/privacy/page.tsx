export const dynamic = "force-static";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-navy/80">
      <h1 className="text-3xl font-bold text-navy mb-2">Privacy Policy</h1>
      <p className="text-sm text-navy/50 mb-8">Last updated: [insert date]</p>

      <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800 mb-8">
        <strong>Before publishing this live:</strong> this draft is written to reflect the Nigeria Data Protection
        Act 2023 (NDPA) and NDPR, and covers the data Fabhouse actually collects based on how the platform is
        built. It has not been reviewed by a lawyer. Have one check it — especially the sections on international
        transfers, retention periods, and NITDA/NDPC registration — before you rely on it as your real policy.
      </div>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">1. Who we are</h2>
      <p>
        Fabhouse ("we", "us") operates a property listing platform for Nigeria and the diaspora. For the purposes
        of the Nigeria Data Protection Act 2023, Fabhouse is the data controller for personal data collected
        through this website.
      </p>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">2. What we collect</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Account details: name, email, phone number, password (stored as a one-way hash, never in plain text)</li>
        <li>Role information (buyer, agent, developer)</li>
        <li>Listings you post: property details, photos, videos, location</li>
        <li>Messages sent through our inquiry form, including your name and contact details as a buyer</li>
        <li>Basic technical data: IP address, used only for rate-limiting abuse (e.g. spam signups) and security</li>
      </ul>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">3. Why we collect it (lawful basis)</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Consent</strong> — you agree to this policy when you register</li>
        <li><strong>Contract</strong> — to provide the service you've signed up for (listing or browsing property)</li>
        <li><strong>Legitimate interest</strong> — fraud prevention, rate-limiting, and keeping the platform trustworthy</li>
      </ul>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">4. How we protect your data</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Passwords are hashed with bcrypt and never stored or logged in plain text</li>
        <li>Data is stored with MongoDB Atlas, which encrypts data at rest and in transit</li>
        <li>Access to admin functions (viewing all users, approving listings) is restricted to verified admin accounts</li>
        <li>We rate-limit signups and messages to reduce spam and automated abuse</li>
      </ul>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">5. Who we share it with</h2>
      <p>
        We don't sell personal data. We use third-party processors to run the platform, who process data on our
        behalf under their own security standards: Cloudinary (photo/video hosting), Resend (transactional email),
        MongoDB Atlas (database hosting), and Paystack (payments, once billing is active). We share your contact
        details with an agent or buyer only when you choose to send or receive an inquiry.
      </p>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">6. Your rights under the NDPA</h2>
      <p>As a data subject, you have the right to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Access</strong> the personal data we hold about you</li>
        <li><strong>Correct</strong> inaccurate data (edit your profile or listings directly, or contact us)</li>
        <li><strong>Delete</strong> your account and associated data ("right to erasure")</li>
        <li><strong>Port</strong> your data to another service in a structured format</li>
        <li><strong>Object</strong> to certain processing, or withdraw consent</li>
      </ul>
      <p className="mt-2">
        You can exercise the access, deletion, and portability rights yourself, any time, from{" "}
        <a href="/account" className="text-gold-dark font-semibold hover:underline">your account settings</a>.
        For anything else, contact us at the email below.
      </p>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">7. How long we keep your data</h2>
      <p>
        We keep account and listing data for as long as your account is active. If you delete your account, we
        remove your personal data and listings within [insert timeframe — e.g. 30 days], except where we're
        required to retain limited records for legal or fraud-prevention purposes.
      </p>

      <h2 className="text-xl font-semibold text-navy mt-8 mb-2">8. Contact / complaints</h2>
      <p>
        Questions about this policy or your data: <a href="mailto:privacy@fabhouse.ng" className="text-gold-dark font-semibold hover:underline">privacy@fabhouse.ng</a>.
        You also have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC).
      </p>
    </div>
  );
}
