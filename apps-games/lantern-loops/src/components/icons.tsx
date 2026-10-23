import type { ComponentChildren } from "preact";

function Icon({ children, size = 24 }: { children: ComponentChildren; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const BackIcon = () => (
  <Icon>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);

export const PauseIcon = () => (
  <Icon>
    <path d="M9 5v14M15 5v14" />
  </Icon>
);

export const UndoIcon = () => (
  <Icon>
    <path d="M9 7L4 12l5 5" />
    <path d="M4 12h10a6 6 0 0 1 0 12" transform="translate(0 -6)" />
  </Icon>
);

export const RedoIcon = () => (
  <Icon>
    <path d="M15 7l5 5-5 5" />
    <path d="M20 12H10a6 6 0 0 0 0 12" transform="translate(0 -6)" />
  </Icon>
);

export const RestartIcon = () => (
  <Icon>
    <path d="M4 12a8 8 0 1 0 3-6.2" />
    <path d="M4 4v5h5" />
  </Icon>
);

export const StraightIcon = () => (
  <Icon>
    <path d="M3 12h18" />
  </Icon>
);

export const CornerIcon = () => (
  <Icon>
    <path d="M12 3v3a6 6 0 0 0 6 6h3" />
  </Icon>
);

export const EraseIcon = () => (
  <Icon>
    <path d="M7 4l13 13-4 4H8L3 16z" />
    <path d="M10 8l6 6" />
  </Icon>
);

/** Glowing ember used for hint tokens. */
export function EmberIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-7 1 1 1.5 2 2 3 1-2 1-5 1-8z"
        fill="#F2A33A"
      />
      <path d="M12 12c.5 2 3 3 3 5.5a3 3 0 0 1-6 0c0-2 2-2.5 3-5.5z" fill="#F6EAD3" />
    </svg>
  );
}

export function FlameIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-7 1 1 1.5 2 2 3 1-2 1-5 1-8z"
        fill="#E9657F"
      />
      <path d="M12 12c.5 2 3 3 3 5.5a3 3 0 0 1-6 0c0-2 2-2.5 3-5.5z" fill="#F6EAD3" />
    </svg>
  );
}

export function SnowIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="#8FD0FF"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
    </svg>
  );
}

export function TickIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="#3FBF98"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function LockIcon({ size = 22 }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}
