import { render, fireEvent, screen } from "@testing-library/react";
import App from "./App";
import "@testing-library/jest-dom/extend-expect";

describe("descendants", () => {
  beforeEach(() => {
    render(<App />);
  });

  test("renders items in order", async () => {
    const items = await screen.findAllByTestId("text");
    items.forEach((item) => {
      expect(item).toHaveTextContent(
        item.parentElement?.getAttribute("data-index")!
      );
    });
  });

  test.each(Array.from({ length: 1000 }))(
    "when shuffling items are still ordered",
    async () => {
      const button = await screen.findByTestId("button");
      fireEvent.click(button);
      const items = await screen.findAllByTestId("text");

      items.forEach((item) => {
        expect(item).toHaveTextContent(
          item.parentElement!.getAttribute("data-index")!
        );
      });
    }
  );
});
