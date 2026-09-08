"use client";

// Simple CSS overlay preview: renders the chosen name/number centered on
// top of the jersey product photo, mimicking a printed nameset. This is
// a lightweight visual aid, not a pixel-accurate mockup — swap in a
// canvas-based renderer later if you want print-ready proofs.
export function JerseyPreview({ name, number }: { name: string; number: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center" style={{ paddingTop: "8%" }}>
      {name && (
        <span
          className="font-display text-3xl tracking-widest text-white md:text-4xl"
          style={{ WebkitTextStroke: "1px rgba(0,0,0,0.4)", textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}
        >
          {name}
        </span>
      )}
      {number && (
        <span
          className="font-display text-6xl tracking-wider text-white md:text-7xl"
          style={{ WebkitTextStroke: "1.5px rgba(0,0,0,0.4)", textShadow: "0 3px 10px rgba(0,0,0,0.5)" }}
        >
          {number}
        </span>
      )}
    </div>
  );
}
