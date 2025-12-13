"use client";

import { Button } from "@repo/ui";

export default function Web() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">Web</h1>
      <Button onClick={() => console.log("Pressed!")} text="Boop" />
    </div>
  );
}
