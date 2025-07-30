import { useClientValue } from "@/hooks/useClientValue";
import { ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
}

export function ClientOnly({ children }: ClientOnlyProps): ReactNode {
  const isClient = useClientValue(() => true);

  return isClient ? children : null;
}
