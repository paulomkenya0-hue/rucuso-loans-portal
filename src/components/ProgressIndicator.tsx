const STEPS = ["Form", "Review", "Declaration"];

export default function ProgressIndicator({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Submission progress">
      {STEPS.map((label, i) => {
        const stepNumber = i + 1;
        const isActive = stepNumber === step;
        const isDone = stepNumber < step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isDone
                    ? "bg-maroon-700 text-white"
                    : isActive
                    ? "border-2 border-maroon-700 text-maroon-700"
                    : "border-2 border-ink-200 text-ink-400"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {isDone ? "✓" : stepNumber}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isActive || isDone ? "text-ink-900" : "text-ink-400"
                }`}
              >
                {label}
              </span>
            </div>
            {stepNumber !== STEPS.length && (
              <div className={`h-0.5 flex-1 ${isDone ? "bg-maroon-700" : "bg-ink-200"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
