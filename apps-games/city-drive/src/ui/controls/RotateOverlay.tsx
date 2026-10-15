/** Shown by the stylesheet only while the screen is in portrait. The game is landscape only. */
export function RotateOverlay() {
  return (
    <div class="cd-rotate" role="alert" data-testid="rotate-overlay">
      <div class="cd-rotate-icon" aria-hidden="true">
        &#8635;
      </div>
      <p>Rotate your device to play</p>
    </div>
  );
}
