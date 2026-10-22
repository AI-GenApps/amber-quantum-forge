import type { ComponentChildren } from "preact";
import { useId } from "preact/hooks";
import { cx } from "./cx";

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: readonly TabItem[];
  selected: string;
  onChange: (id: string) => void;
  /** Accessible name of the tab list. */
  label: string;
  class?: string;
  /** Content of the selected tab. */
  children?: ComponentChildren;
}

export function nextTab(
  tabs: readonly TabItem[],
  selected: string,
  key: string,
): string | undefined {
  const enabled = tabs.filter((tab) => !tab.disabled);
  if (enabled.length === 0) return undefined;
  const index = enabled.findIndex((tab) => tab.id === selected);
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return enabled[(index + 1) % enabled.length]?.id;
    case "ArrowLeft":
    case "ArrowUp":
      return enabled[(index - 1 + enabled.length) % enabled.length]?.id;
    case "Home":
      return enabled[0]?.id;
    case "End":
      return enabled[enabled.length - 1]?.id;
    default:
      return undefined;
  }
}

export function Tabs({ tabs, selected, onChange, label, class: className, children }: TabsProps) {
  const base = useId();
  const tabId = (id: string) => `${base}-tab-${id}`;
  const panelId = `${base}-panel`;
  return (
    <div class={cx("wg-tabs", className)}>
      <div
        class="wg-tabs__list"
        role="tablist"
        aria-label={label}
        onKeyDown={(event) => {
          const target = nextTab(tabs, selected, event.key);
          if (target === undefined) return;
          event.preventDefault();
          onChange(target);
          document.getElementById(tabId(target))?.focus();
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={tabId(tab.id)}
            type="button"
            role="tab"
            class="wg-tab"
            aria-selected={tab.id === selected}
            aria-controls={panelId}
            tabIndex={tab.id === selected ? 0 : -1}
            disabled={tab.disabled ?? false}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div class="wg-tabs__panel" id={panelId} role="tabpanel" aria-labelledby={tabId(selected)}>
        {children}
      </div>
    </div>
  );
}
