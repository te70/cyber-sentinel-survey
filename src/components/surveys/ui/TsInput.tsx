import { type InputHTMLAttributes, useId } from "react";

interface TsInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  helperText?: string;
  error?: string;
}

export function TsInput({ label, helperText, error, className = "", ...props }: TsInputProps) {
  const id = useId();
  const descId = useId();
  const hasDesc = !!(error ?? helperText);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[13px] font-medium text-[var(--ts-text-primary)] leading-none"
      >
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-describedby={hasDesc ? descId : undefined}
        aria-invalid={!!error}
        style={{ fontFamily: "var(--ts-font-body)" }}
        className={[
          "h-12 w-full rounded-lg px-4 text-sm text-[var(--ts-text-primary)]",
          "bg-white placeholder:text-[var(--ts-text-disabled)]",
          "transition-shadow outline-none",
          error
            ? "border-2 border-[var(--ts-error)]"
            : "border border-[var(--ts-border-strong)] focus:border-2 focus:border-[var(--ts-teal)] focus:shadow-[var(--ts-shadow-teal)]",
          className,
        ].join(" ")}
      />
      {hasDesc && (
        <p
          id={descId}
          className={`text-xs ${error ? "text-[var(--ts-error)]" : "text-[var(--ts-text-secondary)]"}`}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}
