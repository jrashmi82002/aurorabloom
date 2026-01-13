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
        
        {/* Stylized profile silhouette - peaceful face looking slightly up */}
        <path
          d="M35 72 
             C30 72 28 65 28 60
             L28 52
             C28 42 32 35 38 32
             C40 31 42 30 45 30
             C48 30 51 31 53 33
             C58 36 62 42 62 52
             L62 60
             C62 65 60 72 55 72
             Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        />
        
        {/* Flowing hair with botanical elements */}
        <path
          d="M32 45
             C30 38 35 28 45 26
             C55 24 65 30 68 40
             C70 48 68 55 65 58"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-primary"
        />
        
        {/* Decorative leaf/petal elements emerging from head - left */}
        <path
          d="M38 28 C35 22 38 16 42 14 C46 12 50 14 48 20 C46 26 42 28 38 28"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="text-primary"
        />
        
        {/* Center bloom */}
        <path
          d="M48 26 C48 18 52 12 56 12 C60 12 62 18 58 24 C54 28 50 28 48 26"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="text-primary"
        />
        
        {/* Right decorative element */}
        <path
          d="M58 28 C62 22 68 20 72 24 C76 28 74 34 68 34 C62 34 58 32 58 28"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="text-primary"
        />
        
        {/* Small accent dots/buds */}
        <circle cx="44" cy="18" r="1.5" fill="currentColor" className="text-primary" />
        <circle cx="54" cy="15" r="1.5" fill="currentColor" className="text-primary" />
        <circle cx="64" cy="22" r="1.5" fill="currentColor" className="text-primary" />
        
        {/* Peaceful closed eyes */}
        <path
          d="M38 50 Q42 48 46 50"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M50 50 Q54 48 58 50"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="text-primary"
        />
        
        {/* Gentle smile */}
        <path
          d="M42 60 Q48 64 54 60"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="text-primary"
        />
        
        {/* Small decorative flourish at bottom */}
        <path
          d="M35 80 C40 78 45 82 50 80 C55 78 60 82 65 80"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-primary/60"
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
