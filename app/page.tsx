import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, MapPin, Search, ShieldCheck } from "lucide-react";

const homeInspiration = [
  { image: "/images/homes/modern-villa.jpg", alt: "Contemporary home framed by a mature shade tree", name: "Room to make your own", type: "Houses", href: "/listings?type=house" },
  { image: "/images/homes/city-home.jpg", alt: "Bright modern home with a landscaped garden", name: "A little closer to everything", type: "Flats & apartments", href: "/listings?type=flat" },
  { image: "/images/homes/garden-home.jpg", alt: "Modern home with warm lights and a private entrance", name: "Somewhere to slow down", type: "Shortlets", href: "/listings?purpose=shortlet" },
];

export default function HomePage() {
  return (
    <div className="bg-[#f7f4ed] text-[#20342f] dark:bg-[#0b1322] dark:text-[#e6edf7]">
      <section className="relative overflow-hidden px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div className="relative z-10">
            <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#9a5b3d] dark:text-[#e7ae83]"><span className="h-px w-8 bg-current" />A more human way to find home</p>
            <h1 className="max-w-2xl font-serif text-[3.25rem] leading-[0.99] tracking-[-0.045em] sm:text-6xl lg:text-[5.2rem]">
              Home is a feeling. <span className="italic text-[#9a5b3d] dark:text-[#e7ae83]">Let’s find yours.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#58635b] dark:text-[#b6c3d6] sm:text-lg sm:leading-8">
              Find a place in Nigeria that feels right, with clear details and a direct line to the people who know it best.
            </p>

            <form action="/listings" className="mt-9 flex max-w-xl flex-col gap-2 rounded-2xl border border-[#e4ded1] bg-white p-2 shadow-[0_18px_55px_-30px_rgba(32,52,47,.38)] dark:border-[#34445e] dark:bg-[#121e32] sm:flex-row sm:items-center">
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
                <MapPin className="h-5 w-5 shrink-0 text-[#9a5b3d] dark:text-[#e7ae83]" aria-hidden="true" />
                <span className="sr-only">Search city, area, or postcode</span>
                <input name="q" placeholder="Try Lekki, Abuja, or a postcode" className="w-full bg-transparent text-sm text-[#20342f] outline-none placeholder:text-[#92978f] dark:text-[#e6edf7] dark:placeholder:text-[#94a3b8]" />
              </label>
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9a5b3d] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#7d4730] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a5b3d]"><Search size={16} aria-hidden="true" />Find a place</button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#58635b] dark:text-[#b6c3d6]">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={17} className="text-[#63816a] dark:text-[#9ac6a1]" />Verified agents</span>
              <span className="hidden h-1 w-1 rounded-full bg-[#c4bdae] sm:block" />
              <span>Buy, rent, or find a shortlet</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:ml-auto">
            <div className="absolute -right-7 -top-8 h-40 w-40 rounded-full border border-[#d6c7ad] dark:border-[#34445e]" />
            <div className="absolute -bottom-6 -left-6 h-36 w-36 rounded-full bg-[#e8d7bd] dark:bg-[#1a2940]" />
            <div className="relative h-[390px] overflow-hidden rounded-[46%_46%_20px_20px] sm:h-[500px] lg:h-[570px]">
              <Image src="/images/homes/modern-villa.jpg" alt="A warm, modern home surrounded by mature trees" fill priority sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#152620]/65 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 text-white sm:bottom-9 sm:left-9 sm:right-9">
                <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Find your own kind of home</p><p className="mt-2 font-serif text-2xl sm:text-3xl">Somewhere that feels like you.</p></div>
                <span className="mb-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/50 sm:flex"><ArrowDownRight size={20} /></span>
              </div>
            </div>
            <div className="absolute -left-2 top-10 max-w-[185px] rounded-2xl bg-[#fffdf8] p-4 shadow-xl dark:bg-[#121e32] sm:-left-10 sm:top-16 sm:p-5">
              <p className="font-serif text-3xl text-[#9a5b3d] dark:text-[#e7ae83]">FH</p>
              <p className="mt-1 text-xs leading-5 text-[#58635b] dark:text-[#b6c3d6]">Built for finding home across Nigeria — and from wherever you are.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e6e0d5] bg-[#fffdf8] px-5 py-5 dark:border-[#26354b] dark:bg-[#101a2b] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#58635b] dark:text-[#b6c3d6] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-[#20342f] dark:text-[#e6edf7]">The search should feel simpler.</p>
          <div className="flex flex-wrap gap-x-8 gap-y-2"><span><b className="mr-2 text-[#9a5b3d] dark:text-[#e7ae83]">01</b>Explore at your pace</span><span><b className="mr-2 text-[#9a5b3d] dark:text-[#e7ae83]">02</b>Ask the right person</span><span><b className="mr-2 text-[#9a5b3d] dark:text-[#e7ae83]">03</b>Choose with clarity</span></div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a5b3d] dark:text-[#e7ae83]">Start with a feeling</p><h2 className="mt-3 max-w-2xl font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">Different lives need different places.</h2></div>
            <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-[#9a5b3d] transition hover:gap-3 dark:text-[#e7ae83]">Explore all listings <ArrowRight size={17} /></Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {homeInspiration.map((home, index) => (
              <Link key={home.type} href={home.href} className="group relative isolate min-h-[360px] overflow-hidden rounded-[22px] bg-[#d7d2c8] sm:min-h-[440px]">
                <Image src={home.image} alt={home.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101a18]/80 via-[#101a18]/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7"><p className="text-xs font-medium uppercase tracking-[0.18em] text-white/75">0{index + 1} &nbsp; / &nbsp; {home.type}</p><div className="mt-3 flex items-end justify-between gap-4"><h3 className="max-w-[250px] font-serif text-2xl leading-tight sm:text-3xl">{home.name}</h3><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/60 transition group-hover:bg-white group-hover:text-[#20342f]"><ArrowRight size={17} /></span></div></div>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#7b8178] dark:text-[#94a3b8]">A little inspiration to get you started. Photos are illustrative; browse current listings for actual properties.</p>
        </div>
      </section>

      <section className="bg-[#eae3d7] px-5 py-14 dark:bg-[#121e32] sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a5b3d] dark:text-[#e7ae83]">For the people who know the place</p><h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">Have somewhere worth sharing?</h2><p className="mt-3 text-[#58635b] dark:text-[#b6c3d6]">Put your property in front of people looking for their next move.</p></div>
          <Link href="/register" className="inline-flex w-fit items-center gap-3 rounded-full bg-[#20342f] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#345249] dark:bg-[#9a5b3d] dark:hover:bg-[#7d4730]">List your property <ArrowRight size={17} /></Link>
        </div>
      </section>
    </div>
  );
}
