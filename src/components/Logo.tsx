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
        {/* Leaf shape */}
        <path
          d="M50 10 C20 30, 15 60, 50 90 C85 60, 80 30, 50 10"
          fill="currentColor"
          opacity="0.9"
        />
        {/* Center vein */}
        <path
          d="M50 20 L50 80"
          stroke="hsl(var(--background))"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Side veins */}
        <path
          d="M50 35 L35 45 M50 50 L30 58 M50 65 L38 72"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M50 35 L65 45 M50 50 L70 58 M50 65 L62 72"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
        />
        {/* Glow effect */}
        <ellipse
          cx="50"
          cy="50"
          rx="25"
          ry="35"
          fill="hsl(var(--primary))"
          opacity="0.2"
          filter="blur(10px)"
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
