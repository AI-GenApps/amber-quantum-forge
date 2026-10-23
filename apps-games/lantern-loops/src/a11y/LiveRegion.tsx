export interface LiveRegionProps {
  message: string;
}

/** Polite screen-reader announcements (conflicts, the win). Visually hidden. */
export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <div class="ll-sr" role="status" aria-live="polite" aria-atomic="true" data-live-region="true">
      {message}
    </div>
  );
}
