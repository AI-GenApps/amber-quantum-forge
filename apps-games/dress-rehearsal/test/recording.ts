import type { Draw2D } from "../src/export/Draw2D";

export type Op = { op: string; args: unknown[] };

export class RecordingContext implements Draw2D {
  ops: Op[] = [];
  private values: Record<string, unknown> = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    lineJoin: "miter",
    lineCap: "butt",
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
  };
  private rec(op: string, args: unknown[]): void {
    this.ops.push({ op, args });
  }
  private set(name: string, value: unknown): void {
    this.values[name] = value;
    this.rec(`set:${name}`, [value]);
  }
  get fillStyle(): string {
    return this.values.fillStyle as string;
  }
  set fillStyle(v: string) {
    this.set("fillStyle", v);
  }
  get strokeStyle(): string {
    return this.values.strokeStyle as string;
  }
  set strokeStyle(v: string) {
    this.set("strokeStyle", v);
  }
  get lineWidth(): number {
    return this.values.lineWidth as number;
  }
  set lineWidth(v: number) {
    this.set("lineWidth", v);
  }
  get globalAlpha(): number {
    return this.values.globalAlpha as number;
  }
  set globalAlpha(v: number) {
    this.set("globalAlpha", v);
  }
  get lineJoin(): "round" | "bevel" | "miter" {
    return this.values.lineJoin as "round";
  }
  set lineJoin(v: "round" | "bevel" | "miter") {
    this.set("lineJoin", v);
  }
  get lineCap(): "butt" | "round" | "square" {
    return this.values.lineCap as "butt";
  }
  set lineCap(v: "butt" | "round" | "square") {
    this.set("lineCap", v);
  }
  get font(): string {
    return this.values.font as string;
  }
  set font(v: string) {
    this.set("font", v);
  }
  get textAlign(): "left" | "center" | "right" {
    return this.values.textAlign as "left";
  }
  set textAlign(v: "left" | "center" | "right") {
    this.set("textAlign", v);
  }
  get textBaseline(): "top" | "middle" | "alphabetic" | "bottom" {
    return this.values.textBaseline as "top";
  }
  set textBaseline(v: "top" | "middle" | "alphabetic" | "bottom") {
    this.set("textBaseline", v);
  }
  save() {
    this.rec("save", []);
  }
  restore() {
    this.rec("restore", []);
  }
  translate(x: number, y: number) {
    this.rec("translate", [x, y]);
  }
  scale(x: number, y: number) {
    this.rec("scale", [x, y]);
  }
  rotate(a: number) {
    this.rec("rotate", [a]);
  }
  beginPath() {
    this.rec("beginPath", []);
  }
  closePath() {
    this.rec("closePath", []);
  }
  moveTo(x: number, y: number) {
    this.rec("moveTo", [x, y]);
  }
  lineTo(x: number, y: number) {
    this.rec("lineTo", [x, y]);
  }
  arc(x: number, y: number, r: number, s: number, e: number) {
    this.rec("arc", [x, y, r, s, e]);
  }
  quadraticCurveTo(a: number, b: number, c: number, d: number) {
    this.rec("quadraticCurveTo", [a, b, c, d]);
  }
  bezierCurveTo(a: number, b: number, c: number, d: number, e: number, f: number) {
    this.rec("bezierCurveTo", [a, b, c, d, e, f]);
  }
  arcTo(a: number, b: number, c: number, d: number, r: number) {
    this.rec("arcTo", [a, b, c, d, r]);
  }
  rect(x: number, y: number, w: number, h: number) {
    this.rec("rect", [x, y, w, h]);
  }
  fill() {
    this.rec("fill", [this.fillStyle]);
  }
  stroke() {
    this.rec("stroke", [this.strokeStyle, this.lineWidth]);
  }
  clip() {
    this.rec("clip", []);
  }
  fillRect(x: number, y: number, w: number, h: number) {
    this.rec("fillRect", [x, y, w, h, this.fillStyle]);
  }
  strokeRect(x: number, y: number, w: number, h: number) {
    this.rec("strokeRect", [x, y, w, h, this.strokeStyle]);
  }
  fillText(text: string, x: number, y: number) {
    this.rec("fillText", [text, x, y]);
  }
  setLineDash(s: number[]) {
    this.rec("setLineDash", [s]);
  }
  drawImage(image: unknown, x: number, y: number, w: number, h: number) {
    this.rec("drawImage", [image, x, y, w, h]);
  }
  count(op: string): number {
    return this.ops.filter((o) => o.op === op).length;
  }
  calls(op: string): unknown[][] {
    return this.ops.filter((o) => o.op === op).map((o) => o.args);
  }
  reset(): void {
    this.ops = [];
  }
}
