import { IconButton } from "@web-games/kit";
import type { ComponentChildren } from "preact";
import { t } from "../strings";
import { BackIcon } from "./icons";

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ComponentChildren;
}

export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <header class="ll-header">
      {onBack ? (
        <IconButton label={t("common.back")} onClick={onBack}>
          <BackIcon />
        </IconButton>
      ) : (
        <span class="ll-header-gap" />
      )}
      <h1 class="ll-title">{title}</h1>
      <div class="ll-header-right">{right}</div>
    </header>
  );
}
