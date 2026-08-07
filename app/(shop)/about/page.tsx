export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 md:py-24">
      <p className="uppercase text-xs tracking-[0.3em] text-[#7C1F30] mb-3">Our story</p>
      <h1 className="font-serif text-4xl text-[#2A1508] mb-6">About Nityavastra</h1>
      <div className="space-y-4 text-[#57534E] leading-relaxed text-lg">
        <p>
          Nityavastra brings sacred weaves and everyday grace — handloom sarees, daily wear,
          and home essentials from India&apos;s finest artisans.
        </p>
        <p>
          Based in Bhubaneswar, Odisha, we curate pieces that honour tradition while fitting
          modern life. Every textile is chosen for craft, comfort, and lasting beauty.
        </p>
      </div>
    </div>
  );
}
