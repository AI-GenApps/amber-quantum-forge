import { IconButton } from "@web-games/kit";
import type { ComponentChildren } from "preact";
import { useApp } from "../state/app";
import { t } from "../strings";
import { Icon } from "./Icon";

export interface HeaderProps {
  title: string;
  onBack?: () => void;
  children?: ComponentChildren;
}

export function Header({ title, onBack, children }: HeaderProps) {
  const { router } = useApp();
  return (
    <header class="lp-topbar">
      <IconButton label={t("back")} onClick={onBack ?? (() => void router.pop())}>
        <Icon name="back" />
      </IconButton>
      <h1 class="lp-topbar__title">{title}</h1>
      <div class="lp-topbar__extra">{children}</div>
    </header>
  );
}
