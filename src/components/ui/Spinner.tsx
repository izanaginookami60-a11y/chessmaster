import { cn } from "@/lib/utils/cn";
import { FiLoader } from "react-icons/fi";

export function Spinner({
  label,
  className,
  size = 20,
}: {
  label?: string;
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-text-secondary",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <FiLoader size={size} className="animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
