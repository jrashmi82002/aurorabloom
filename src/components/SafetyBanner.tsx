import { AlertTriangle, Phone } from "lucide-react";

interface SafetyBannerProps {
  level: "caution" | "critical";
}

/**
 * Rendered above assistant messages when the server flags the last user
 * message as containing serious content. Aurora Bloom is a wellness
 * companion, not a clinical tool — this makes that boundary visible.
 */
export const SafetyBanner = ({ level }: SafetyBannerProps) => {
  const isCritical = level === "critical";
  return (
    <div
      className={`mb-2 rounded-lg border p-3 text-xs leading-relaxed ${
        isCritical
          ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100"
          : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
      }`}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium">
            {isCritical
              ? "Please read before continuing"
              : "A gentle note"}
          </p>
          <p>
            This is a wellness companion, not a doctor or crisis service.
            What you're sharing deserves a licensed professional's care.
            Please consider reaching out — you don't have to carry this alone.
          </p>
          <p className="flex flex-wrap items-center gap-2 pt-1">
            <Phone className="w-3 h-3" />
            <a href="tel:9152987821" className="underline font-medium">
              iCall India: 9152987821
            </a>
            <span className="opacity-70">·</span>
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Find a helpline (worldwide)
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
