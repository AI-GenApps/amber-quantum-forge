import {
  FACET_LABELS,
  FACETS,
  type LinkKind,
  type PersonContent,
  RETURN_TO_SENDER,
} from "@web-games/lost-parcel-desk-core";
import { Sprite } from "../art/Sprite";
import { useArtManifest, useSettings } from "../state/app";
import { t } from "../strings";
import { Icon } from "./Icon";
import { RubberStamp } from "./RubberStamp";
import { arrowNav } from "./useHotkeys";

export interface CardLink {
  clueId: string;
  tag: string;
  kind: LinkKind;
}

export interface CardBracket {
  id: string;
  kind: LinkKind;
  tags: [string, string];
}

export interface ProfileCardProps {
  person: PersonContent;
  fits: number;
  rulesOut: number;
  returned: boolean;
  selected: boolean;
  /** A pinned clue is selected, so tapping the card opens the link menu. */
  linking: boolean;
  links: readonly CardLink[];
  brackets: readonly CardBracket[];
  onSelect: () => void;
  showFacts?: boolean;
}

export function ProfileCard({
  person,
  fits,
  rulesOut,
  returned,
  selected,
  linking,
  links,
  brackets,
  onSelect,
  showFacts = true,
}: ProfileCardProps) {
  const { highContrast } = useSettings();
  const manifest = useArtManifest();
  const classes = [
    "lp-pcard",
    selected ? "lp-pcard--selected" : "",
    returned ? "lp-pcard--returned" : "",
    fits > 0 ? "lp-pcard--linked" : "",
    highContrast ? "lp-pcard--hc" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <article class={classes} data-person={person.id} aria-label={person.name}>
      <button
        type="button"
        class="lp-pcard__head"
        aria-pressed={selected}
        disabled={returned}
        data-nav="true"
        data-card={person.id}
        onClick={onSelect}
        onKeyDown={arrowNav}
      >
        <Sprite
          slot={person.portraitSlot}
          size={54}
          label={t("portraitOf", { name: person.name })}
          {...(manifest ? { manifest } : {})}
        />
        <span class="lp-pcard__who">
          <span class="lp-pcard__name">{person.name}</span>
          <span class="lp-pcard__trade">{person.trade}</span>
          <span class="lp-pcard__hint">
            {returned
              ? t("cardReturned")
              : linking
                ? t("cardLinkHere")
                : selected
                  ? t("cardSelected")
                  : t("cardSelect")}
          </span>
        </span>
      </button>
      {showFacts ? (
        <dl class="lp-pcard__facts">
          {FACETS.map((facet) => (
            <div key={facet} class="lp-pcard__fact">
              <dt>{FACET_LABELS[facet]}</dt>
              <dd>{person.facets[facet]}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p class="lp-pcard__summary" data-testid={`summary-${person.id}`}>
        {t("cardSummary", { fits, rulesOut })}
      </p>
      {links.length > 0 ? (
        <ul class="lp-pcard__links">
          {links.map((link) => (
            <li key={link.clueId} class={`lp-link lp-link--${link.kind}`} data-link={link.kind}>
              <Icon name={link.kind === "fits" ? "tick" : "cross"} size={16} />
              <span class="lp-link__word">
                {link.kind === "fits" ? t("linkFits") : t("linkRulesOut")}
              </span>
              <span class="lp-link__tag">{link.tag}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {brackets.map((bracket) => (
        <p
          key={bracket.id}
          class={`lp-bracket lp-bracket--${bracket.kind}`}
          data-bracket={bracket.id}
        >
          <span class="lp-bracket__mark" aria-hidden="true">
            {"[ ]"}
          </span>
          {t("bracketPair", { first: bracket.tags[0], second: bracket.tags[1] })}
        </p>
      ))}
      {returned ? (
        <div class="lp-pcard__stamp">
          <RubberStamp text={RETURN_TO_SENDER} id={person.id} size="small" />
        </div>
      ) : null}
    </article>
  );
}
