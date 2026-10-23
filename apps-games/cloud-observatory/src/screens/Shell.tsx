import { CATALOG, starlightPerSecond } from "@web-games/cloud-observatory-core";
import { IconButton, Screen, Tabs } from "@web-games/kit";
import { useState } from "preact/hooks";
import { useApp } from "../app/context";
import { TAB_IDS, type TabId } from "../app/routes";
import { Btn } from "../components/Btn";
import { Icon } from "../components/Icon";
import { ManagedSheet } from "../components/ManagedSheet";
import { SaveNotice } from "../components/SaveNotice";
import { t } from "../strings";
import { NumberText } from "../ui/NumberText";
import { AtlasTab } from "./AtlasTab";
import { BuildTab } from "./BuildTab";
import { EclipseTab } from "./EclipseTab";
import { JournalTab } from "./JournalTab";
import { LiveStarlight } from "./LiveStarlight";
import { ObserveTab } from "./ObserveTab";

const TAB_LABELS: Readonly<Record<TabId, string>> = {
  observe: t("tab.observe"),
  build: t("tab.build"),
  atlas: t("tab.atlas"),
  eclipse: t("tab.eclipse"),
  journal: t("tab.journal"),
};

function TabBody({ tab }: { tab: TabId }) {
  switch (tab) {
    case "observe":
      return <ObserveTab />;
    case "build":
      return <BuildTab />;
    case "atlas":
      return <AtlasTab />;
    case "eclipse":
      return <EclipseTab />;
    case "journal":
      return <JournalTab />;
  }
}

export function Shell() {
  const { snapshot, tab, setTab, router, feedback } = useApp();
  const [menu, setMenu] = useState(false);
  const { game } = snapshot.profile;
  const rate = starlightPerSecond(game, CATALOG);

  const go = (route: "achievements" | "statistics" | "settings" | "howto") => {
    setMenu(false);
    feedback.sfx("click");
    router.push(route);
  };

  return (
    <Screen name="shell" class="co-screen co-shell">
      <header class="co-header">
        <div class="co-header__stat">
          <span class="co-label">{t("shell.starlight")}</span>
          <NumberText class="co-big" value={game.starlight} unit={t("shell.starlightUnit")} />
          <span class="co-rate">
            <NumberText value={rate} unit={t("shell.perSecondUnit")} />
            {t("shell.perSecond")}
          </span>
        </div>
        <IconButton label={t("shell.menu")} class="co-btn" onClick={() => setMenu(true)}>
          <Icon name="menu" />
        </IconButton>
      </header>
      <LiveStarlight />
      <SaveNotice />
      <Tabs
        class="co-tabs"
        label={t("shell.sections")}
        selected={tab}
        onChange={(id) => {
          feedback.sfx("click");
          setTab(id as TabId);
        }}
        tabs={TAB_IDS.map((id) => ({ id, label: TAB_LABELS[id] }))}
      >
        <TabBody tab={tab} />
      </Tabs>
      <ManagedSheet open={menu} title={t("menu.heading")} onClose={() => setMenu(false)}>
        <div class="co-stack">
          <Btn variant="secondary" fullWidth onClick={() => go("achievements")}>
            {t("menu.achievements")}
          </Btn>
          <Btn variant="secondary" fullWidth onClick={() => go("statistics")}>
            {t("menu.statistics")}
          </Btn>
          <Btn variant="secondary" fullWidth onClick={() => go("howto")}>
            {t("menu.howToPlay")}
          </Btn>
          <Btn variant="secondary" fullWidth onClick={() => go("settings")}>
            {t("menu.settings")}
          </Btn>
          <Btn
            variant="ghost"
            fullWidth
            onClick={() => {
              setMenu(false);
              router.reset("title");
            }}
          >
            {t("menu.titleScreen")}
          </Btn>
        </div>
      </ManagedSheet>
    </Screen>
  );
}
