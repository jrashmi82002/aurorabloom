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
        {/* Circular frame */}
        <circle 
          cx="50" 
          cy="50" 
          r="46" 
          stroke="currentColor" 
          strokeWidth="1.5"
          className="text-primary"
        />
        
        {/* Head */}
        <circle 
          cx="50" 
          cy="28" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="1.5"
          className="text-primary"
        />
        
        {/* Body - torso */}
        <path
          d="M50 38 L50 55"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-primary"
        />
        
        {/* Arms in meditation pose - hands resting on knees */}
        <path
          d="M50 45 C45 48 38 52 32 58"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M50 45 C55 48 62 52 68 58"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-primary"
        />
        
        {/* Legs in lotus position */}
        <path
          d="M50 55 C42 58 35 62 30 68 C28 70 30 72 34 72 C42 72 48 68 50 65"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        />
        <path
          d="M50 55 C58 58 65 62 70 68 C72 70 70 72 66 72 C58 72 52 68 50 65"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        />
        
        {/* Subtle aura/glow lines above head */}
        <path
          d="M42 15 C45 12 50 10 50 10 C50 10 55 12 58 15"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-primary/50"
        />
        <path
          d="M45 11 C48 8 50 6 50 6 C50 6 52 8 55 11"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          className="text-primary/30"
        />
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
