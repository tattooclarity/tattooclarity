"use client";

export default function MysterySection() {
  return (
    <section className="w-full py-12 px-6">
      <div className="max-w-5xl mx-auto bg-black text-white rounded-2xl px-8 py-12 shadow-lg">

        <div className="grid md:grid-cols-2 gap-10 items-center">

          {/* LEFT */}
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-4">
              Feeling Bold? Try a Mystery Character.
            </h2>

            <p className="text-gray-300 mb-6 text-base">
              Perfect if you can’t decide. Let fate choose a powerful character for you.
            </p>

            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Curated symbolic character</li>
              <li>• 300 DPI stencil-ready file</li>
              <li>• Transparent background PNG</li>
              <li>• Meaning explanation included</li>
            </ul>
          </div>

          {/* RIGHT */}
          <div className="text-center md:text-right">
            <div className="text-4xl font-bold mb-4">
              US$19
            </div>

            <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-8 py-3 rounded-lg transition">
              Unlock My Character
            </button>

            <p className="text-xs text-gray-400 mt-4">
              Instant download after purchase.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}