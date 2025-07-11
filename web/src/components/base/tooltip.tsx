import { ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

interface TooltipProps {
  className?: string;
  children: ReactNode;
  tooltip: ReactNode;
}

const TooltipBox = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  top: ${(props) => props.$y};
  left: ${(props) => props.$x};
`;

export function Tooltip({ className, children, tooltip }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <div
        className={className}
        onMouseMove={(evt) => setPos({ x: evt.clientX, y: evt.clientY })}
        onMouseLeave={() => setPos(null)}
      >
        {children}
      </div>
      {pos &&
        createPortal(
          <TooltipBox $x={pos.x} $y={pos.y}>
            {tooltip}
          </TooltipBox>,
          document.body
        )}
    </>
  );
}
