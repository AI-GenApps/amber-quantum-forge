import { type ComponentChild, render } from "preact";
import { act } from "preact/test-utils";

export interface Mounted {
  container: HTMLElement;
  update(vnode: ComponentChild): Promise<void>;
  unmount(): void;
}

/** Renders a vnode into a fresh container attached to the document (for happy-dom tests). */
export async function mount(vnode: ComponentChild): Promise<Mounted> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() => render(vnode, container));
  return {
    container,
    update: async (next) => {
      await act(() => render(next, container));
    },
    unmount: () => {
      render(null, container);
      container.remove();
    },
  };
}

export { act };
