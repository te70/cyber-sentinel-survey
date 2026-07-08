interface TsLikertGridProps {
  items: readonly string[];
  prefix: string;
  values: Record<string, number | undefined>;
  onChange: (key: string, value: number) => void;
  scaleMin?: string;
  scaleMax?: string;
  reverse?: boolean[];
}

export function TsLikertGrid({
  items,
  prefix,
  values,
  onChange,
  scaleMin = "Strongly disagree",
  scaleMax = "Strongly agree",
}: TsLikertGridProps) {
  return (
    <div className="flex flex-col">
      {/* Scale label — sticky */}
      <div className="sticky top-[57px] z-20 border-b border-[var(--ts-border)] bg-white py-2 px-1">
        <p className="text-xs text-[var(--ts-text-secondary)]" style={{ fontFamily: "var(--ts-font-body)" }}>
          1 = {scaleMin}&nbsp;&nbsp;·&nbsp;&nbsp;2&nbsp;&nbsp;·&nbsp;&nbsp;3&nbsp;&nbsp;·&nbsp;&nbsp;4&nbsp;&nbsp;·&nbsp;&nbsp;5 = {scaleMax}
        </p>
      </div>

      <div className="divide-y divide-[var(--ts-border)]">
        {items.map((text, i) => {
          const key = `${prefix}_${i + 1}`;
          const selected = values[key];
          const isEven = i % 2 === 0;

          return (
            <div
              key={key}
              className={`px-1 py-4 ${isEven ? "bg-[var(--ts-surface-alt)]" : "bg-white"}`}
            >
              {/* Statement */}
              <p
                className="mb-3 text-base text-[var(--ts-text-body)] sm:mb-0 sm:flex sm:items-center sm:gap-4"
                style={{ fontFamily: "var(--ts-font-body)" }}
              >
                <span className="sm:w-[60%]">{text}</span>

                {/* Desktop inline buttons */}
                <span className="hidden sm:flex sm:w-[40%] sm:justify-end sm:gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <LikertBtn
                      key={n}
                      n={n}
                      selected={selected === n}
                      onClick={() => onChange(key, n)}
                      scaleMin={scaleMin}
                      scaleMax={scaleMax}
                    />
                  ))}
                </span>
              </p>

              {/* Mobile buttons below statement */}
              <div className="flex justify-between gap-2 sm:hidden">
                {[1, 2, 3, 4, 5].map((n) => (
                  <LikertBtn
                    key={n}
                    n={n}
                    selected={selected === n}
                    onClick={() => onChange(key, n)}
                    scaleMin={scaleMin}
                    scaleMax={scaleMax}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LikertBtn({
  n,
  selected,
  onClick,
  scaleMin,
  scaleMax,
}: {
  n: number;
  selected: boolean;
  onClick: () => void;
  scaleMin: string;
  scaleMax: string;
}) {
  const label =
    n === 1 ? `1 — ${scaleMin}` :
    n === 5 ? `5 — ${scaleMax}` :
    `${n}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      className={[
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ts-teal)]",
        selected
          ? "bg-[var(--ts-teal)] text-white"
          : "border border-[var(--ts-border-strong)] bg-white text-[var(--ts-text-secondary)] hover:border-[var(--ts-teal)] hover:text-[var(--ts-teal)]",
      ].join(" ")}
    >
      {n}
    </button>
  );
}
