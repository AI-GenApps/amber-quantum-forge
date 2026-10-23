import { IconButton } from "@web-games/kit";
import type { ComponentChildren } from "preact";
import { useApp } from "../state/app";
import { t } from "../strings";
import { Glyph } from "./Glyph";

export interface HeaderProps {
  title: string;
  onBack?: () => void;
  children?: ComponentChildren;
}

export function Header({ title, onBack, children }: HeaderProps) {
  const { router } = useApp();
  return (
    <header class="fd-topbar">
      <IconButton label={t("back")} onClick={onBack ?? (() => void router.pop())}>
        <Glyph kind="arrow-left" size={22} />
      </IconButton>
      <h1 class="fd-topbar__title">{title}</h1>
      <div class="fd-topbar__extra">{children}</div>
    </header>
  );
}
