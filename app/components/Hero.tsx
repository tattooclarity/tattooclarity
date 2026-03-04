"use client";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl border bg-white shadow-sm">
      {/* ✅ 固定高度容器：就係控制「變矮」嘅地方 */}
      <div className="relative w-full min-h-[220px] md:min-h-[280px]">
        {/* ✅ 圖片填滿容器，但唔拉伸（cover） */}
        <img
          src="/hero/hero-clean.jpg"
          alt="Tattoo Preview Demo"
          className="w-full h-full object-cover"
        />

        {/* 文字遮罩 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.75), rgba(255,255,255,0.35) 55%, rgba(255,255,255,0) 80%)",
          }}
        />

        {/* 標語（靠右） */}
        <div className="absolute inset-0 flex items-start md:items-center justify-end px-8 md:px-20 pt-8 md:pt-0">
          <div className="text-left text-black max-w-2xl">
            <div className="text-4xl md:text-6xl font-semibold tracking-tight">
              Before You Ink It.
            </div>

            <div className="text-4xl md:text-6xl font-semibold tracking-tight mt-2">
              <span className="text-[#b4532a] italic font-serif">
                See It Beautifully.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}