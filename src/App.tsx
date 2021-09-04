import { MouseEventHandler, useCallback, useState } from "react";

import "./App.css";
import { ReachApp } from "./Reach";
import { CustomApp } from "./Custom";

function shuffle() {
  return Math.random() - 0.5;
}

function countItems<T>(arr: T[]): number {
  return (
    arr.length + arr.reduce((a, b) => a + (Array.isArray(b) ? b.length : 0), 0)
  );
}

export default function App() {
  const [items, setItems] = useState([
    [0, 1, 2],
    4,
    [5, 6, 7],
    9,
    [10, 11, 12],
    14,
  ]);

  const handleClickShuffle: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.preventDefault();
      setItems((items) =>
        [
          ...items.map((item) =>
            Array.isArray(item) ? [...item].sort(shuffle) : item
          ),
        ].sort(shuffle)
      );
    },
    []
  );

  // the custom app registers items correctly, except on the first render

  return (
    <ReachApp
      items={items}
      onClickShuffle={handleClickShuffle}
      countItems={countItems}
    />
  );

  // the reach app registers items correctly 95% of the time, including on first render.

  // return (
  //   <ReachApp
  //     items={items}
  //     onClickShuffle={handleClickShuffle}
  //     countItems={countItems}
  //   />
  // );
}
