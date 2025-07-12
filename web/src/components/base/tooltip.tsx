import { ReactNode, useState } from "react";
import styled from "styled-components";

interface TooltipProps {
  className?: string;
  children: ReactNode;
  tooltip: ReactNode;
}

const TooltipBox = styled.div`
  position: absolute;
  pointer-events: none;
`;

export function Tooltip({ className, children, tooltip }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  console.log(pos);

  return (
    <>
      <div
        className={className}
        onMouseMove={(evt) => setPos({ x: evt.pageX, y: evt.pageY })}
        onMouseLeave={() => setPos(null)}
      >
        {children}
        {pos && (
          <TooltipBox style={{ top: pos.y, left: pos.x }}>{tooltip}</TooltipBox>
        )}
      </div>
    </>
  );
}
