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
          <linearGradient id="logoLeafGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(160, 60%, 45%)" />
            <stop offset="50%" stopColor="hsl(145, 55%, 50%)" />
            <stop offset="100%" stopColor="hsl(130, 50%, 55%)" />
          </linearGradient>
          <linearGradient id="logoStemGradient" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="hsl(140, 40%, 35%)" />
            <stop offset="100%" stopColor="hsl(150, 45%, 45%)" />
          </linearGradient>
        </defs>
        
        {/* Elegant flowing lotus/healing leaf */}
        {/* Center petal - main leaf */}
        <path
          d="M50 12 
             Q35 25, 30 45
             Q28 60, 35 72
             Q42 80, 50 82
             Q58 80, 65 72
             Q72 60, 70 45
             Q65 25, 50 12"
          fill="url(#logoLeafGradient)"
        />
        
        {/* Left flowing petal */}
        <path
          d="M50 35
             Q38 38, 25 50
             Q15 60, 18 72
             Q22 82, 35 80
             Q45 78, 50 70"
          fill="url(#logoLeafGradient)"
          opacity="0.7"
        />
        
        {/* Right flowing petal */}
        <path
          d="M50 35
             Q62 38, 75 50
             Q85 60, 82 72
             Q78 82, 65 80
             Q55 78, 50 70"
          fill="url(#logoLeafGradient)"
          opacity="0.7"
        />
        
        {/* Graceful curved stem */}
        <path
          d="M50 82 
             Q52 88, 48 95"
          stroke="url(#logoStemGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Inner light - represents healing energy */}
        <ellipse
          cx="50"
          cy="48"
          rx="8"
          ry="12"
          fill="hsl(150, 70%, 80%)"
          opacity="0.4"
        />
        
        {/* Subtle center vein */}
        <path
          d="M50 22 Q50 45, 50 70"
          stroke="hsl(var(--background))"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
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
