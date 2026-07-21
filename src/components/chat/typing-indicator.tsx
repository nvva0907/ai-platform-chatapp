export function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1">
      <span
        className="size-1.5 rounded-full bg-zinc-400"
        style={{ animation: "bounceDot 1.1s ease-in-out 0s infinite" }}
      />
      <span
        className="size-1.5 rounded-full bg-zinc-400"
        style={{ animation: "bounceDot 1.1s ease-in-out 0.15s infinite" }}
      />
      <span
        className="size-1.5 rounded-full bg-zinc-400"
        style={{ animation: "bounceDot 1.1s ease-in-out 0.3s infinite" }}
      />
    </div>
  );
}
