import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const pawRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const paw = pawRef.current;

    if (!cursor || !paw) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const move = (e: MouseEvent) => {
      if (!cursor) return;

      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.style.opacity = "1";
    };

    const hide = () => {
      if (cursor) cursor.style.opacity = "0";
    };

    const down = () => {
      if (paw) paw.style.transform = "scale(0.85)";
    };

    const up = () => {
      if (paw) paw.style.transform = "scale(1)";
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    document.addEventListener("mouseleave", hide);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.removeEventListener("mouseleave", hide);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed left-0 top-0 z-[99999] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150"
    >
      <img
        ref={pawRef}
        src="/images/cursor.png"
        alt=""
        draggable={false}
        className="h-[120px] w-[120px] select-none object-contain transition-transform duration-100"
      />
    </div>
  );
}
