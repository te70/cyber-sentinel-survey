// Reusable Likert grid — used by the legacy single-page survey route.
const LIKERT_AGREE = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];
const LIKERT_BARRIER = [
  { value: 1, label: "Not a barrier" },
  { value: 2, label: "Minor barrier" },
  { value: 3, label: "Moderate barrier" },
  { value: 4, label: "Major barrier" },
  { value: 5, label: "Critical barrier" },
];

interface Props {
  items: readonly string[];
  prefix: string; // e.g. "B1"
  values: Record<string, number | undefined>;
  onChange: (key: string, value: number) => void;
  scale?: "agree" | "barrier";
  reverse?: boolean[];
  error?: string;
}

export function LikertGrid({
  items,
  prefix,
  values,
  onChange,
  scale = "agree",
  reverse,
  error,
}: Props) {
  const scaleOptions = scale === "agree" ? LIKERT_AGREE : LIKERT_BARRIER;
  return (
    <div className="space-y-4">
      <div className="hidden grid-cols-[1fr_auto] gap-3 text-[11px] uppercase tracking-wider text-muted-foreground sm:grid">
        <span></span>
        <div className="grid grid-cols-5 gap-2">
          {scaleOptions.map((s) => (
            <span key={s.value} className="w-14 text-center" title={s.label}>
              {s.value}
            </span>
          ))}
        </div>
      </div>
      {items.map((text, i) => {
        const key = `${prefix}_${i + 1}`;
        const current = values[key];
        const isReverse = reverse?.[i];
        return (
          <div
            key={key}
            className="rounded-lg border bg-card p-4 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:p-3"
          >
            <div className="text-sm">
              <span className="mr-2 font-mono text-xs text-muted-foreground">{i + 1}.</span>
              {text}
              {isReverse && (
                <span className="mt-1 block text-[11px] font-medium text-destructive">
                  Note: this item is reverse-phrased — please read carefully.
                </span>
              )}
            </div>
            <fieldset className="mt-3 sm:mt-0">
              <legend className="sr-only">{text}</legend>
              <div className="flex gap-1 sm:grid sm:grid-cols-5 sm:gap-2">
                {scaleOptions.map((opt) => {
                  const active = current === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-md border px-2 py-2 text-[11px] transition sm:w-14 ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-secondary"
                      }`}
                    >
                      <input
                        type="radio"
                        name={key}
                        value={opt.value}
                        checked={active}
                        onChange={() => onChange(key, opt.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold">{opt.value}</span>
                      <span className="hidden text-[10px] sm:hidden">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground sm:hidden">
                <span>{scaleOptions[0].label}</span>
                <span>{scaleOptions[scaleOptions.length - 1].label}</span>
              </div>
            </fieldset>
          </div>
        );
      })}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
