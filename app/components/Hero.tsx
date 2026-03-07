"use client";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="relative w-full min-h-[320px] md:min-h-[440px]">
        <img
          src="/hero/hero-clean.jpg"
          alt="Tattoo Clarity preview demo"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.82) 42%, rgba(255,255,255,0.28) 72%, rgba(255,255,255,0.06) 100%)",
          }}
        />

        <div className="relative z-10 flex min-h-[320px] items-center px-6 py-10 md:min-h-[440px] md:px-14">
          <div className="max-w-3xl text-black">
            <div className="mb-4 inline-flex rounded-full border border-neutral-300 bg-white/80 px-4 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-700 backdrop-blur">
              Tattoo Clarity Studio
            </div>

            <h1 className="text-4xl font-semibold leading-[0.95] tracking-tight md:text-6xl">
              Chinese Character
              <br />
              Tattoo Generator
            </h1>

            <div className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              <span className="font-serif italic text-[#b4532a]">
                Preview It Properly.
              </span>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-700 md:text-base">
              Culturally reviewed, balanced, studio-ready previews with pinyin
              and meaning — so you can check the look before you ink forever.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}