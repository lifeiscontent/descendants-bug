import { PropsWithChildren, useRef, useState } from "react";

import "./App.css";
import { DescendantProvider, useDescendant } from "./yago";

function Container({ children }: PropsWithChildren<unknown>) {
  return <DescendantProvider>{children}</DescendantProvider>;
}

function Item(props: PropsWithChildren<unknown>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const index = useDescendant(ref.current);
  return (
    <div data-index={index} ref={ref}>
      {props.children}
    </div>
  );
}

function randomRatio() {
  return Math.random() - 0.5;
}

function count<T>(arr: T[]): number {
  return (
    arr.length + arr.reduce((a, b) => a + (Array.isArray(b) ? b.length : 0), 0)
  );
}

export default function App() {
  const [items, setItems] = useState([
    [1, 2, 0],
    9,
    [6, 7, 5],
    [11, 10, 12],
    14,
    4,
  ]);

  return (
    <Container>
      <button
        data-testid="button"
        onClick={(e) => {
          e.preventDefault();
          setItems((items) =>
            [
              ...items.map((item) =>
                Array.isArray(item) ? [...item].sort(randomRatio) : item
              ),
            ].sort(randomRatio)
          );
        }}
      >
        Shuffle
      </button>
      <Item key="root">
        <span data-testid="text">{count(items)}</span>
        {items.map((key, index, arr) =>
          Array.isArray(key) ? (
            <Item key={key.toString()}>
              <span data-testid="text">
                {count(arr.slice(0, index).concat(key))}
              </span>
              {key.map((kkey, iindex, aarr) => (
                <Item key={kkey}>
                  <span data-testid="text">
                    {count(arr.slice(0, index).concat(aarr.slice(0, iindex)))}
                  </span>
                </Item>
              ))}
            </Item>
          ) : (
            <Item key={key}>
              <span data-testid="text">{count(arr.slice(0, index))}</span>
            </Item>
          )
        )}
      </Item>
    </Container>
  );
}
