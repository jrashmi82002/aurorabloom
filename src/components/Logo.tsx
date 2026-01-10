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
          <linearGradient id="birdGradient" x1="0%" y1="100%" x2="100%" y2="0%">
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
        </defs>
        
        {/* Bird body - stylized phoenix/dove with open wings */}
        <ellipse cx="50" cy="55" rx="12" ry="15" fill="url(#birdGradient)" />
        
        {/* Bird head */}
        <circle cx="50" cy="38" r="10" fill="url(#birdGradient)" />
        
        {/* Bird beak */}
        <path d="M60 38 L68 40 L60 42 Z" fill="hsl(35, 85%, 55%)" />
        
        {/* Bird eye */}
        <circle cx="53" cy="36" r="2" fill="white" />
        <circle cx="54" cy="36" r="1" fill="hsl(142, 70%, 25%)" />
        
        {/* Left wing - spread open */}
        <path
          d="M38 50 
             Q20 35 8 25
             Q15 30 20 35
             Q12 30 5 35
             Q15 38 22 42
             Q10 42 8 50
             Q20 48 30 52
             L38 55 Z"
          fill="url(#birdGradient)"
          opacity="0.95"
        />
        
        {/* Right wing - spread open */}
        <path
          d="M62 50 
             Q80 35 92 25
             Q85 30 80 35
             Q88 30 95 35
             Q85 38 78 42
             Q90 42 92 50
             Q80 48 70 52
             L62 55 Z"
          fill="url(#birdGradient)"
          opacity="0.95"
        />
        
        {/* Bird tail */}
        <path
          d="M45 68 Q40 78 35 85 Q50 75 55 68 M55 68 Q60 78 65 85 Q50 75 45 68"
          fill="url(#birdGradient)"
          opacity="0.9"
        />
        
        {/* Flowers on head - center flower (pink) */}
        <g transform="translate(50, 28)">
          <circle cx="0" cy="0" r="5" fill="url(#flowerGradient1)" />
          <circle cx="-4" cy="-3" r="3" fill="url(#flowerGradient1)" opacity="0.8" />
          <circle cx="4" cy="-3" r="3" fill="url(#flowerGradient1)" opacity="0.8" />
          <circle cx="-4" cy="2" r="3" fill="url(#flowerGradient1)" opacity="0.8" />
          <circle cx="4" cy="2" r="3" fill="url(#flowerGradient1)" opacity="0.8" />
          <circle cx="0" cy="0" r="2" fill="hsl(45, 90%, 65%)" />
        </g>
        
        {/* Left flower (yellow) */}
        <g transform="translate(38, 32)">
          <circle cx="0" cy="0" r="4" fill="url(#flowerGradient2)" />
          <circle cx="-3" cy="-2" r="2.5" fill="url(#flowerGradient2)" opacity="0.8" />
          <circle cx="3" cy="-2" r="2.5" fill="url(#flowerGradient2)" opacity="0.8" />
          <circle cx="0" cy="0" r="1.5" fill="hsl(25, 80%, 50%)" />
        </g>
        
        {/* Right flower (purple) */}
        <g transform="translate(62, 32)">
          <circle cx="0" cy="0" r="4" fill="url(#flowerGradient3)" />
          <circle cx="-3" cy="-2" r="2.5" fill="url(#flowerGradient3)" opacity="0.8" />
          <circle cx="3" cy="-2" r="2.5" fill="url(#flowerGradient3)" opacity="0.8" />
          <circle cx="0" cy="0" r="1.5" fill="hsl(45, 85%, 65%)" />
        </g>
        
        {/* Small leaves */}
        <ellipse cx="44" cy="35" rx="3" ry="1.5" fill="url(#leafGradient)" transform="rotate(-30 44 35)" />
        <ellipse cx="56" cy="35" rx="3" ry="1.5" fill="url(#leafGradient)" transform="rotate(30 56 35)" />
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
