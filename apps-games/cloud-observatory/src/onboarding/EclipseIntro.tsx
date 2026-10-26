import { Btn } from "../components/Btn";
import { ManagedSheet } from "../components/ManagedSheet";
import { t } from "../strings";

export interface EclipseIntroProps {
  open: boolean;
  onClose: () => void;
}

/** The one-time explainer shown when pending shards first reach the Eclipse minimum. */
export function EclipseIntro({ open, onClose }: EclipseIntroProps) {
  return (
    <ManagedSheet open={open} title={t("eclipseIntro.title")} onClose={onClose}>
      <div class="co-stack" data-sheet="eclipse-intro">
        <p>{t("eclipseIntro.body1")}</p>
        <p>{t("eclipseIntro.body2")}</p>
        <p>{t("eclipseIntro.body3")}</p>
        <Btn fullWidth onClick={onClose}>
          {t("eclipseIntro.ok")}
        </Btn>
      </div>
    </ManagedSheet>
  );
}
