"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import HandTracker, {
  TrackingData,
} from "./HandTracker";

type VisionStatus = {
  gesture: string;
  hand: string;
  handsDetected: number;
  fps: number;
};

export default function Home() {
  const [status, setStatus] =
    useState<VisionStatus>({
      gesture: "---",
      hand: "---",
      handsDetected: 0,
      fps: 0,
    });

  const [
    hoveredCard,
    setHoveredCard,
  ] =
    useState<string | null>(
      null
    );

  const [
    selectedCard,
    setSelectedCard,
  ] =
    useState<string | null>(
      null
    );

  const cursorRef =
    useRef<HTMLDivElement>(
      null
    );

  const pinchActiveRef =
    useRef(false);

  const hoveredRef =
    useRef<string | null>(
      null
    );

  const lastStatusUpdateRef =
    useRef(0);

  const handleTrackingFrame =
    useCallback(
      (
        data: TrackingData
      ) => {
        const {
          cursorX,
          cursorY,
          gesture,
        } = data;

        /*
         * 1. Move cursor directly.
         * No React state required.
         */
        if (
          cursorRef.current &&
          cursorX !== null &&
          cursorY !== null
        ) {
          const screenX =
            cursorX *
            window.innerWidth;

          const screenY =
            cursorY *
            window.innerHeight;

          cursorRef.current.style.transform =
            `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%)`;

          cursorRef.current.style.opacity =
            "1";

          if (
            gesture ===
            "PINCH"
          ) {
            cursorRef.current.style.width =
              "24px";

            cursorRef.current.style.height =
              "24px";

            cursorRef.current.style.borderColor =
              "rgb(134 239 172)";

            cursorRef.current.style.backgroundColor =
              "rgb(74 222 128 / 0.4)";
          } else {
            cursorRef.current.style.width =
              "36px";

            cursorRef.current.style.height =
              "36px";

            cursorRef.current.style.borderColor =
              "rgb(103 232 249)";

            cursorRef.current.style.backgroundColor =
              "rgb(34 211 238 / 0.3)";
          }

          /*
           * 2. Find element under
           * gesture cursor.
           */
          const element =
            document.elementFromPoint(
              screenX,
              screenY
            );

          const target =
            element?.closest<HTMLElement>(
              "[data-gesture-clickable='true']"
            );

          const targetId =
            target?.dataset
              .gestureId ??
            null;

          /*
           * Only update React if
           * hovered item changed.
           */
          if (
            targetId !==
            hoveredRef.current
          ) {
            hoveredRef.current =
              targetId;

            setHoveredCard(
              targetId
            );
          }

          /*
           * 3. PINCH = click
           */
          if (
            gesture ===
              "PINCH" &&
            !pinchActiveRef.current
          ) {
            pinchActiveRef.current =
              true;

            if (target) {
              target.click();
            }
          }

          if (
            gesture !==
            "PINCH"
          ) {
            pinchActiveRef.current =
              false;
          }
        } else if (
          cursorRef.current
        ) {
          cursorRef.current.style.opacity =
            "0";

          if (
            hoveredRef.current !==
            null
          ) {
            hoveredRef.current =
              null;

            setHoveredCard(
              null
            );
          }
        }

        /*
         * 4. Update text UI only
         * ~10 times per second.
         */
        const now =
          performance.now();

        if (
          now -
            lastStatusUpdateRef.current >=
          100
        ) {
          lastStatusUpdateRef.current =
            now;

          setStatus({
            gesture:
              data.gesture,
            hand:
              data.hand,
            handsDetected:
              data.handsDetected,
            fps:
              data.fps,
          });
        }
      },
      []
    );

  function handleCardSelection(
    card: string
  ) {
    setSelectedCard(card);

    console.log(
      `GestureVision selected: ${card}`
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">

      <div
        ref={cursorRef}
        className="
          pointer-events-none
          fixed
          left-0
          top-0
          z-50
          h-9
          w-9
          rounded-full
          border-2
          border-cyan-300
          bg-cyan-400/30
          opacity-0
          shadow-[0_0_25px_rgba(34,211,238,0.8)]
          will-change-transform
        "
      />

      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">

        <header className="mb-10">
          <p className="mb-2 text-sm tracking-[0.35em] text-cyan-400">
            COMPUTER VISION EXPERIENCE
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            GestureVision
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            Control an interactive
            interface using real-time
            hand gestures.
          </p>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[2fr_1fr]">

          <section className="rounded-3xl border border-white/10 bg-white/5 p-4">

            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                Live Camera
              </h2>

              <p className="text-sm text-zinc-400">
                MediaPipe hand landmark
                detection
              </p>
            </div>

            <HandTracker
              onTrackingFrame={
                handleTrackingFrame
              }
            />

          </section>

          <aside className="flex flex-col gap-6">

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">

              <p className="mb-5 text-xs tracking-[0.3em] text-cyan-400">
                LIVE STATUS
              </p>

              <div className="space-y-5">

                <StatusItem
                  label="Gesture"
                  value={
                    status.gesture
                  }
                />

                <StatusItem
                  label="Hand"
                  value={
                    status.hand
                  }
                />

                <StatusItem
                  label="Hands Detected"
                  value={String(
                    status.handsDetected
                  )}
                />

                <StatusItem
                  label="FPS"
                  value={String(
                    status.fps
                  )}
                />

                <StatusItem
                  label="Hovering"
                  value={
                    hoveredCard ??
                    "---"
                  }
                />

                <StatusItem
                  label="Selected"
                  value={
                    selectedCard ??
                    "---"
                  }
                />

              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">

              <p className="mb-4 text-xs tracking-[0.3em] text-cyan-400">
                CONTROLS
              </p>

              <div className="space-y-3 text-sm text-zinc-300">
                <p>
                  ☝ Point — Move
                  cursor
                </p>

                <p>
                  🤏 Pinch — Select
                </p>

                <p>
                  ✋ Open Palm —
                  Menu
                </p>

                <p>
                  ✊ Fist — Back
                </p>
              </div>

            </section>

          </aside>

        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">

          <div className="mb-6">

            <p className="text-xs tracking-[0.3em] text-cyan-400">
              INTERACTIVE PLAYGROUND
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Gesture-controlled
              navigation
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Point at a card and
              pinch your thumb and
              index finger to select
              it.
            </p>

          </div>

          <div className="grid gap-4 md:grid-cols-3">

            <PlaygroundCard
              id="Projects"
              title="Projects"
              description="Explore featured development projects."
              hovered={
                hoveredCard ===
                "Projects"
              }
              selected={
                selectedCard ===
                "Projects"
              }
              onClick={() =>
                handleCardSelection(
                  "Projects"
                )
              }
            />

            <PlaygroundCard
              id="AI Lab"
              title="AI Lab"
              description="Experiment with computer vision interactions."
              hovered={
                hoveredCard ===
                "AI Lab"
              }
              selected={
                selectedCard ===
                "AI Lab"
              }
              onClick={() =>
                handleCardSelection(
                  "AI Lab"
                )
              }
            />

            <PlaygroundCard
              id="About"
              title="About"
              description="Learn more about the developer."
              hovered={
                hoveredCard ===
                "About"
              }
              selected={
                selectedCard ===
                "About"
              }
              onClick={() =>
                handleCardSelection(
                  "About"
                )
              }
            />

          </div>

        </section>

      </section>

    </main>
  );
}

function StatusItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-4 last:border-none last:pb-0">

      <span className="text-sm text-zinc-400">
        {label}
      </span>

      <span className="font-medium">
        {value}
      </span>

    </div>
  );
}

function PlaygroundCard({
  id,
  title,
  description,
  hovered,
  selected,
  onClick,
}: {
  id: string;
  title: string;
  description: string;
  hovered: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      data-gesture-clickable="true"
      data-gesture-id={id}
      onClick={onClick}
      className={`
        rounded-2xl
        border
        p-6
        text-left
        transition-all
        duration-200

        ${
          hovered
            ? `
              scale-[1.03]
              border-cyan-300
              bg-cyan-400/10
              shadow-[0_0_30px_rgba(34,211,238,0.2)]
            `
            : `
              border-white/10
              bg-black/20
            `
        }

        ${
          selected
            ? `
              border-green-400
              bg-green-400/10
            `
            : ""
        }
      `}
    >
      <div className="mb-5 flex items-center justify-between">

        <span className="text-xs tracking-[0.2em] text-cyan-400">
          GESTURE TARGET
        </span>

        {selected && (
          <span className="text-xs text-green-400">
            SELECTED
          </span>
        )}

      </div>

      <p className="text-lg font-semibold">
        {title}
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        {description}
      </p>

    </button>
  );
}