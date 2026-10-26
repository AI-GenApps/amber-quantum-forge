import { IconButton } from "@web-games/kit";
import { useApp } from "../app/context";
import { t } from "../strings";
import { Icon } from "./Icon";

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
}

/** Title bar for pushed screens with a back button that pops the router. */
export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  const { router, feedback } = useApp();
  const back = () => {
    feedback.sfx("back");
    if (onBack) onBack();
    else if (!router.pop()) router.reset("shell");
  };
  return (
    <header class="co-bar">
      <IconButton label={t("common.back")} class="co-btn" onClick={back}>
        <Icon name="back" />
      </IconButton>
      <h1 class="co-bar__title">{title}</h1>
    </header>
  );
}
