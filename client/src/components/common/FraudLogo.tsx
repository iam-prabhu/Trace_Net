import { cn } from '../../utils/cn';

interface FraudLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  subtitle?: string;
}

export default function FraudLogo({
  className = 'w-10 h-10',
  size = 40,
  showText = false,
  subtitle = 'Security & Intelligence',
}: FraudLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 select-none drop-shadow-sm',
          className
        )}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 64 64"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="fraudShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="50%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <filter id="fraudGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#312E81" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Shield Badge */}
          <path
            d="M32 4L10 12V28C10 43.5 19.5 54.5 32 60C44.5 54.5 54 43.5 54 28V12L32 4Z"
            fill="url(#fraudShieldGrad)"
            filter="url(#fraudGlow)"
          />

          {/* Inner Inset Border */}
          <path
            d="M32 8.5L14 15V28C14 40.8 21.8 49.8 32 55.2C42.2 49.8 50 40.8 50 28V15L32 8.5Z"
            stroke="#FFFFFF"
            strokeOpacity="0.25"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Graph Network Topology Lines */}
          <line x1="32" y1="20" x2="21" y2="32" stroke="#93C5FD" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="32" y1="20" x2="43" y2="32" stroke="#93C5FD" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="21" y1="32" x2="32" y2="44" stroke="#93C5FD" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="43" y1="32" x2="32" y2="44" stroke="#93C5FD" strokeWidth="2.2" strokeLinecap="round" />
          <line
            x1="21"
            y1="32"
            x2="43"
            y2="32"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeDasharray="2.5 2"
            strokeLinecap="round"
          />
          <line x1="32" y1="20" x2="32" y2="44" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.6" />

          {/* Center Radar Scanner Circle */}
          <circle
            cx="32"
            cy="32"
            r="7"
            stroke="#67E8F9"
            strokeWidth="1.5"
            strokeOpacity="0.9"
            fill="#38BDF8"
            fillOpacity="0.2"
          />
          <circle cx="32" cy="32" r="2.2" fill="#FFFFFF" />

          {/* Network Graph Nodes */}
          <circle cx="32" cy="20" r="3.8" fill="#FFFFFF" />
          <circle cx="32" cy="20" r="2" fill="#2563EB" />

          <circle cx="21" cy="32" r="3.2" fill="#38BDF8" />
          <circle cx="43" cy="32" r="3.2" fill="#38BDF8" />

          {/* Flagged Node at Apex */}
          <circle cx="32" cy="44" r="4.2" fill="#FFFFFF" />
          <circle cx="32" cy="44" r="2.4" fill="#EF4444" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span className="font-black text-sm tracking-tight text-slate-900 leading-tight">
            Fraud Detection Console
          </span>
          <span className="text-[10px] text-blue-600 truncate tracking-wider uppercase font-semibold">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
