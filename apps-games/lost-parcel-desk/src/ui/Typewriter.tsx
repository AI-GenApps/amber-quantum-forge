import { useEffect, useRef, useState } from "preact/hooks";
import { TYPEWRITER_MS_PER_CHAR } from "../motion/timing";
import { useFeedback, useReducedMotion } from "../state/app";

export interface TypewriterProps {
  text: string;
  msPerChar?: number;
  onDone?: () => void;
}

/**
 * Types the text out at about 40 characters per second; a tap finishes it at once. Under reduced motion the
 * whole text appears at once. The typewriter sound loops only while it types. The full text stays readable
 * to screen readers.
 */
export function Typewriter({ text, msPerChar = TYPEWRITER_MS_PER_CHAR, onDone }: TypewriterProps) {
  const reduced = useReducedMotion();
  const feedback = useFeedback();
  const [count, setCount] = useState(reduced ? text.length : 0);
  const typed = useRef(reduced ? text.length : 0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: onDone is a one-shot callback
  useEffect(() => {
    if (reduced || text.length === 0) {
      typed.current = text.length;
      setCount(text.length);
      onDone?.();
      return undefined;
    }
    typed.current = 0;
    setCount(0);
    feedback.setTyping(true);
    const timer = setInterval(() => {
      typed.current = Math.min(text.length, typed.current + 1);
      setCount(typed.current);
      if (typed.current >= text.length) {
        clearInterval(timer);
        feedback.setTyping(false);
        onDone?.();
      }
    }, msPerChar);
    return () => {
      clearInterval(timer);
      feedback.setTyping(false);
    };
  }, [text, reduced, msPerChar, feedback]);
  const complete = count >= text.length;
  const finish = (): void => {
    typed.current = text.length;
    setCount(text.length);
  };
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the full text is always in the DOM; the tap only skips the animation
    <p
      class="lp-typewriter"
      data-complete={complete ? "true" : "false"}
      data-testid="typewriter"
      onClick={finish}
    >
      <span aria-hidden="true">{text.slice(0, count)}</span>
      <span class="lp-sr-only" data-testid="typewriter-full">
        {text}
      </span>
    </p>
  );
}
