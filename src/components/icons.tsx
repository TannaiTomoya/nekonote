import type { CSSProperties } from "react";
export function Icon({
  name,
  size = 22,
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const paths: Record<string, React.ReactNode> = {
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="3" />
        <path d="M17 11h4v5h-4a2.5 2.5 0 0 1 0-5ZM3 8V5l14-3v3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 2v6m10-6v6M3 11h18m-13 5h1m6 0h1" />
      </>
    ),
    chart: (
      <>
        <path d="M4 3v17h17M7 14l4-5 4 3 5-7" />
      </>
    ),
    settings: (
      <>
        <path d="m9 3-1 3-3 1-1 3 2 2-2 2 1 3 3 1 1 3h6l1-3 3-1 1-3-2-2 2-2-1-3-3-1-1-3Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    back: <path d="m14 6-6 6 6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    heart: (
      <path d="M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-5 4 1 11 8 16 7-5 13-12 8-16Z" />
    ),
    shield: (
      <>
        <path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    external: (
      <>
        <path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3C8 1 2 7 5 15c7 6 17 0 15-12ZM4 21l11-11" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </>
    ),
    care: (
      <>
        <rect x="4" y="6" width="16" height="15" rx="3" />
        <path d="M9 6V3h6v3m-3 5v6m-3-3h6" />
      </>
    ),
    paw: (
      <>
        <ellipse cx="12" cy="16" rx="6" ry="4" />
        <ellipse cx="4.5" cy="9" rx="2" ry="3" transform="rotate(-25 4.5 9)" />
        <ellipse cx="9" cy="5" rx="2" ry="3" />
        <ellipse cx="15" cy="5" rx="2" ry="3" />
        <ellipse cx="20" cy="9" rx="2" ry="3" transform="rotate(25 20 9)" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.paw}
    </svg>
  );
}
export function CatFace({
  mood = 3,
  size = 64,
}: {
  mood?: number;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 72"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 30 13 9 32 20a34 34 0 0 1 16 0L67 9l-3 21c8 6 10 16 5 25-8 17-50 17-58 0-5-9-3-19 5-25Z"
        fill="currentColor"
        fillOpacity=".12"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="m19 18 3 10m39-10-3 10" stroke="currentColor" strokeWidth="2" />
      {mood < 3 ? (
        <path
          d="m25 38 7 3m16 0 7-3"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ) : mood > 3 ? (
        <path
          d="M24 42q4-8 8 0m16 0q4-8 8 0"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ) : (
        <>
          <circle cx="28" cy="40" r="2.5" fill="currentColor" />
          <circle cx="52" cy="40" r="2.5" fill="currentColor" />
        </>
      )}
      <path
        d="m37 46 3 3 3-3m-3 3v3m-6 0q3 4 6 0 3 4 6 0M9 44l10 2M8 51l11-1m42-4 10-2m-10 6 11 1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {mood === 5 && (
        <path d="M35 56q5 6 10 0" stroke="currentColor" strokeWidth="2" />
      )}
    </svg>
  );
}
