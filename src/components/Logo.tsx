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
        {/* Flowing leaf with organic curves */}
        <defs>
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(150, 50%, 55%)" />
            <stop offset="50%" stopColor="hsl(160, 45%, 50%)" />
            <stop offset="100%" stopColor="hsl(170, 40%, 45%)" />
          </linearGradient>
        </defs>
        
        {/* Main flowing leaf shape - organic and curved */}
        <path
          d="M50 8 
             C25 15, 12 35, 15 55 
             C18 75, 35 88, 50 92 
             C65 88, 82 75, 85 55 
             C88 35, 75 15, 50 8"
          fill="url(#leafGradient)"
        />
        
        {/* Curved stem flowing through */}
        <path
          d="M50 92 
             C50 85, 48 75, 50 65 
             C52 55, 48 45, 50 35 
             C52 25, 50 15, 50 8"
          stroke="hsl(var(--background))"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        
        {/* Flowing side veins - left */}
        <path
          d="M50 28 C42 32, 32 38, 25 42"
          stroke="hsl(var(--background))"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M50 45 C40 50, 28 55, 22 60"
          stroke="hsl(var(--background))"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M50 62 C42 66, 34 70, 28 74"
          stroke="hsl(var(--background))"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        
        {/* Flowing side veins - right */}
        <path
          d="M50 28 C58 32, 68 38, 75 42"
          stroke="hsl(var(--background))"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M50 45 C60 50, 72 55, 78 60"
          stroke="hsl(var(--background))"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M50 62 C58 66, 66 70, 72 74"
          stroke="hsl(var(--background))"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        
        {/* Subtle inner glow */}
        <ellipse
          cx="50"
          cy="50"
          rx="20"
          ry="30"
          fill="hsl(150, 60%, 70%)"
          opacity="0.15"
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
