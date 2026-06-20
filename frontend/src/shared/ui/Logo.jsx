//SVG-логотип GateKeep — щит с замочной скважиной.

function Logo({ size = 32, light = false }) {
    const primary = light ? '#ffffff' : '#4f46e5';
    const bg = light ? '#1e1b4b' : '#ffffff';

    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M24 4L6 12v12c0 11.1 7.7 21.5 18 24 10.3-2.5 18-12.9 18-24V12L24 4z"
                fill={primary}
            />
            <path
                d="M24 7.5L9 14v10c0 9.6 6.5 18.6 15 20.8 8.5-2.2 15-11.2 15-20.8V14L24 7.5z"
                fill={bg}
            />
            <path
                d="M20 22v-4a4 4 0 1 1 8 0v4"
                stroke={primary}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
            />
            <rect x="18" y="22" width="12" height="12" rx="2.5" fill={primary} />
            <circle cx="24" cy="26" r="1.5" fill={bg} />
            <path d="M23.5 26 L22.5 30 h3 L24.5 26 Z" fill={bg} />
        </svg>
    );
}

export default Logo;
