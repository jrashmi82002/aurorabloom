import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  clickable?: boolean;
}

export const Logo = ({ className, size = "md", showText = true, clickable = true }: LogoProps) => {
  const navigate = useNavigate();
  
  const sizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const handleClick = () => {
    if (clickable) {
      navigate("/");
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-2", 
        clickable && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={handleClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (clickable && (e.key === "Enter" || e.key === " ")) {
          handleClick();
        }
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className={cn(sizes[size])}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle - filled background */}
        <circle 
          cx="50" 
          cy="50" 
          r="46" 
          fill="currentColor"
          className="text-primary"
        />
        
        {/* Inner content in contrasting color */}
        <g className="text-primary-foreground">
          {/* Head - filled */}
          <circle 
            cx="50" 
            cy="28" 
            r="9" 
            fill="currentColor"
          />
          
          {/* Body/torso - filled triangle shape */}
          <path
            d="M50 38 L42 58 L58 58 Z"
            fill="currentColor"
          />
          
          {/* Legs in lotus - filled curves */}
          <ellipse
            cx="38"
            cy="66"
            rx="14"
            ry="8"
            fill="currentColor"
          />
          <ellipse
            cx="62"
            cy="66"
            rx="14"
            ry="8"
            fill="currentColor"
          />
          
          {/* Highlight lines - arms in meditation */}
          <path
            d="M42 46 C36 50 30 56 26 62"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M58 46 C64 50 70 56 74 62"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9"
          />
          
          {/* Aura accent above head */}
          <path
            d="M40 16 C45 10 55 10 60 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M44 10 C48 5 52 5 56 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>
      </svg>
      {showText && (
        <span className={cn(
          "font-serif font-semibold text-foreground",
          size === "sm" && "text-lg",
          size === "md" && "text-xl",
          size === "lg" && "text-2xl"
        )}>
          Aurora Bloom
        </span>
      )}
    </div>
  );
};
