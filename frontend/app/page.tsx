"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import HandTracker, {
  TrackingData,
} from "./HandTracker";

import AiScene from "./AiScene";

type VisionStatus = {
  gesture: string;
  hand: string;
  handsDetected: number;
  fps: number;

  // NEW: hand cursor position
  cursorX: number | null;
  cursorY: number | null;
};

export default function Home() {
  const [status, setStatus] =
    useState<VisionStatus>({
      gesture: "---",
      hand: "---",
      handsDetected: 0,
      fps: 0,

      // NEW
      cursorX: null,
      cursorY: null,
    });

  const [
    hoveredCard,
    setHoveredCard,
  ] = useState<string | null>(
    null
  );

  const [
    selectedCard,
    setSelectedCard,
  ] = useState<string | null>(
    null
  );

  const [
    aiLabOpen,
    setAiLabOpen,
  ] = useState(false);

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

  const smoothXRef =
    useRef<number | null>(
      null
    );

  const smoothYRef =
    useRef<number | null>(
      null
    );

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

        if (
          cursorRef.current &&
          cursorX !== null &&
          cursorY !== null
        ) {
          const smoothingFactor =
            0.28;

          if (
            smoothXRef.current ===
              null ||
            smoothYRef.current ===
              null
          ) {
            smoothXRef.current =
              cursorX;

            smoothYRef.current =
              cursorY;
          } else {
            smoothXRef.current +=
              (
                cursorX -
                smoothXRef.current
              ) *
              smoothingFactor;

            smoothYRef.current +=
              (
                cursorY -
                smoothYRef.current
              ) *
              smoothingFactor;
          }

          const screenX =
            smoothXRef.current *
            window.innerWidth;

          const screenY =
            smoothYRef.current *
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
            gesture !== "PINCH"
          ) {
            pinchActiveRef.current =
              false;
          }
        } else if (
          cursorRef.current
        ) {
          cursorRef.current.style.opacity =
            "0";

          smoothXRef.current =
            null;

          smoothYRef.current =
            null;

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

            // NEW
            cursorX:
              data.cursorX,

            cursorY:
              data.cursorY,
          });
        }
      },
      []
    );

  function handleCardSelection(
    card: string
  ) {
    setSelectedCard(card);

    if (card === "AI Lab") {
      setAiLabOpen(true);
    }

    console.log(
      `GestureVision selected: ${card}`
    );
  }

  function closeAiLab() {
    setAiLabOpen(false);

    setSelectedCard(null);

    setHoveredCard(null);

    hoveredRef.current =
      null;
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* Gesture cursor */}
      <div
        ref={cursorRef}
        className="
          pointer-events-none
          fixed
          left-0
          top-0
          z-[100]
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
        {/* Header */}
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

        {/* Camera + status */}
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
            {/* Live status */}
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

            {/* Controls */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="mb-4 text-xs tracking-[0.3em] text-cyan-400">
                CONTROLS
              </p>

              <div className="space-y-3 text-sm text-zinc-300">
                <p>
                  ☝ Point — Move cursor
                </p>

                <p>
                  🤏 Pinch — Select
                </p>

                <p>
                  ✋ Open Palm — Expand
                </p>

                <p>
                  ✊ Fist — Contract
                </p>
              </div>
            </section>
          </aside>
        </div>

        {/* Playground */}
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

      {/* AI LAB */}
      {aiLabOpen && (
        <AiLab
          gesture={
            status.gesture
          }
          hand={
            status.hand
          }
          handsDetected={
            status.handsDetected
          }
          fps={
            status.fps
          }

          // NEW
          cursorX={
            status.cursorX
          }
          cursorY={
            status.cursorY
          }

          hovered={
            hoveredCard ===
            "Close AI Lab"
          }
          onClose={
            closeAiLab
          }
        />
      )}
    </main>
  );
}

/* ============================
   AI LAB
============================ */

function AiLab({
  gesture,
  hand,
  handsDetected,
  fps,

  // NEW
  cursorX,
  cursorY,

  hovered,
  onClose,
}: {
  gesture: string;
  hand: string;
  handsDetected: number;
  fps: number;

  // NEW
  cursorX: number | null;
  cursorY: number | null;

  hovered: boolean;
  onClose: () => void;
}) {
  const confidence =
    getEstimatedConfidence(
      gesture,
      handsDetected
    );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#030712]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        {/* Lab header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.35em] text-cyan-400">
              GESTUREVISION
            </p>

            <h2 className="mt-2 text-3xl font-bold md:text-5xl">
              AI Lab
            </h2>

            <p className="mt-3 max-w-xl text-zinc-400">
              Real-time computer vision
              inference and gesture-driven
              3D interaction.
            </p>
          </div>

          <button
            data-gesture-clickable="true"
            data-gesture-id="Close AI Lab"
            onClick={onClose}
            className={`
              rounded-xl
              border
              px-5
              py-3
              text-sm
              font-medium
              transition-all
              duration-200

              ${
                hovered
                  ? `
                    scale-105
                    border-cyan-300
                    bg-cyan-400/10
                    shadow-[0_0_25px_rgba(34,211,238,0.25)]
                  `
                  : `
                    border-white/10
                    bg-white/5
                  `
              }
            `}
          >
            CLOSE LAB
          </button>
        </div>

        {/* Lab body */}
        <div className="mt-10 grid flex-1 gap-6 lg:grid-cols-[2fr_1fr]">
          {/* 3D visualization */}
          <section className="relative min-h-[540px] overflow-hidden rounded-3xl border border-white/10 bg-black/30">
            <div
              className="
                pointer-events-none
                absolute
                inset-0
                z-[1]
                opacity-20
                [background-image:linear-gradient(rgba(34,211,238,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.15)_1px,transparent_1px)]
                [background-size:40px_40px]
              "
            />

            <div className="absolute inset-0">
              <AiScene
                gesture={
                  gesture
                }

                // NEW
                cursorX={
                  cursorX
                }
                cursorY={
                  cursorY
                }
              />
            </div>

            <div className="pointer-events-none absolute left-6 top-6 z-10">
              <p className="text-xs tracking-[0.3em] text-cyan-400">
                3D RESPONSE ENGINE
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Gesture:{" "}

                <span className="font-medium text-white">
                  {gesture}
                </span>
              </p>
            </div>

            <div className="pointer-events-none absolute bottom-6 left-6 z-10">
              <p className="text-sm text-zinc-400">
                Real-time gesture driven
                3D visualization
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                React Three Fiber + MediaPipe
              </p>
            </div>

            {gesture ===
              "PINCH" && (
              <div className="pointer-events-none absolute bottom-6 right-6 z-10 rounded-full border border-green-300/30 bg-green-400/10 px-4 py-2 text-xs tracking-[0.2em] text-green-300">
                SELECTION ACTIVE
              </div>
            )}

            {gesture ===
              "POINT" && (
              <div className="pointer-events-none absolute bottom-6 right-6 z-10 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs tracking-[0.2em] text-cyan-300">
                ROTATION MODE
              </div>
            )}
          </section>

          {/* Telemetry */}
          <aside className="flex flex-col gap-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs tracking-[0.3em] text-cyan-400">
                LIVE INFERENCE
              </p>

              <div className="mt-6">
                <p className="text-sm text-zinc-500">
                  Current gesture
                </p>

                <p className="mt-2 break-words text-3xl font-bold">
                  {gesture}
                </p>
              </div>

              {/* Confidence */}
              <div className="mt-7">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">
                    Gesture confidence
                  </span>

                  <span className="text-sm font-medium">
                    {confidence}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                    style={{
                      width:
                        `${confidence}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-zinc-600">
                  Experimental UI score
                </p>
              </div>

              <div className="mt-8 space-y-5">
                <StatusItem
                  label="Hand"
                  value={hand}
                />

                <StatusItem
                  label="Hands"
                  value={String(
                    handsDetected
                  )}
                />

                <StatusItem
                  label="Landmarks"
                  value={
                    handsDetected > 0
                      ? String(
                          21 *
                            handsDetected
                        )
                      : "0"
                  }
                />

                <StatusItem
                  label="FPS"
                  value={String(
                    fps
                  )}
                />

                <StatusItem
                  label="Model"
                  value="MediaPipe"
                />

                <StatusItem
                  label="Renderer"
                  value="Three.js"
                />

                <StatusItem
                  label="Mode"
                  value="Real-time"
                />
              </div>
            </section>

            {/* Experiments */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs tracking-[0.3em] text-cyan-400">
                EXPERIMENT
              </p>

              <div className="mt-5 space-y-4">
                <GestureInstruction
                  gesture="✋"
                  name="Open Palm"
                  action="Expand object"
                  active={
                    gesture ===
                    "OPEN PALM"
                  }
                />

                <GestureInstruction
                  gesture="✊"
                  name="Fist"
                  action="Contract object"
                  active={
                    gesture ===
                    "FIST"
                  }
                />

                <GestureInstruction
                  gesture="☝"
                  name="Point"
                  action="Rotation mode"
                  active={
                    gesture ===
                    "POINT"
                  }
                />

                <GestureInstruction
                  gesture="🤏"
                  name="Pinch"
                  action="Selection pulse"
                  active={
                    gesture ===
                    "PINCH"
                  }
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ============================
   HELPERS
============================ */

function getEstimatedConfidence(
  gesture: string,
  handsDetected: number
) {
  if (
    handsDetected === 0 ||
    gesture === "---"
  ) {
    return 0;
  }

  switch (gesture) {
    case "OPEN PALM":
      return 96;

    case "FIST":
      return 94;

    case "POINT":
      return 93;

    case "PINCH":
      return 97;

    case "UNKNOWN":
      return 55;

    default:
      return 0;
  }
}

function GestureInstruction({
  gesture,
  name,
  action,
  active,
}: {
  gesture: string;
  name: string;
  action: string;
  active: boolean;
}) {
  return (
    <div
      className={`
        flex
        items-center
        gap-4
        rounded-xl
        border
        p-4
        transition-all
        duration-200

        ${
          active
            ? `
              scale-[1.02]
              border-cyan-300/60
              bg-cyan-400/10
              shadow-[0_0_20px_rgba(34,211,238,0.08)]
            `
            : `
              border-white/5
              bg-black/20
            `
        }
      `}
    >
      <div className="text-2xl">
        {gesture}
      </div>

      <div className="flex-1">
        <p className="font-medium">
          {name}
        </p>

        <p className="text-xs text-zinc-500">
          {action}
        </p>
      </div>

      {active && (
        <span className="text-xs font-medium text-cyan-300">
          ACTIVE
        </span>
      )}
    </div>
  );
}

/* ============================
   SHARED COMPONENTS
============================ */

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