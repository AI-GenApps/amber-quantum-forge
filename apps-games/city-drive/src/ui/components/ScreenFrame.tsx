import type { ComponentChildren } from "preact";
import { formatCoins } from "../model/format";
import { BackIcon, CoinIcon, StarIcon } from "./Icons";

/** Coin balance and total stars, shown on the menu screens. */
export function Wallet({ coins, stars }: { coins: number; stars: number }) {
  return (
    <div class="cd-wallet">
      <span class="cd-chip">
        <CoinIcon />
        <span data-testid="coins">{formatCoins(coins)}</span>
        <span class="cd-sr">coins</span>
      </span>
      <span class="cd-chip">
        <StarIcon earned />
        <span data-testid="stars">{stars}</span>
        <span class="cd-sr">stars</span>
      </span>
    </div>
  );
}

/** Title bar with a back button, used by the map, garage and settings. */
export function ScreenFrame({
  title,
  onBack,
  wallet,
  children,
  class: cls = "",
}: {
  title: string;
  onBack: () => void;
  wallet?: { coins: number; stars: number };
  children: ComponentChildren;
  class?: string;
}) {
  return (
    <section class={`cd-screen ${cls}`.trim()} aria-label={title}>
      <header class="cd-screen-head">
        <button type="button" class="cd-button cd-icon-button" aria-label="Back" onClick={onBack}>
          <BackIcon />
        </button>
        <h2>{title}</h2>
        {wallet ? <Wallet coins={wallet.coins} stars={wallet.stars} /> : null}
      </header>
      <div class="cd-screen-body">{children}</div>
    </section>
  );
}
