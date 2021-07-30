import {
  createContext,
  MouseEventHandler,
  PropsWithChildren,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface DescendantContextValue<DescendantType extends Node> {
  descendants: DescendantType[];
  register: (descendant: DescendantType) => void;
  unregister: (descendant: DescendantType) => void;
}

const DescendantContext = createContext<DescendantContextValue<any>>({
  descendants: [],
  register: () => undefined,
  unregister: () => undefined,
});

function DescendantProvider<DescendantType extends Node>({
  children,
}: PropsWithChildren<unknown>) {
  const [descendants, setDescendants] = useState<DescendantType[]>([]);

  const register: DescendantContextValue<DescendantType>["register"] =
    useCallback((element) => {
      setDescendants((d) => [...d, element]);
    }, []);

  const unregister: DescendantContextValue<DescendantType>["unregister"] =
    useCallback((element) => {
      setDescendants((d) => d.filter((desc) => desc !== element));
    }, []);

  const context: DescendantContextValue<DescendantType> = useMemo(
    () => ({
      descendants,
      register,
      unregister,
    }),
    [descendants, register, unregister]
  );

  return (
    <DescendantContext.Provider value={context}>
      {children}
    </DescendantContext.Provider>
  );
}

function useDescendant<Descendant extends Node>(element: Descendant | null) {
  const { descendants, register, unregister } = useContext(DescendantContext);

  const elementIndex = descendants.findIndex((d) => d === element);

  const descendantsCount = descendants.length;
  useLayoutEffect(() => {
    if (element === null) {
      return;
    }

    register(element);

    return () => {
      unregister(element);
    };
    // descendantsCount to trigger registration flow
    // so we register all items again if the number of
    // descendants change
  }, [descendantsCount, element, register, unregister]);

  return elementIndex === -1 ? undefined : elementIndex;
}

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

export function CustomApp({
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
              <span data-testid="item-span">{countItems(arr.slice(0, index))}</span>
            </Item>
          )
        )}
      </Item>
    </Container>
  );
}
