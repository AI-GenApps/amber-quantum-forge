import type { LinkKind } from "@web-games/lost-parcel-desk-core";
import { useEffect, useRef } from "preact/hooks";
import { useMotion } from "../motion/useMotion";
import { t } from "../strings";
import { Icon } from "./Icon";

export interface LinkItemProps {
  tag: string;
  kind: LinkKind;
}

/** One link on a profile card; its line draws itself in when the link is made. */
export function LinkItem({ tag, kind }: LinkItemProps) {
  const motion = useMotion();
  const line = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (line.current) void motion.linkDraw(line.current);
  }, [motion]);
  return (
    <li class={`lp-link lp-link--${kind}`} data-link={kind}>
      <Icon name={kind === "fits" ? "tick" : "cross"} size={16} />
      <span class="lp-link__word">{kind === "fits" ? t("linkFits") : t("linkRulesOut")}</span>
      <span class="lp-link__tag">{tag}</span>
      <span class="lp-link__line" ref={line} aria-hidden="true" />
    </li>
  );
}
