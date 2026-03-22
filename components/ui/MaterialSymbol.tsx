interface MaterialSymbolProps {
  icon: string;
  size?: number;
  className?: string;
}

export function MaterialSymbol({ icon, className = "" }: MaterialSymbolProps) {
  return (
    <span className={`material-symbols-outlined ${className}`}>
      {icon}
    </span>
  );
}
