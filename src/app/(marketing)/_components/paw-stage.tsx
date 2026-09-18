"use client";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
const PawCanvas = dynamic(() => import("./paw-canvas"), { ssr: false });
class Boundary extends Component<
  { children: ReactNode; onError: () => void },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}
export default function PawStage({ small = false }: { small?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false),
    [visible, setVisible] = useState(false),
    [rendered, setRendered] = useState(false);
  useEffect(() => {
    try {
      const preference = localStorage.getItem("nekonote.stimulus");
      if (preference && ["1", "2", "3"].includes(preference))
        document.documentElement.dataset.stimulus = preference;
    } catch {
      /* System reduced-motion still applies when storage is unavailable. */
    }
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const check = () => {
      setEnabled(
        !mq.matches && document.documentElement.dataset.stimulus !== "1",
      );
      setRendered(false);
    };
    check();
    mq.addEventListener("change", check);
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-stimulus"],
    });
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisible(true);
      },
      { rootMargin: "150px" },
    );
    if (ref.current) io.observe(ref.current);
    return () => {
      mq.removeEventListener("change", check);
      mo.disconnect();
      io.disconnect();
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`paw-stage ${small ? "small-paw" : ""}`}
      aria-label="そっと差し出す猫の手"
      role="img"
    >
      <Image
        src="/models/paw.png"
        alt=""
        fill
        sizes={small ? "300px" : "(max-width: 700px) 90vw, 550px"}
        className={`paw-fallback ${rendered && enabled ? "canvas-ready" : ""}`}
        priority={!small}
      />
      {enabled && visible && (
        <Boundary onError={() => setRendered(false)}>
          <PawCanvas onReady={() => setRendered(true)} small={small} />
        </Boundary>
      )}
    </div>
  );
}
