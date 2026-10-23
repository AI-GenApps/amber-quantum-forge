import { Screen } from "@web-games/kit";
import {
  BOOK_TEXT,
  BOOKS,
  DRINK_TEXT,
  DRINKS,
  MOOD_TEXT,
  PASTRIES,
  PASTRY_TEXT,
  stepDuration,
  type Unlocked,
  unlockedAtDay,
} from "@web-games/the-last-window-core";
import { ItemIcon } from "../art/ItemIcon";
import { TOKEN_WORDS } from "../labels";
import { useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { MoodChip } from "../ui/MoodChip";

function stepsText(steps: readonly (keyof typeof TOKEN_WORDS)[]): string {
  return steps
    .map((token) => {
      const ticks = stepDuration(token);
      const word = TOKEN_WORDS[token];
      return ticks > 0 ? `${word} (${t("recipesWait", { seconds: ticks / 10 })})` : word;
    })
    .join(", ");
}

/** Every drink, pastry, book and mood with its steps. Used by the screen and the pause sheet. */
export function RecipeList({ unlocked }: { unlocked: Unlocked }) {
  return (
    <div class="tlw-recipes" data-testid="recipe-list">
      <h2 class="tlw-subtitle">{t("recipesDrinks")}</h2>
      <ul class="tlw-list tlw-rows">
        {DRINKS.map((rule) => {
          const open = unlocked.drinks.includes(rule.id);
          return (
            <li key={rule.id} class="tlw-row" data-open={open}>
              <ItemIcon slot={rule.id} />
              <span>
                <strong>{rule.name}</strong>
                <br />
                {open ? (
                  <>
                    <span class="tlw-muted">{DRINK_TEXT[rule.id]}</span>
                    <br />
                    <span>{t("recipesSteps", { steps: stepsText(rule.steps) })}</span>
                    <br />
                    <span class="tlw-muted">{t("recipesPrice", { price: rule.price })}</span>
                  </>
                ) : (
                  <span class="tlw-muted">{t("recipesLocked")}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <h2 class="tlw-subtitle">{t("recipesPastries")}</h2>
      <ul class="tlw-list tlw-rows">
        {PASTRIES.map((rule) => {
          const open = unlocked.pastries.includes(rule.id);
          return (
            <li key={rule.id} class="tlw-row" data-open={open}>
              <ItemIcon slot={rule.id} />
              <span>
                <strong>{rule.name}</strong>
                <br />
                {open ? (
                  <>
                    <span class="tlw-muted">{PASTRY_TEXT[rule.id]}</span>
                    <br />
                    <span>{t("recipesSteps", { steps: stepsText(rule.steps) })}</span>
                    <br />
                    <span class="tlw-muted">{t("recipesPrice", { price: rule.price })}</span>
                  </>
                ) : (
                  <span class="tlw-muted">{t("recipesLocked")}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <h2 class="tlw-subtitle">{t("recipesBooks")}</h2>
      <ul class="tlw-list tlw-rows">
        {BOOKS.map((rule) => {
          const open = unlocked.books.includes(rule.id);
          const text = BOOK_TEXT[rule.id];
          return (
            <li key={rule.id} class="tlw-row" data-open={open}>
              <ItemIcon slot={rule.id} />
              <span>
                <strong>{rule.title}</strong>
                <br />
                {open ? (
                  <>
                    <span class="tlw-muted">
                      {text.author}. {text.blurb}
                    </span>
                    <br />
                    <span class="tlw-pick__moods">
                      {rule.moods.map((mood) => (
                        <MoodChip key={mood} mood={mood} />
                      ))}
                    </span>
                  </>
                ) : (
                  <span class="tlw-muted">{t("recipesLocked")}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <h2 class="tlw-subtitle">{t("recipesMoods")}</h2>
      <ul class="tlw-list tlw-rows">
        {MOOD_TEXT.map((mood) => (
          <li key={mood.id} class="tlw-row">
            <MoodChip mood={mood.id} />
            <span class="tlw-muted">{mood.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Recipes() {
  const profile = useProfile();
  return (
    <Screen name="recipes" class="tlw-page">
      <Header title={t("recipesTitle")} />
      <RecipeList unlocked={unlockedAtDay(profile.day)} />
    </Screen>
  );
}
