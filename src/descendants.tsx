import { dequal as deepEqual } from "dequal";
import {
  Context,
  createContext,
  DependencyList,
  Dispatch,
  KeyboardEvent,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function useForceUpdate() {
  const [, set] = useState(Object.create(null));

  return useCallback(() => set(Object.create(null)), []);
}

function usePrevious<T>(value: T): T | null {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function noop(): void {}

interface DescendantContextValue<DescendantType extends Descendant> {
  descendants: DescendantType[];
  registerDescendant: (
    descendant:
      | DescendantType
      | (Omit<DescendantType, "index"> & { index?: number })
  ) => void;
  unregisterDescendant: (descendant: DescendantType["element"]) => void;
}

interface Descendant<ElementType extends Node = Node> {
  element: ElementType | null;
  index: number;
}

function createDescendantContext<DescendantType extends Descendant>(
  name: string,
  initialValue = Object.create(null)
): Context<DescendantContextValue<DescendantType>> {
  const descendants: DescendantType[] = [];
  const defaultValue = {
    descendants,
    registerDescendant: noop,
    unregisterDescendant: noop,
    ...initialValue,
  } as DescendantContextValue<DescendantType>;
  const context = createContext(defaultValue);
  context.displayName = name;

  return context;
}

function useDeepCompareMemoize(value: DependencyList) {
  const ref = useRef<DependencyList>();
  const signalRef = useRef<number>(0);

  if (!deepEqual(value, ref.current)) {
    ref.current = value;
    signalRef.current += 1;
  }

  return [signalRef.current];
}

function useDescendant<DescendantType extends Descendant>(
  descendant: Omit<DescendantType, "index">,
  context: Context<DescendantContextValue<DescendantType>>,
  indexProp?: number
) {
  const forceUpdate = useForceUpdate();
  const { registerDescendant, unregisterDescendant, descendants } =
    useContext(context);

  const index =
    indexProp ??
    descendants.findIndex((item) => item.element === descendant.element);

  const previousDescendants = usePrevious(descendants);

  const someDescendantsHaveChanged =
    descendants.length !== previousDescendants?.length &&
    descendants.some(
      (descendant, index) =>
        descendant.element !== previousDescendants?.[index]?.element
    );

  useLayoutEffect(() => {
    if (!descendant.element) {
      forceUpdate();
    }

    registerDescendant({
      ...descendant,
      index,
    } as DescendantType);
    return () => unregisterDescendant(descendant.element);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, useDeepCompareMemoize([forceUpdate, index, registerDescendant, someDescendantsHaveChanged, unregisterDescendant, descendant]));

  return index;
}

function useDescendants<DescendantType extends Descendant>(
  ctx: Context<DescendantContextValue<DescendantType>>
) {
  return useContext(ctx).descendants;
}

function useDescendantsInit<DescendantType extends Descendant>() {
  return useState<DescendantType[]>([]);
}

function DescendantProvider<DescendantType extends Descendant>({
  context: Ctx,
  children,
  descendants,
  set,
}: {
  set: Dispatch<SetStateAction<DescendantType[]>>;
  context: Context<DescendantContextValue<DescendantType>>;
  descendants: DescendantType[];
  children: ReactNode;
}) {
  const registerDescendant: DescendantContextValue<DescendantType>["registerDescendant"] =
    useCallback(
      ({ element, index: explicitIndex, ...rest }) => {
        if (!element) {
          return;
        }

        set((descendants) => {
          let newDescendants: DescendantType[];
          if (explicitIndex !== undefined && explicitIndex !== -1) {
            newDescendants = [
              ...descendants,
              {
                ...rest,
                element,
                index: explicitIndex,
              } as DescendantType,
            ];
          } else if (descendants.length === 0) {
            newDescendants = [
              {
                ...rest,
                element,
                index: 0,
              } as DescendantType,
            ];
          } else if (
            descendants.find((descendant) => descendant.element === element)
          ) {
            newDescendants = descendants;
          } else {
            const index = descendants.findIndex((descendant) => {
              if (!descendant.element || !element) {
                return false;
              }
              return Boolean(
                descendant.element.compareDocumentPosition(element) &
                  Node.DOCUMENT_POSITION_PRECEDING
              );
            });

            const newDescendant = {
              ...rest,
              element,
              index,
            } as DescendantType;

            if (index === -1) {
              newDescendants = [...descendants, newDescendant];
            } else {
              newDescendants = [
                ...descendants.slice(0, index),
                newDescendant,
                ...descendants.slice(index),
              ];
            }
          }
          return newDescendants.map((descendant, index) => ({
            ...descendant,
            index,
          }));
        });
      },
      [set]
    );

  const unregisterDescendant: DescendantContextValue<DescendantType>["unregisterDescendant"] =
    useCallback(
      (element) => {
        if (!element) {
          return;
        }

        set((items) => items.filter((item) => element !== item.element));
      },
      [set]
    );

  return (
    <Ctx.Provider
      value={useMemo(() => {
        return {
          descendants,
          registerDescendant,
          unregisterDescendant,
        };
      }, [descendants, registerDescendant, unregisterDescendant])}
    >
      {children}
    </Ctx.Provider>
  );
}

function useDescendantKeyDown<
  DescendantType extends Descendant,
  K extends keyof DescendantType = keyof DescendantType
>(
  context: Context<DescendantContextValue<DescendantType>>,
  options: {
    currentIndex: number | null | undefined;
    key?: K | "option";
    filter?: (descendant: DescendantType) => descendant is DescendantType;
    orientation?: "vertical" | "horizontal" | "both";
    rotate?: boolean;
    rtl?: boolean;
    callback(nextOption: DescendantType | DescendantType[K]): void;
  }
) {
  const { descendants } = useContext(context);
  const {
    callback,
    currentIndex,
    filter,
    key = "index" as K,
    orientation = "vertical",
    rotate = true,
    rtl = false,
  } = options;

  return function handleKeyDown<E extends HTMLElement = HTMLElement>(
    event: KeyboardEvent<E>
  ) {
    if (
      ![
        "ArrowDown",
        "ArrowUp",
        "ArrowLeft",
        "ArrowRight",
        "PageUp",
        "PageDown",
        "Home",
        "End",
      ].includes(event.key)
    ) {
      return;
    }

    let index = currentIndex ?? -1;

    // If we use a filter function, we need to re-index our descendants array
    // so that filtered descendent elements aren't selected.
    const selectableDescendants = filter
      ? descendants.filter(filter)
      : descendants;

    // Current index should map to the updated array vs. the original
    // descendants array.
    if (filter) {
      index = selectableDescendants.findIndex(
        (descendant) => descendant.index === currentIndex
      );
    }

    // We need some options for any of this to work!
    if (!selectableDescendants.length) {
      return;
    }

    function getNextOption() {
      const atBottom = index === selectableDescendants.length - 1;
      return atBottom
        ? rotate
          ? getFirstOption()
          : selectableDescendants[index]
        : selectableDescendants[(index + 1) % selectableDescendants.length];
    }

    function getPreviousOption() {
      const atTop = index === 0;
      return atTop
        ? rotate
          ? getLastOption()
          : selectableDescendants[index]
        : selectableDescendants[
            (index - 1 + selectableDescendants.length) %
              selectableDescendants.length
          ];
    }

    function getFirstOption() {
      return selectableDescendants[0];
    }

    function getLastOption() {
      return selectableDescendants[selectableDescendants.length - 1];
    }

    switch (event.key) {
      case "ArrowDown":
        if (orientation === "vertical" || orientation === "both") {
          event.preventDefault();
          const next = getNextOption();
          callback(key === "option" ? next : next[key]);
        }
        break;
      case "ArrowUp":
        if (orientation === "vertical" || orientation === "both") {
          event.preventDefault();
          const prev = getPreviousOption();
          callback(key === "option" ? prev : prev[key]);
        }
        break;
      case "ArrowLeft":
        if (orientation === "horizontal" || orientation === "both") {
          event.preventDefault();
          const nextOrPrev = (rtl ? getNextOption : getPreviousOption)();
          callback(key === "option" ? nextOrPrev : nextOrPrev[key]);
        }
        break;
      case "ArrowRight":
        if (orientation === "horizontal" || orientation === "both") {
          event.preventDefault();
          const prevOrNext = (rtl ? getPreviousOption : getNextOption)();
          callback(key === "option" ? prevOrNext : prevOrNext[key]);
        }
        break;
      case "PageUp":
        event.preventDefault();
        const prevOrFirst = (
          event.ctrlKey ? getPreviousOption : getFirstOption
        )();
        callback(key === "option" ? prevOrFirst : prevOrFirst[key]);
        break;
      case "Home":
        event.preventDefault();
        const first = getFirstOption();
        callback(key === "option" ? first : first[key]);
        break;
      case "PageDown":
        event.preventDefault();
        const nextOrLast = (event.ctrlKey ? getNextOption : getLastOption)();
        callback(key === "option" ? nextOrLast : nextOrLast[key]);
        break;
      case "End":
        event.preventDefault();
        const last = getLastOption();
        callback(key === "option" ? last : last[key]);
        break;
    }
  };
}

export type { Descendant, DescendantContextValue };
export {
  createDescendantContext,
  DescendantProvider,
  useDescendant,
  useDescendantKeyDown,
  useDescendants,
  useDescendantsInit,
};
