import { cn } from "@/lib/utils";

interface CalmingIllustrationProps {
  moodTrend?: string;
  className?: string;
}

export const CalmingIllustration = ({ moodTrend = "steady", className }: CalmingIllustrationProps) => {
  // Color palette based on mood
  const colors = {
    improving: {
      sky: "hsl(var(--primary))",
      mountain: "hsl(170, 35%, 45%)",
      cloud: "hsl(0, 0%, 100%)",
      sun: "hsl(45, 90%, 65%)",
    },
    steady: {
      sky: "hsl(200, 60%, 70%)",
      mountain: "hsl(160, 30%, 50%)",
      cloud: "hsl(0, 0%, 98%)",
      sun: "hsl(40, 80%, 60%)",
    },
    "needs attention": {
      sky: "hsl(270, 40%, 75%)",
      mountain: "hsl(270, 25%, 45%)",
      cloud: "hsl(0, 0%, 95%)",
      sun: "hsl(35, 70%, 55%)",
    },
  };

  const palette = colors[moodTrend as keyof typeof colors] || colors.steady;

  return (
    <svg
      viewBox="0 0 400 200"
      className={cn("w-full h-full", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.sky} stopOpacity="0.8" />
          <stop offset="100%" stopColor="hsl(45, 30%, 97%)" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.mountain} />
          <stop offset="100%" stopColor="hsl(160, 35%, 35%)" />
        </linearGradient>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>

      {/* Sky */}
      <rect width="400" height="200" fill="url(#skyGradient)" />

      {/* Sun/Moon */}
      <circle
        cx="320"
        cy="50"
        r="30"
        fill={palette.sun}
        opacity="0.9"
        filter="url(#softGlow)"
      />
      <circle cx="320" cy="50" r="25" fill={palette.sun} />

      {/* Distant mountains */}
      <path
        d="M0 200 L80 100 L160 200 Z"
        fill="hsl(160, 20%, 70%)"
        opacity="0.5"
      />
      <path
        d="M100 200 L200 80 L300 200 Z"
        fill="hsl(160, 25%, 60%)"
        opacity="0.6"
      />

      {/* Main mountain with snow cap (matching logo) */}
      <path
        d="M150 200 L250 60 L350 200 Z"
        fill="url(#mountainGradient)"
      />
      {/* Snow cap */}
      <path
        d="M225 80 L250 60 L275 80 L265 85 L250 75 L235 85 Z"
        fill="hsl(0, 0%, 98%)"
        opacity="0.95"
      />

      {/* Clouds at mountain top */}
      <g opacity="0.9">
        <ellipse cx="230" cy="75" rx="20" ry="8" fill={palette.cloud} filter="url(#softGlow)" />
        <ellipse cx="250" cy="65" rx="25" ry="10" fill={palette.cloud} filter="url(#softGlow)" />
        <ellipse cx="270" cy="72" rx="18" ry="7" fill={palette.cloud} filter="url(#softGlow)" />
      </g>

      {/* Floating clouds */}
      <g opacity="0.7">
        <ellipse cx="60" cy="40" rx="30" ry="12" fill={palette.cloud} />
        <ellipse cx="85" cy="35" rx="25" ry="10" fill={palette.cloud} />
        <ellipse cx="45" cy="38" rx="20" ry="8" fill={palette.cloud} />
      </g>
      <g opacity="0.6">
        <ellipse cx="350" cy="90" rx="25" ry="10" fill={palette.cloud} />
        <ellipse cx="370" cy="85" rx="20" ry="8" fill={palette.cloud} />
      </g>

      {/* Foreground hill */}
      <ellipse cx="200" cy="220" rx="250" ry="40" fill="hsl(150, 40%, 55%)" opacity="0.3" />

      {/* Birds */}
      <g fill="none" stroke="hsl(160, 20%, 30%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <path d="M50 70 Q55 65 60 70 Q65 65 70 70" />
        <path d="M80 55 Q85 50 90 55 Q95 50 100 55" />
        <path d="M120 80 Q125 75 130 80 Q135 75 140 80" />
      </g>

      {/* Inspirational text overlay area */}
      <text
        x="200"
        y="180"
        textAnchor="middle"
        className="font-serif"
        fill="hsl(160, 20%, 25%)"
        fontSize="14"
        fontWeight="500"
        opacity="0.8"
      >
        Your Journey to Inner Peace
      </text>
    </svg>
  );
};