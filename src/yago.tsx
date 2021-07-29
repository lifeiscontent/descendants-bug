import React, { MutableRefObject } from "react";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
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

export { DescendantProvider, useDescendant };
