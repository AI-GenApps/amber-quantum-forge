import type { FrameId } from "@web-games/dress-rehearsal-core";
import { PALETTE } from "../theme/tokens";
import type { Draw2D } from "./Draw2D";
import { displayFont, fitSize } from "./text";
import type { ExportInput, FrameLayout, Rect, Size } from "./types";

export function frameLayout(frame: FrameId, size: Size): FrameLayout {
  const { width: w, height: h } = size;
  switch (frame) {
    case "plain":
      return {
        board: { x: 0, y: 0, w, h: 1170 },
        footer: { x: 0, y: 1170, w, h: h - 1170 },
      };
    case "paper":
      return {
        board: { x: 84, y: 84, w: w - 168, h: 1010 },
        footer: { x: 84, y: 1110, w: w - 168, h: h - 1110 - 56 },
      };
    case "polaroid":
      return {
        board: { x: 100, y: 100, w: w - 200, h: 930 },
        footer: { x: 100, y: 1030, w: w - 200, h: h - 1030 - 90 },
      };
    case "magazine":
      return {
        board: { x: 60, y: 280, w: w - 120, h: 800 },
        footer: { x: 60, y: 1090, w: w - 120, h: h - 1090 - 40 },
      };
  }
}

function strokeRect(draw: Draw2D, rect: Rect, color: string, width: number): void {
  draw.strokeStyle = color;
  draw.lineWidth = width;
  draw.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

/** Paints the page behind the board: background, mat, border or masthead. */
export function drawFrameBack(draw: Draw2D, frame: FrameId, size: Size, input: ExportInput): void {
  const full: Rect = { x: 0, y: 0, w: size.width, h: size.height };
  switch (frame) {
    case "plain":
      draw.fillStyle = PALETTE.paper;
      draw.fillRect(full.x, full.y, full.w, full.h);
      break;
    case "paper":
      draw.fillStyle = PALETTE.paper2;
      draw.fillRect(full.x, full.y, full.w, full.h);
      draw.fillStyle = PALETTE.paper;
      draw.fillRect(36, 36, full.w - 72, full.h - 72);
      strokeRect(draw, { x: 36, y: 36, w: full.w - 72, h: full.h - 72 }, PALETTE.ink, 4);
      strokeRect(draw, { x: 52, y: 52, w: full.w - 104, h: full.h - 104 }, PALETTE.hairline, 2);
      break;
    case "polaroid":
      draw.fillStyle = PALETTE.mist;
      draw.fillRect(full.x, full.y, full.w, full.h);
      draw.fillStyle = PALETTE.ink;
      draw.globalAlpha = 0.18;
      draw.fillRect(64, 76, full.w - 112, full.h - 112);
      draw.globalAlpha = 1;
      draw.fillStyle = PALETTE.paper;
      draw.fillRect(52, 52, full.w - 104, full.h - 104);
      strokeRect(draw, { x: 52, y: 52, w: full.w - 104, h: full.h - 104 }, PALETTE.hairline, 2);
      break;
    case "magazine": {
      draw.fillStyle = PALETTE.paper;
      draw.fillRect(full.x, full.y, full.w, full.h);
      draw.fillStyle = input.accent;
      draw.fillRect(0, 0, full.w, 250);
      draw.fillStyle = PALETTE.paper;
      draw.textAlign = "center";
      draw.textBaseline = "middle";
      const headline = input.clientName ?? input.title;
      draw.font = displayFont(fitSize(headline.length, 120, full.w - 120, 56), 800);
      draw.fillText(headline, full.w / 2, 120);
      draw.font = displayFont(34, 500);
      draw.fillText(input.gameTitle.toUpperCase(), full.w / 2, 210);
      break;
    }
  }
}

/** Marks drawn after the board: the board outline and the polaroid tape. */
export function drawFrameFront(draw: Draw2D, frame: FrameId, size: Size): void {
  const layout = frameLayout(frame, size);
  if (frame === "plain") {
    draw.strokeStyle = PALETTE.hairline;
    draw.lineWidth = 2;
    draw.beginPath();
    draw.moveTo(0, layout.board.y + layout.board.h);
    draw.lineTo(size.width, layout.board.y + layout.board.h);
    draw.stroke();
  } else {
    strokeRect(draw, layout.board, PALETTE.ink, frame === "magazine" ? 4 : 3);
  }
}
