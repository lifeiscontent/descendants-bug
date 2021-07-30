import {
  DescendantProvider,
  createDescendantContext,
  Descendant,
  useDescendantsInit,
  useDescendant,
} from "@reach/descendants";
import { MouseEventHandler, PropsWithChildren, useRef } from "react";

interface TestDescendant extends Descendant {}

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
  const index = useDescendant({ element: ref.current }, DescendantContext);
  return (
    <div data-index={index} ref={ref}>
      {props.children}
    </div>
  );
}

export function ReachApp({
  items,
  onClickShuffle,
  countItems,
}: {
  items: (number | number[])[];
  onClickShuffle: MouseEventHandler<HTMLButtonElement>;
  countItems: <T>(arr: T[]) => number;
}) {
  return (
    <Container>
      <button data-testid="button" onClick={onClickShuffle}>
        Shuffle
      </button>
      <Item key="root">
        <span data-testid="item-span">{countItems(items)}</span>
        {items.map((key, index, arr) =>
          Array.isArray(key) ? (
            <Item key={key.toString()}>
              <span data-testid="item-span">
                {countItems(arr.slice(0, index).concat(key))}
              </span>
              {key.map((kkey, iindex, aarr) => (
                <Item key={kkey}>
                  <span data-testid="item-span">
                    {countItems(
                      arr.slice(0, index).concat(aarr.slice(0, iindex))
                    )}
                  </span>
                </Item>
              ))}
            </Item>
          ) : (
            <Item key={key}>
              <span data-testid="item-span">
                {countItems(arr.slice(0, index))}
              </span>
            </Item>
          )
        )}
      </Item>
    </Container>
  );
}
