/** Shown by the stylesheet only while the screen is in portrait. The game is landscape only. */
export function RotateOverlay() {
  return (
    <div class="cd-rotate" role="alert" data-testid="rotate-overlay">
      <svg class="cd-rotate-icon" viewBox="0 0 48 48" aria-hidden="true">
        <rect x="14" y="4" width="20" height="36" rx="4" />
        <path d="M6 30a18 18 0 0 0 10 12M42 18A18 18 0 0 0 32 6" />
        <path d="M13 43l3-1.5-1.5-3M35 5l-3 1.5 1.5 3" />
      </svg>
      <p>Rotate your device to play</p>
    </div>
  );
}
