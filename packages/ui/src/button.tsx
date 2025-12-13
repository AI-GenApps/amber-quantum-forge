import * as React from "react";
import styles from "./button.module.css";

export interface ButtonProps {
  text: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Button({ text, onClick }: ButtonProps) {
  return (
    <button className={styles.button} onClick={onClick}>
      {text}
    </button>
  );
}
