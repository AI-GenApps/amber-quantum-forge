import { IconButton } from "@web-games/kit";
import type { ComponentChildren } from "preact";
import { useApp } from "../state/app";
import { t } from "../strings";
import { Glyph } from "./Glyph";

export interface HeaderProps {
  title: string;
  /** Overrides the default pop. */
  onBack?: () => void;
  end?: ComponentChildren;
}

export function Header({ title, onBack, end }: HeaderProps) {
  const { router } = useApp();
  return (
    <header class="tlw-header">
      <IconButton
        label={t("back")}
        variant="ghost"
        class="tlw-header__back"
        onClick={() => (onBack ? onBack() : router.handleBack())}
      >
        <Glyph name="back" />
      </IconButton>
      <h1 class="tlw-header__title">{title}</h1>
      <div class="tlw-header__end">{end}</div>
    </header>
  );
}
