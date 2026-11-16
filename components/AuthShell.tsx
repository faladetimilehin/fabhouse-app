import Image from "next/image";

export default function AuthShell({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "login" | "register";
}) {
  const message = variant === "login"
    ? { eyebrow: "Welcome back", title: "Your next chapter is still out there.", detail: "Pick up where you left off and find a place that feels like yours." }
    : { eyebrow: "A good place to begin", title: "Every move starts with a place.", detail: "Find a home, a short stay, or the people who can help you get there." };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      <div className="grid overflow-hidden rounded-[28px] border border-[#e7e0d5] bg-[#fffdf8] shadow-[0_24px_80px_-38px_rgba(32,52,47,.3)] dark:border-[#34445e] dark:bg-[#101a2b] lg:min-h-[700px] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative min-h-[220px] overflow-hidden sm:min-h-[280px] lg:min-h-full">
          <Image
            src="/images/homes/modern-villa.jpg"
            alt="A welcoming modern home surrounded by trees"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12221d]/85 via-[#12221d]/15 to-[#12221d]/10" />
          <div className="absolute left-6 top-6 sm:left-8 sm:top-8">
            <span className="inline-flex rounded-full border border-white/35 bg-black/15 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
              Fabhouse
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">{message.eyebrow}</p>
            <h2 className="mt-3 max-w-md font-serif text-3xl leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">{message.title}</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/80 sm:text-base">{message.detail}</p>
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </section>
  );
}
