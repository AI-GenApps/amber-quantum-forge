import type * as React from "react";

export interface ButtonProps {
  text: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Button({ text, onClick }: ButtonProps) {
  return (
    <button
      type="button"
      className="max-w-[200px] text-center rounded-[10px] px-[30px] py-[14px] text-[15px] bg-[#2f80ed] border-none cursor-pointer text-white font-inherit transition-colors duration-200 hover:bg-[#2563eb] active:bg-[#1d4ed8] focus:outline focus:outline-2 focus:outline-[#2f80ed] focus:outline-offset-2"
      onClick={onClick}
    >
      {text}
    </button>
  );
}
