import { Button } from "@web-games/kit";
import type { LinkKind } from "@web-games/lost-parcel-desk-core";
import { AppSheet } from "../sheets/AppSheet";
import { t } from "../strings";
import { Icon } from "./Icon";

export interface LinkMenuProps {
  open: boolean;
  clueTag: string;
  personName: string;
  current: LinkKind | null;
  onChoose: (kind: LinkKind | null) => void;
  onClose: () => void;
}

export function LinkMenu({ open, clueTag, personName, current, onChoose, onClose }: LinkMenuProps) {
  return (
    <AppSheet
      open={open}
      onClose={onClose}
      title={t("linkMenuTitle", { tag: clueTag, name: personName })}
    >
      <div class="lp-linkmenu" data-testid="link-menu">
        <Button
          fullWidth
          variant={current === "fits" ? "primary" : "secondary"}
          onClick={() => onChoose("fits")}
        >
          <Icon name="tick" size={18} /> {t("linkFits")}
        </Button>
        <Button
          fullWidth
          variant={current === "rules-out" ? "primary" : "secondary"}
          onClick={() => onChoose("rules-out")}
        >
          <Icon name="cross" size={18} /> {t("linkRulesOut")}
        </Button>
        <Button
          fullWidth
          variant="ghost"
          disabled={current === null}
          onClick={() => onChoose(null)}
        >
          {t("linkRemove")}
        </Button>
      </div>
    </AppSheet>
  );
}
