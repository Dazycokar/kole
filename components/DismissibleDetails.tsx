"use client";

import { useEffect, useRef } from "react";

export default function DismissibleDetails({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      if (!detailsRef.current?.contains(event.target as Node)) {
        detailsRef.current?.removeAttribute("open");
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.removeAttribute("open");
        detailsRef.current.querySelector("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, []);

  return (
    <details
      ref={detailsRef}
      className={className}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a, button")) {
          detailsRef.current?.removeAttribute("open");
        }
      }}
    >
      {children}
    </details>
  );
}
