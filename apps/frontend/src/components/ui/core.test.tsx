import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  Button,
  AnswerOption,
  ProgressBar,
  TextField,
  SegmentTile,
} from "../index";

afterEach(cleanup);
describe("core component interactions", () => {
  it("prevents disabled and loading buttons from performing an action", async () => {
    let calls = 0;
    render(
      <>
        <Button disabled onClick={() => calls++}>
          Khóa
        </Button>
        <Button loading onClick={() => calls++}>
          Đợi
        </Button>
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Khóa" }));
    await userEvent.click(screen.getByRole("button", { name: /Đợi/ }));
    expect(calls).toBe(0);
  });
  it("supports keyboard selection and preserves the controlled answer state", async () => {
    function Example() {
      const [selected, set] = useState(false);
      return (
        <AnswerOption
          label="Con gái"
          letter="A"
          selected={selected}
          onClick={() => set(!selected)}
        />
      );
    }
    render(<Example />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(
      screen
        .getByRole("button", { name: /Con gái/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    await userEvent.keyboard(" ");
    expect(
      screen
        .getByRole("button", { name: /Con gái/ })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });
  it("exposes a bounded progress value including an invalid maximum", () => {
    const { rerender } = render(
      <ProgressBar value={120} max={100} label="Tiến trình" />,
    );
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "100",
    );
    rerender(<ProgressBar value={4} max={0} label="Tiến trình" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "0",
    );
  });
  it("connects field labels and error descriptions accessibly", () => {
    render(<TextField label="Email" error="Email không hợp lệ" />);
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(
      document.getElementById(input.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toBe("Email không hợp lệ");
  });
  it("renders custom notation unchanged and prevents a disabled segment selection", async () => {
    let calls = 0;
    render(
      <SegmentTile
        spelling="oo"
        notation="ký hiệu riêng"
        disabled
        onClick={() => calls++}
      />,
    );
    expect(screen.getByText("ký hiệu riêng")).toBeTruthy();
    await userEvent.click(screen.getByRole("button"));
    expect(calls).toBe(0);
  });
});
