import { GAME_TITLE } from "../ui/brand";
import "./exitPrompt.css";

/** Asks the player whether to leave the app. Android's back button on the home screen opens it. */
export interface ExitPrompt {
  readonly isOpen: boolean;
  /** Resolves true when the player chooses to exit. Calling it while open returns the same promise. */
  confirm(): Promise<boolean>;
  /** Closes the prompt as if the player chose to stay (a second back press does this). */
  cancel(): void;
}

/** A small modal dialog drawn over the UI root. */
export class DomExitPrompt implements ExitPrompt {
  private pending: { promise: Promise<boolean>; finish(exit: boolean): void } | undefined;

  constructor(private readonly host: HTMLElement) {}

  get isOpen(): boolean {
    return this.pending !== undefined;
  }

  confirm(): Promise<boolean> {
    if (this.pending) return this.pending.promise;
    const doc = this.host.ownerDocument;
    const overlay = doc.createElement("div");
    overlay.className = "cd-exit-overlay";
    const dialog = doc.createElement("div");
    dialog.className = "cd-panel cd-confirm cd-exit-dialog";
    dialog.setAttribute("role", "alertdialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", `Exit ${GAME_TITLE}`);
    const message = doc.createElement("p");
    message.textContent = `Exit ${GAME_TITLE}?`;
    const stay = doc.createElement("button");
    stay.type = "button";
    stay.className = "cd-button cd-button-primary";
    stay.textContent = "Keep playing";
    const exit = doc.createElement("button");
    exit.type = "button";
    exit.className = "cd-button cd-button-danger";
    exit.textContent = "Exit";
    dialog.append(message, stay, exit);
    overlay.append(dialog);
    this.host.append(overlay);
    stay.focus();

    let finish: (exit: boolean) => void = () => undefined;
    const promise = new Promise<boolean>((resolve) => {
      finish = (value) => {
        overlay.remove();
        this.pending = undefined;
        resolve(value);
      };
    });
    stay.addEventListener("click", () => finish(false));
    exit.addEventListener("click", () => finish(true));
    this.pending = { promise, finish };
    return promise;
  }

  cancel(): void {
    this.pending?.finish(false);
  }
}
