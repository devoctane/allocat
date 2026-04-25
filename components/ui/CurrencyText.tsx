import {
  formatCurrencyParts,
  type CurrencyFormatOptions,
} from "@/lib/number-format";

interface CurrencyTextProps extends CurrencyFormatOptions {
  value: number;
  className?: string;
  symbolClassName?: string;
}

export function CurrencyText({
  value,
  className = "",
  symbolClassName = "",
  minimumFractionDigits = 0,
  maximumFractionDigits,
}: CurrencyTextProps) {
  const parts = formatCurrencyParts(value, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return (
    <span className={`inline-flex items-baseline font-mono tabular-nums ${className}`.trim()}>
      {parts.map((part, index) => (
        <span
          key={`${part.type}-${index}`}
          className={
            part.type === "currency"
              ? `currency-symbol ${symbolClassName}`.trim()
              : undefined
          }
        >
          {part.value}
        </span>
      ))}
    </span>
  );
}
