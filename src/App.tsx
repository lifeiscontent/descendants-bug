import { PropsWithChildren, useRef, useState } from "react";

import "./App.css";
import {
  DescendantProvider,
  createDescendantContext,
  Descendant,
  useDescendantsInit,
  useDescendant,
} from "@reach/descendants";

interface TestDescendant extends Descendant {
  disabled: boolean;
}

const DescendantContext =
  createDescendantContext<TestDescendant>("DescendantContext");

function Container(props: PropsWithChildren<unknown>) {
  const [descendants, setDescendants] = useDescendantsInit<TestDescendant>();
  return (
    <DescendantProvider
      context={DescendantContext}
      items={descendants}
      set={setDescendants}
    >
      {props.children}
    </DescendantProvider>
  );
}

function Item(props: PropsWithChildren<unknown>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const index = useDescendant(
    { element: ref.current, disabled: false },
    DescendantContext
  );
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
    [0, 1, 2],
    4,
    [5, 6, 7],
    9,
    [10, 11, 12],
    14,
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
        <span>Children {count(items)}</span>
        {items.map((key, index, arr) =>
          Array.isArray(key) ? (
            <Item key={key.toString()}>
              <span>Children {count(arr.slice(0, index).concat(key))}</span>
              {key.map((kkey, iindex, aarr) => (
                <Item key={kkey}>
                  <span>
                    Children{" "}
                    {count(arr.slice(0, index).concat(aarr.slice(0, iindex)))}
                  </span>
                </Item>
              ))}
            </Item>
          ) : (
            <Item key={key}>
              <span>Children {count(arr.slice(0, index))}</span>
            </Item>
          )
        )}
      </Item>
    </Container>
  );
}
