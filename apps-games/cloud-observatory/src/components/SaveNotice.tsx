import { useApp } from "../app/context";
import { t } from "../strings";
import { Btn } from "./Btn";

/** Tells the player when a save was repaired or could not be read at all. */
export function SaveNotice() {
  const { snapshot, session } = useApp();
  if (snapshot.persistence === "read-failed") {
    return (
      <p class="co-notice co-notice--danger" role="alert" data-notice="read-failed">
        {t("notice.readFailed")}
      </p>
    );
  }
  if (snapshot.saveNotice === null) return null;
  return (
    <div class="co-notice" role="status" data-notice="recovered">
      <p>{t("notice.recovered")}</p>
      <Btn size="small" variant="secondary" onClick={() => session.dismissSaveNotice()}>
        {t("common.dismiss")}
      </Btn>
    </div>
  );
}
