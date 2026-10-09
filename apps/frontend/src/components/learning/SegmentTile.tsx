import { type ButtonHTMLAttributes } from "react";
import { Icon } from "../ui/Icon";
import type { AnswerState } from "./types";
import "./SegmentTile.css";

export function SegmentTile({
  spelling,
  notation,
  selected = false,
  state = "idle",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  spelling: string;
  notation?: string;
  selected?: boolean;
  state?: AnswerState;
}) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-pressed={selected}
      className={`ds-segment ${selected ? "is-selected" : ""} is-${state} ${className}`}
    >
      <strong>{spelling}</strong>
      {notation && <span>{notation}</span>}
      {state !== "idle" && (
        <span className="ds-segment-marker">
          <Icon name={state === "correct" ? "check" : "close"} size={14} />
        </span>
      )}
    </button>
  );
}
