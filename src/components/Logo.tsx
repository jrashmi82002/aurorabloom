import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ className, size = "md", showText = true }: LogoProps) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 100 100"
        className={cn(sizes[size], "text-primary")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mountainGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(200, 60%, 35%)" />
            <stop offset="50%" stopColor="hsl(190, 55%, 45%)" />
            <stop offset="100%" stopColor="hsl(180, 50%, 55%)" />
          </linearGradient>
          <linearGradient id="mountainPeakGradient" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(210, 70%, 70%)" />
            <stop offset="100%" stopColor="hsl(200, 60%, 50%)" />
          </linearGradient>
          <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 0%, 100%)" />
            <stop offset="100%" stopColor="hsl(200, 20%, 95%)" />
          </linearGradient>
        </defs>
        
        {/* Main Mountain */}
        <path
          d="M50 18 
             L15 85
             L85 85
             Z"
          fill="url(#mountainGradient)"
        />
        
        {/* Snow cap on mountain peak */}
        <path
          d="M50 18
             L38 40
             Q44 38, 50 35
             Q56 38, 62 40
             Z"
          fill="url(#mountainPeakGradient)"
        />
        
        {/* Secondary smaller mountain behind */}
        <path
          d="M25 50 
             L5 85
             L45 85
             Z"
          fill="hsl(200, 45%, 40%)"
          opacity="0.6"
        />
        
        {/* Small cloud on right side of peak */}
        <ellipse
          cx="62"
          cy="28"
          rx="12"
          ry="6"
          fill="url(#cloudGradient)"
          opacity="0.9"
        />
        <ellipse
          cx="68"
          cy="26"
          rx="8"
          ry="5"
          fill="url(#cloudGradient)"
          opacity="0.95"
        />
        <ellipse
          cx="56"
          cy="27"
          rx="7"
          ry="4"
          fill="url(#cloudGradient)"
          opacity="0.85"
        />
        
        {/* Tiny cloud accent on left */}
        <ellipse
          cx="35"
          cy="32"
          rx="6"
          ry="3"
          fill="url(#cloudGradient)"
          opacity="0.7"
        />
      </svg>
      {showText && (
        <span className={cn(
          "font-serif font-semibold text-foreground",
          size === "sm" && "text-lg",
          size === "md" && "text-xl",
          size === "lg" && "text-2xl"
        )}>
          Healing Haven
        </span>
      )}
    </div>
  );
};
