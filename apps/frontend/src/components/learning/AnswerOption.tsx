import { type ButtonHTMLAttributes } from "react";
import { Icon } from "../ui/Icon";
import type { AnswerState } from "./types";
import "./AnswerOption.css";

export function AnswerOption({
  label,
  description,
  letter,
  selected = false,
  state = "idle",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  description?: string;
  letter?: string;
  selected?: boolean;
  state?: AnswerState;
}) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-pressed={selected}
      className={`ds-answer ${selected ? "is-selected" : ""} is-${state} ${className}`}
    >
      {letter && <span className="ds-answer-letter">{letter}</span>}
      <span className="ds-answer-content">
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </span>
      <Icon
        name={
          state === "correct"
            ? "check_circle"
            : state === "incorrect"
              ? "cancel"
              : selected
                ? "check_circle"
                : "radio_button_unchecked"
        }
        size={23}
      />
    </button>
  );
}
