import {
  DescendantProvider,
  createDescendantContext,
  Descendant,
  useDescendantsInit,
  useDescendant,
} from "@reach/descendants";
import { MouseEventHandler, PropsWithChildren, useCallback, useMemo, useRef, useState } from "react";

const DescendantContext =
  createDescendantContext<Descendant>("DescendantContext");

function Container(props: PropsWithChildren<unknown>) {
  const [descendants, setDescendants] = useDescendantsInit<Descendant>();
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

export function useStatefulRefValue<V>(
  ref: React.RefObject<V>,
  initialState: V
): [V, (refValue: Exclude<V, null>) => void] {
  let [state, setState] = useState(initialState);
  let callbackRef = useCallback((refValue: Exclude<V, null>) => {
    (ref as React.MutableRefObject<V>).current = refValue;
    setState(refValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [state, callbackRef];
}

function Item(props: PropsWithChildren<unknown>) {
  const ref = useRef<HTMLDivElement | null>(null);
  let [element, handleRefSet] = useStatefulRefValue(ref, null);
  const descendant: Omit<Descendant<HTMLDivElement>, "index"> = useMemo(() => {
    return { element }
  }, [element]);
  const index = useDescendant(descendant, DescendantContext);
  return (
    <div data-index={index} ref={handleRefSet}>
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
