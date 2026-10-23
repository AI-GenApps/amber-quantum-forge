import { Glyph } from "./Glyph";

export function Hearts({ level, max = 5, name }: { level: number; max?: number; name: string }) {
  return (
    <span class="tlw-hearts" role="img" aria-label={`${name}: ${level} of ${max} hearts`}>
      {Array.from({ length: max }, (_, index) => (
        <Glyph
          key={index}
          name="heart"
          size={18}
          class={index < level ? "tlw-heart tlw-heart--on" : "tlw-heart"}
        />
      ))}
    </span>
  );
}
