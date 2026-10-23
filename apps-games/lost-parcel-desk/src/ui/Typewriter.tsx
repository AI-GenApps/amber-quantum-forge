import { useEffect, useState } from "preact/hooks";
import { useReducedMotion } from "../state/app";

export interface TypewriterProps {
  text: string;
  msPerChar?: number;
  onDone?: () => void;
}

/** Types the text out; under reduced motion the whole text appears at once. The full text stays readable to screen readers. */
export function Typewriter({ text, msPerChar = 24, onDone }: TypewriterProps) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(reduced ? text.length : 0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: onDone is a one-shot callback
  useEffect(() => {
    if (reduced || text.length === 0) {
      setCount(text.length);
      onDone?.();
      return undefined;
    }
    setCount(0);
    let typed = 0;
    const timer = setInterval(() => {
      typed += 1;
      setCount(typed);
      if (typed >= text.length) {
        clearInterval(timer);
        onDone?.();
      }
    }, msPerChar);
    return () => clearInterval(timer);
  }, [text, reduced, msPerChar]);
  const complete = count >= text.length;
  return (
    <p class="lp-typewriter" data-complete={complete ? "true" : "false"} data-testid="typewriter">
      <span aria-hidden="true">{text.slice(0, count)}</span>
      <span class="lp-sr-only" data-testid="typewriter-full">
        {text}
      </span>
    </p>
  );
}
