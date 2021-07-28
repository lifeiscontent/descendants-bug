import { render, fireEvent, screen } from "@testing-library/react";
import App from "./App";
import "@testing-library/jest-dom/extend-expect";

describe("descendants", () => {
  beforeEach(() => {
    render(<App />);
  });

  test("renders items in order", async () => {
    const items = await screen.findAllByText(/Children/i, { selector: "span" });
    items.forEach((item) => {
      expect(item).toHaveTextContent(
        `Children ${item.parentElement?.getAttribute("data-index")}`
      );
    });
  });

  test.each(Array.from({ length: 100 }))(
    "when shuffling items are still ordered",
    async () => {
      const button = await screen.findByTestId("button");
      fireEvent.click(button);
      const items = await screen.findAllByText(/Children/i, {
        selector: "span",
      });

      items.forEach((item) => {
        // if (
        //   item.textContent?.includes(
        //     item.parentElement?.getAttribute("data-index")
        //   ) === false
        // ) {
        //   console.log(
        //     item.textContent,
        //     item.parentElement?.getAttribute("data-index")
        //   );
        //   screen.debug();
        // }
        expect(item).toHaveTextContent(
          item.parentElement!.getAttribute("data-index")!
        );
      });
    }
  );
});
