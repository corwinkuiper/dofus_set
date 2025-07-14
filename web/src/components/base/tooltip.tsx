import { ReactNode, useRef, useState } from "react";
import styled from "styled-components";

interface TooltipProps {
  className?: string;
  children: ReactNode;
  tooltip: ReactNode;
}

const TooltipBox = styled.div<{ $hidden?: boolean }>`
  opacity: 1;
  ${(props) => props.$hidden && "opacity: 0;"}
  position: absolute;
  pointer-events: none;
  transition: opacity 200ms ease-in-out;
`;

export function Tooltip({ className, children, tooltip }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [show, setShow] = useState(false);
  const [mount, setMount] = useState(false);

  const targetRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const updateTooltipPosition = () => {
    setMount(true);

    if (!targetRef.current || !boxRef.current) {
      setShow(false);
      return;
    }
    const body = document.body.getBoundingClientRect();
    const box = targetRef.current.getBoundingClientRect();
    const tip = boxRef.current.getBoundingClientRect();

    let x = box.x + box.width / 2 - tip.width / 2 - body.x;
    let y = box.y - tip.height - body.y;

    x = Math.max(-body.x, Math.min(x, window.innerWidth - tip.width - body.x));
    y = Math.max(
      -body.y,
      Math.min(y, window.innerHeight - tip.height - body.y)
    );

    setPos({ x, y });
    setShow(true);
  };

  const position = pos ? { top: pos.y, left: pos.x } : undefined;

  return (
    <>
      <div
        ref={targetRef}
        className={className}
        onMouseMove={updateTooltipPosition}
        onMouseLeave={() => setShow(false)}
      >
        {children}

        {mount && (
          <TooltipBox
            ref={boxRef}
            style={position}
            $hidden={!show}
            onTransitionEnd={() => {
              if (!show) setMount(false);
            }}
          >
            {tooltip}
          </TooltipBox>
        )}
      </div>
    </>
  );
}
