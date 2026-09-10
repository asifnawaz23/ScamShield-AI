export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950" aria-hidden="true">
      <div className="absolute inset-0 bg-grid-faint bg-[length:44px_44px]" />
      <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[140px]" />
      <div className="absolute -bottom-48 right-0 h-[520px] w-[520px] rounded-full bg-violet/10 blur-[160px]" />
      <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[120px]" />
      <div className="absolute inset-0 bg-noise opacity-40" />
    </div>
  );
}