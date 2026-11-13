type Props = {
  className?: string;
  title?: string;
};

export function Logo({ className, title }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        d="M14 22V14H22M42 14H50V22M50 42V50H42M22 50H14V42"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 20V44M32 20V44M40 20V44"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <rect
        x="15"
        y="24"
        width="16"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2.3"
      />
      <path d="M15 32H31M23 24V40" stroke="currentColor" strokeWidth="2.1" />
      <path
        d="M31 32H50"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M43 32V39M49 32V37"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
