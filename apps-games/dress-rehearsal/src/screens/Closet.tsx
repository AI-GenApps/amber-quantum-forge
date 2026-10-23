import {
  CHAPTERS,
  chapterUnlocked,
  PIECES_BY_THEME,
  type Piece,
} from "@web-games/dress-rehearsal-core";
import { Screen } from "@web-games/kit";
import { Glyph } from "../glyphs/Glyph";
import { useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { Icon } from "../ui/Icon";
import { PieceArt, Swatch, Tags } from "../ui/PieceBits";

function PieceCard({ piece }: { piece: Piece }) {
  return (
    <li class="dr-card dr-closet-piece" data-piece-id={piece.id}>
      <PieceArt piece={piece} size={64} decorative={false} />
      <span class="dr-closet-piece__name">{piece.name}</span>
      <Swatch colour={piece.colour} />
      <Tags piece={piece} />
    </li>
  );
}

function Silhouette({ piece, needed }: { piece: Piece; needed: number }) {
  return (
    <li
      class="dr-card dr-closet-piece dr-closet-piece--locked"
      data-locked="true"
      aria-label={t("closetLockedPiece", { category: piece.category, needed })}
    >
      <span class="dr-silhouette" aria-hidden="true">
        <Glyph category={piece.category} colour="black" size={64} />
      </span>
      <span class="dr-closet-piece__name">
        <Icon name="lock" size={16} /> {t("closetLockedShort")}
      </span>
    </li>
  );
}

export function Closet() {
  const profile = useProfile();
  return (
    <Screen name="closet">
      <Header title={t("closetTitle")} />
      {CHAPTERS.map((chapter) => {
        const open = chapterUnlocked(profile, chapter.index);
        const pieces = PIECES_BY_THEME[chapter.themeId];
        return (
          <section
            key={chapter.themeId}
            class="dr-closet-theme"
            data-theme={chapter.themeId}
            data-locked={open ? "false" : "true"}
            style={{ "--dr-accent": chapter.accent }}
            aria-label={chapter.title}
          >
            <h2 class="dr-closet-theme__title">{chapter.title}</h2>
            {open ? null : (
              <p class="dr-note">{t("closetNeeds", { needed: chapter.unlockStars })}</p>
            )}
            <ul class="dr-closet-grid">
              {pieces.map((piece) =>
                open ? (
                  <PieceCard key={piece.id} piece={piece} />
                ) : (
                  <Silhouette key={piece.id} piece={piece} needed={chapter.unlockStars} />
                ),
              )}
            </ul>
          </section>
        );
      })}
    </Screen>
  );
}
