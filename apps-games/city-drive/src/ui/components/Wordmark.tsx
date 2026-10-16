/**
 * The home-screen wordmark: the name set in Russo One (HTML and CSS, so it stays crisp at any
 * density) next to a small icon mark. The last word takes the accent colour; the text content is
 * exactly the title, so screen readers and tests read one heading.
 */
export function Wordmark({ title }: { title: string }) {
  const words = title.split(" ");
  const last = words.pop() ?? "";
  return (
    <h1 class="cd-wordmark" data-testid="game-title">
      <img class="cd-wordmark-mark" src="/icons/icon-192.png" alt="" width="44" height="44" />
      <span class="cd-wordmark-text">
        {words.length > 0 ? `${words.join(" ")} ` : ""}
        <span class="cd-wordmark-accent">{last}</span>
      </span>
    </h1>
  );
}
