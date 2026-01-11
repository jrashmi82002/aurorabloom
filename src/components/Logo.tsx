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
        className={cn(sizes[size], "text-primary")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="headGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(142, 76%, 36%)" />
            <stop offset="50%" stopColor="hsl(142, 70%, 45%)" />
            <stop offset="100%" stopColor="hsl(160, 60%, 50%)" />
          </linearGradient>
          <linearGradient id="flowerGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(330, 80%, 70%)" />
            <stop offset="100%" stopColor="hsl(350, 75%, 60%)" />
          </linearGradient>
          <linearGradient id="flowerGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(45, 90%, 65%)" />
            <stop offset="100%" stopColor="hsl(35, 85%, 55%)" />
          </linearGradient>
          <linearGradient id="flowerGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(280, 70%, 65%)" />
            <stop offset="100%" stopColor="hsl(270, 65%, 55%)" />
          </linearGradient>
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(142, 60%, 50%)" />
            <stop offset="100%" stopColor="hsl(142, 70%, 35%)" />
          </linearGradient>
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(30, 60%, 75%)" />
            <stop offset="100%" stopColor="hsl(25, 50%, 65%)" />
          </linearGradient>
        </defs>
        
        {/* Human head silhouette - stylized profile */}
        <ellipse cx="50" cy="55" rx="25" ry="30" fill="url(#headGradient)" />
        
        {/* Face area - lighter inner glow */}
        <ellipse cx="50" cy="58" rx="18" ry="22" fill="url(#headGradient)" opacity="0.8" />
        
        {/* Peaceful closed eyes */}
        <path
          d="M38 52 Q42 50 46 52"
          stroke="hsl(142, 60%, 25%)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M54 52 Q58 50 62 52"
          stroke="hsl(142, 60%, 25%)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Gentle smile */}
        <path
          d="M44 64 Q50 68 56 64"
          stroke="hsl(142, 60%, 25%)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Hair/crown area with flowers */}
        <path
          d="M25 45 Q30 25 50 22 Q70 25 75 45 Q65 35 50 32 Q35 35 25 45"
          fill="url(#headGradient)"
          opacity="0.9"
        />
        
        {/* Main center flower (large pink) */}
        <g transform="translate(50, 18)">
          <circle cx="0" cy="0" r="7" fill="url(#flowerGradient1)" />
          <circle cx="-5" cy="-4" r="4" fill="url(#flowerGradient1)" opacity="0.9" />
          <circle cx="5" cy="-4" r="4" fill="url(#flowerGradient1)" opacity="0.9" />
          <circle cx="-6" cy="2" r="4" fill="url(#flowerGradient1)" opacity="0.9" />
          <circle cx="6" cy="2" r="4" fill="url(#flowerGradient1)" opacity="0.9" />
          <circle cx="0" cy="5" r="3" fill="url(#flowerGradient1)" opacity="0.8" />
          <circle cx="0" cy="0" r="3" fill="hsl(45, 90%, 65%)" />
        </g>
        
        {/* Left flower (yellow) */}
        <g transform="translate(32, 26)">
          <circle cx="0" cy="0" r="5" fill="url(#flowerGradient2)" />
          <circle cx="-4" cy="-2" r="3" fill="url(#flowerGradient2)" opacity="0.9" />
          <circle cx="4" cy="-2" r="3" fill="url(#flowerGradient2)" opacity="0.9" />
          <circle cx="-3" cy="3" r="3" fill="url(#flowerGradient2)" opacity="0.8" />
          <circle cx="3" cy="3" r="3" fill="url(#flowerGradient2)" opacity="0.8" />
          <circle cx="0" cy="0" r="2" fill="hsl(25, 80%, 50%)" />
        </g>
        
        {/* Right flower (purple) */}
        <g transform="translate(68, 26)">
          <circle cx="0" cy="0" r="5" fill="url(#flowerGradient3)" />
          <circle cx="-4" cy="-2" r="3" fill="url(#flowerGradient3)" opacity="0.9" />
          <circle cx="4" cy="-2" r="3" fill="url(#flowerGradient3)" opacity="0.9" />
          <circle cx="-3" cy="3" r="3" fill="url(#flowerGradient3)" opacity="0.8" />
          <circle cx="3" cy="3" r="3" fill="url(#flowerGradient3)" opacity="0.8" />
          <circle cx="0" cy="0" r="2" fill="hsl(45, 85%, 65%)" />
        </g>
        
        {/* Small decorative buds */}
        <circle cx="40" cy="20" r="2.5" fill="url(#flowerGradient1)" opacity="0.7" />
        <circle cx="60" cy="20" r="2.5" fill="url(#flowerGradient3)" opacity="0.7" />
        
        {/* Leaves */}
        <ellipse cx="24" cy="35" rx="5" ry="2.5" fill="url(#leafGradient)" transform="rotate(-45 24 35)" />
        <ellipse cx="76" cy="35" rx="5" ry="2.5" fill="url(#leafGradient)" transform="rotate(45 76 35)" />
        <ellipse cx="42" cy="14" rx="4" ry="1.5" fill="url(#leafGradient)" transform="rotate(-30 42 14)" />
        <ellipse cx="58" cy="14" rx="4" ry="1.5" fill="url(#leafGradient)" transform="rotate(30 58 14)" />
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
