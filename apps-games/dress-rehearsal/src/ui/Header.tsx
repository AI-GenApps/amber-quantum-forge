import { IconButton } from "@web-games/kit";
import type { ComponentChildren } from "preact";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { Icon } from "./Icon";

export function CoinBadge() {
  const profile = useProfile();
  return (
    <span class="dr-coins" data-testid="coins">
      <Icon name="coin" size={18} />
      <span class="dr-sr-only">{t("coinsLabel", { coins: profile.coins })}</span>
      <span aria-hidden="true">{profile.coins}</span>
    </span>
  );
}

export interface HeaderProps {
  title: string;
  onBack?: () => void;
  showCoins?: boolean;
  children?: ComponentChildren;
}

export function Header({ title, onBack, showCoins = true, children }: HeaderProps) {
  const { router } = useApp();
  return (
    <header class="dr-header">
      <IconButton
        label={t("back")}
        onClick={() => (onBack ? onBack() : router.handleBack())}
        class="dr-header__back"
      >
        <Icon name="back" size={22} />
      </IconButton>
      <h1 class="dr-header__title">{title}</h1>
      <div class="dr-header__end">
        {children}
        {showCoins ? <CoinBadge /> : null}
      </div>
    </header>
  );
}
