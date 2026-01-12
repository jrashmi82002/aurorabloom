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
          {/* Gradient for the head silhouette */}
          <linearGradient id="headGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(142, 76%, 30%)" />
            <stop offset="100%" stopColor="hsl(142, 70%, 45%)" />
          </linearGradient>
          {/* Gradient for pink flower petals */}
          <linearGradient id="pinkFlower" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(340, 82%, 65%)" />
            <stop offset="100%" stopColor="hsl(350, 75%, 55%)" />
          </linearGradient>
          {/* Gradient for coral/peach flower */}
          <linearGradient id="coralFlower" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(15, 85%, 65%)" />
            <stop offset="100%" stopColor="hsl(20, 80%, 55%)" />
          </linearGradient>
          {/* Gradient for lavender flower */}
          <linearGradient id="lavenderFlower" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(280, 60%, 70%)" />
            <stop offset="100%" stopColor="hsl(270, 55%, 60%)" />
          </linearGradient>
          {/* Gradient for leaves */}
          <linearGradient id="leafGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(142, 65%, 45%)" />
            <stop offset="100%" stopColor="hsl(142, 70%, 35%)" />
          </linearGradient>
          {/* Gradient for hair/crown area */}
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(30, 30%, 25%)" />
            <stop offset="100%" stopColor="hsl(25, 25%, 20%)" />
          </linearGradient>
        </defs>
        
        {/* Head silhouette - profile facing slightly right */}
        <path
          d="M35 85 
             C25 85 20 75 20 65
             L20 55
             C20 35 30 20 50 20
             C70 20 80 35 80 55
             L80 65
             C80 75 75 85 65 85
             Z"
          fill="url(#headGradient)"
        />
        
        {/* Hair/crown area */}
        <path
          d="M25 45
             C25 30 35 18 50 18
             C65 18 75 30 75 45
             C70 35 60 28 50 28
             C40 28 30 35 25 45
             Z"
          fill="url(#hairGradient)"
          opacity="0.8"
        />
        
        {/* Peaceful closed eyes - curved lines */}
        <path
          d="M38 52 Q42 49 46 52"
          stroke="hsl(142, 40%, 20%)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M54 52 Q58 49 62 52"
          stroke="hsl(142, 40%, 20%)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Gentle smile */}
        <path
          d="M42 65 Q50 70 58 65"
          stroke="hsl(142, 40%, 20%)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Main center flower (large pink rose-like) */}
        <g transform="translate(50, 12)">
          {/* Outer petals */}
          <ellipse cx="-6" cy="-2" rx="5" ry="6" fill="url(#pinkFlower)" opacity="0.9" transform="rotate(-30 -6 -2)" />
          <ellipse cx="6" cy="-2" rx="5" ry="6" fill="url(#pinkFlower)" opacity="0.9" transform="rotate(30 6 -2)" />
          <ellipse cx="-7" cy="4" rx="5" ry="5" fill="url(#pinkFlower)" opacity="0.85" transform="rotate(-45 -7 4)" />
          <ellipse cx="7" cy="4" rx="5" ry="5" fill="url(#pinkFlower)" opacity="0.85" transform="rotate(45 7 4)" />
          <ellipse cx="0" cy="7" rx="4" ry="5" fill="url(#pinkFlower)" opacity="0.8" />
          {/* Center */}
          <circle cx="0" cy="2" r="4" fill="hsl(50, 90%, 60%)" />
          <circle cx="0" cy="2" r="2" fill="hsl(45, 85%, 50%)" />
        </g>
        
        {/* Left flower (coral/peach) */}
        <g transform="translate(30, 22)">
          <ellipse cx="-4" cy="-1" rx="4" ry="5" fill="url(#coralFlower)" opacity="0.9" transform="rotate(-25 -4 -1)" />
          <ellipse cx="4" cy="-1" rx="4" ry="5" fill="url(#coralFlower)" opacity="0.9" transform="rotate(25 4 -1)" />
          <ellipse cx="-5" cy="3" rx="4" ry="4" fill="url(#coralFlower)" opacity="0.85" transform="rotate(-40 -5 3)" />
          <ellipse cx="5" cy="3" rx="4" ry="4" fill="url(#coralFlower)" opacity="0.85" transform="rotate(40 5 3)" />
          <circle cx="0" cy="1" r="3" fill="hsl(50, 85%, 60%)" />
          <circle cx="0" cy="1" r="1.5" fill="hsl(40, 80%, 50%)" />
        </g>
        
        {/* Right flower (lavender) */}
        <g transform="translate(70, 22)">
          <ellipse cx="-4" cy="-1" rx="4" ry="5" fill="url(#lavenderFlower)" opacity="0.9" transform="rotate(-25 -4 -1)" />
          <ellipse cx="4" cy="-1" rx="4" ry="5" fill="url(#lavenderFlower)" opacity="0.9" transform="rotate(25 4 -1)" />
          <ellipse cx="-5" cy="3" rx="4" ry="4" fill="url(#lavenderFlower)" opacity="0.85" transform="rotate(-40 -5 3)" />
          <ellipse cx="5" cy="3" rx="4" ry="4" fill="url(#lavenderFlower)" opacity="0.85" transform="rotate(40 5 3)" />
          <circle cx="0" cy="1" r="3" fill="hsl(55, 85%, 65%)" />
          <circle cx="0" cy="1" r="1.5" fill="hsl(50, 80%, 55%)" />
        </g>
        
        {/* Small accent flowers/buds */}
        <circle cx="40" cy="16" r="3" fill="url(#pinkFlower)" opacity="0.7" />
        <circle cx="60" cy="16" r="3" fill="url(#lavenderFlower)" opacity="0.7" />
        <circle cx="22" cy="32" r="2.5" fill="url(#coralFlower)" opacity="0.6" />
        <circle cx="78" cy="32" r="2.5" fill="url(#pinkFlower)" opacity="0.6" />
        
        {/* Decorative leaves */}
        <ellipse cx="18" cy="38" rx="6" ry="2.5" fill="url(#leafGreen)" transform="rotate(-55 18 38)" />
        <ellipse cx="82" cy="38" rx="6" ry="2.5" fill="url(#leafGreen)" transform="rotate(55 82 38)" />
        <ellipse cx="38" cy="10" rx="4" ry="1.5" fill="url(#leafGreen)" transform="rotate(-35 38 10)" />
        <ellipse cx="62" cy="10" rx="4" ry="1.5" fill="url(#leafGreen)" transform="rotate(35 62 10)" />
        
        {/* Small leaf accents near flowers */}
        <ellipse cx="24" cy="28" rx="3" ry="1.2" fill="url(#leafGreen)" transform="rotate(-60 24 28)" />
        <ellipse cx="76" cy="28" rx="3" ry="1.2" fill="url(#leafGreen)" transform="rotate(60 76 28)" />
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
