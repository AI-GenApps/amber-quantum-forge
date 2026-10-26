import {
  type ChallengeDef,
  type ClientDef,
  openSlots,
  PIECE_BY_ID,
  ruleChipText,
} from "@web-games/dress-rehearsal-core";
import { Button } from "@web-games/kit";
import { Sprite } from "../art/Sprite";
import { clientSlot } from "../art/slots";
import { SLOT_LABELS } from "../board/model";
import { t } from "../strings";
import { Icon } from "../ui/Icon";
import { AppSheet } from "./AppSheet";

export interface BriefProps {
  open: boolean;
  challenge: ChallengeDef;
  client: ClientDef;
  clientIndex: number;
  accent: string;
  chapterTitle: string;
  onStart: () => void;
  onLeave: () => void;
}

export function ruleTexts(challenge: ChallengeDef): string[] {
  return challenge.rules.map((rule) => {
    const name =
      rule.kind === "include-piece" || rule.kind === "avoid-piece"
        ? PIECE_BY_ID.get(rule.pieceId)?.name
        : undefined;
    return ruleChipText(rule, name);
  });
}

export function Brief({
  open,
  challenge,
  client,
  clientIndex,
  accent,
  chapterTitle,
  onStart,
  onLeave,
}: BriefProps) {
  const slots = openSlots(challenge.slotSet);
  return (
    <AppSheet
      open={open}
      onClose={onLeave}
      title={challenge.name}
      dismissOnBackdrop={false}
      class="dr-brief"
    >
      <div class="dr-brief__body" data-testid="brief" style={{ "--dr-accent": accent }}>
        <p class="dr-eyebrow">{chapterTitle}</p>
        <div class="dr-brief__client">
          <Sprite slot={clientSlot(clientIndex)} size={72} label={client.name} />
          <div>
            <p class="dr-brief__name">{client.name}</p>
            <p class="dr-note">{client.role}</p>
          </div>
        </div>
        <p class="dr-quote">{client.lines.intro}</p>
        <p class="dr-brief__text">{challenge.brief}</p>
        <ul class="dr-brief__rules" aria-label={t("rulesLabel")}>
          {ruleTexts(challenge).map((text) => (
            <li key={text} class="dr-chip dr-chip--plain">
              <span class="dr-chip__icon">
                <Icon name="brief" size={18} />
              </span>
              <span class="dr-chip__text">{text}</span>
            </li>
          ))}
        </ul>
        <p class="dr-note" data-testid="brief-slots">
          {t("briefSlots", {
            count: slots.length,
            slots: slots.map((slot) => SLOT_LABELS[slot]).join(", "),
          })}
        </p>
      </div>
      <div class="dr-sheet__actions">
        <Button variant="secondary" onClick={onLeave}>
          {t("briefLeave")}
        </Button>
        <Button onClick={onStart}>{t("briefStart")}</Button>
      </div>
    </AppSheet>
  );
}
