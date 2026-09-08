import "./Screen01Splash.css";

const officialLogo = new URL(
  "../../../../../cir-website/public/cir-logo.jpg",
  import.meta.url,
).href;

export function Screen01Splash() {
  return (
    <main className="cir-splash" aria-label="CIR Consultation Service">
      <div className="cir-splash__glow" aria-hidden="true" />
      <svg className="cir-splash__ribbons" viewBox="0 0 390 430" preserveAspectRatio="none" aria-hidden="true">
        <path className="cir-splash__ribbon cir-splash__ribbon--one" d="M-30 326C65 257 128 280 198 304c75 26 121 20 222-45" />
        <path className="cir-splash__ribbon cir-splash__ribbon--two" d="M-36 370c95-63 158-40 236-14 69 23 125 10 215-50" />
        <path className="cir-splash__ribbon cir-splash__ribbon--three" d="M-30 413c88-55 152-32 224-11 77 22 133 2 211-50" />
        <path className="cir-splash__thread" d="M-24 350c92-61 154-43 232-17 65 22 117 15 194-30" />
      </svg>

      <section className="cir-splash__content">
        <img
          className="cir-splash__official-logo"
          src={officialLogo}
          alt="CIR Consultation Service"
        />
        <div className="cir-splash__copy">
          <p className="cir-splash__tagline">Analyse. Dispute. Improve.</p>
          <p className="cir-splash__supporting">Your credit journey starts here.</p>
        </div>
      </section>

      <div className="cir-splash__loading" role="status" aria-live="polite" aria-label="Loading CIR">
        <span className="cir-splash__loading-label">Preparing your journey</span>
        <span className="cir-splash__loading-track" aria-hidden="true"><span /></span>
      </div>
    </main>
  );
}
