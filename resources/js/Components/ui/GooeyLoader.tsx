interface GooeyLoaderProps {
    size?: number;
    className?: string;
}

export function GooeyLoader({ size = 200, className = '' }: GooeyLoaderProps) {
    return (
        <div className={`relative ${className}`}>
            {/* Filter SVG - hidden, just for the gooey effect */}
            <svg className="w-0 h-0 absolute">
                <defs>
                    <filter id="gooey-filter">
                        <feGaussianBlur in="SourceGraphic" stdDeviation={7} result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -10"
                            result="gooey"
                        />
                        <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
                    </filter>
                </defs>
            </svg>

            {/* Main spinner with gooey filter */}
            <svg
                className="animate-none"
                style={{ filter: 'url(#gooey-filter)' }}
                width={size}
                height={size}
                viewBox="0 0 200 200"
            >
                <defs>
                    <linearGradient id="brand-gradient">
                        {/* Brand purple to orange gradient */}
                        <stop offset="0%" stopColor="#660ADB" />
                        <stop offset="100%" stopColor="#FF3C2B" />
                    </linearGradient>
                    <linearGradient
                        id="loader-gradient"
                        x1="40"
                        y1="40"
                        x2="160"
                        y2="160"
                        gradientUnits="userSpaceOnUse"
                        xlinkHref="#brand-gradient"
                    />
                </defs>

                {/* Organic flowing path */}
                <path
                    className="gooey-path"
                    d="m 164,100 c 0,-35.346224 -28.65378,-64 -64,-64 -35.346224,0 -64,28.653776 -64,64 0,35.34622 28.653776,64 64,64 35.34622,0 64,-26.21502 64,-64 0,-37.784981 -26.92058,-64 -64,-64 -37.079421,0 -65.267479,26.922736 -64,64 1.267479,37.07726 26.703171,65.05317 64,64 37.29683,-1.05317 64,-64 64,-64"
                    fill="none"
                    stroke="url(#loader-gradient)"
                    strokeWidth="23"
                    strokeLinecap="round"
                    strokeDasharray="180 800"
                />

                {/* Circle stroke */}
                <circle
                    className="gooey-circle"
                    cx="100"
                    cy="100"
                    r="64"
                    fill="none"
                    stroke="url(#loader-gradient)"
                    strokeWidth="23"
                    strokeLinecap="round"
                    strokeDasharray="26 54"
                />
            </svg>

            {/* Shadow/blur copy for depth */}
            <svg
                className="absolute top-0 left-0 opacity-30 blur-sm"
                style={{ transform: 'translate(3px, 3px)' }}
                width={size}
                height={size}
                viewBox="0 0 200 200"
            >
                <path
                    className="gooey-path"
                    d="m 164,100 c 0,-35.346224 -28.65378,-64 -64,-64 -35.346224,0 -64,28.653776 -64,64 0,35.34622 28.653776,64 64,64 35.34622,0 64,-26.21502 64,-64 0,-37.784981 -26.92058,-64 -64,-64 -37.079421,0 -65.267479,26.922736 -64,64 1.267479,37.07726 26.703171,65.05317 64,64 37.29683,-1.05317 64,-64 64,-64"
                    fill="none"
                    stroke="url(#loader-gradient)"
                    strokeWidth="23"
                    strokeLinecap="round"
                    strokeDasharray="180 800"
                />
                <circle
                    className="gooey-circle"
                    cx="100"
                    cy="100"
                    r="64"
                    fill="none"
                    stroke="url(#loader-gradient)"
                    strokeWidth="23"
                    strokeLinecap="round"
                    strokeDasharray="26 54"
                />
            </svg>

            <style>{`
                .gooey-path {
                    animation: gooey-spin 10s infinite linear;
                }
                .gooey-circle {
                    animation: gooey-spin 3s infinite linear;
                }
                @keyframes gooey-spin {
                    0% {
                        stroke-dashoffset: 0;
                    }
                    100% {
                        stroke-dashoffset: -403px;
                    }
                }
            `}</style>
        </div>
    );
}
