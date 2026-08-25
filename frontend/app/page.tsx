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

        /*
         * 1. Move gesture cursor
         */
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

          /*
           * Cursor appearance
           */
          if (
            gesture === "PINCH"
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
           * 2. Detect interactive DOM element
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

        /*
         * 4. React status
         * only ~10 updates/sec
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
        {/* HEADER */}
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

        {/* CAMERA + STATUS */}
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
            {/* STATUS */}
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

            {/* CONTROLS */}
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

        {/* PLAYGROUND */}
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
          gesture={status.gesture}
          hand={status.hand}
          fps={status.fps}
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

/*
 * ============================
 * AI LAB
 * ============================
 */

function AiLab({
  gesture,
  hand,
  fps,
  hovered,
  onClose,
}: {
  gesture: string;
  hand: string;
  fps: number;
  hovered: boolean;
  onClose: () => void;
}) {
  const orbScale =
    getOrbScale(
      gesture
    );

  const orbLabel =
    getOrbLabel(
      gesture
    );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#030712]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        {/* LAB HEADER */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.35em] text-cyan-400">
              GESTUREVISION
            </p>

            <h2 className="mt-2 text-3xl font-bold md:text-5xl">
              AI Lab
            </h2>

            <p className="mt-3 max-w-xl text-zinc-400">
              Real-time visual
              interaction driven by
              computer vision.
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

        {/* LAB BODY */}
        <div className="mt-10 grid flex-1 gap-6 lg:grid-cols-[2fr_1fr]">
          {/* ORB AREA */}
          <section className="relative flex min-h-[500px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/30">
            {/* Grid */}
            <div
              className="
                absolute
                inset-0
                opacity-20
                [background-image:linear-gradient(rgba(34,211,238,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.15)_1px,transparent_1px)]
                [background-size:40px_40px]
              "
            />

            {/* Glow */}
            <div className="absolute h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

            {/* Orb */}
            <div
              className="
                relative
                flex
                h-52
                w-52
                items-center
                justify-center
                rounded-full
                border
                border-cyan-300/60
                bg-cyan-400/10
                shadow-[0_0_80px_rgba(34,211,238,0.35)]
                transition-transform
                duration-300
                ease-out
              "
              style={{
                transform:
                  `scale(${orbScale})`,
              }}
            >
              <div
                className="
                  absolute
                  inset-6
                  rounded-full
                  border
                  border-cyan-300/30
                "
              />

              <div className="relative text-center">
                <p className="text-xs tracking-[0.25em] text-cyan-300">
                  AI RESPONSE
                </p>

                <p className="mt-3 text-xl font-semibold">
                  {orbLabel}
                </p>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 text-sm text-zinc-500">
              Gesture-driven visual
              feedback
            </div>
          </section>

          {/* TELEMETRY */}
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

              <div className="mt-8 space-y-5">
                <StatusItem
                  label="Hand"
                  value={hand}
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
                  label="Mode"
                  value="Real-time"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs tracking-[0.3em] text-cyan-400">
                EXPERIMENT
              </p>

              <div className="mt-5 space-y-4 text-sm">
                <GestureInstruction
                  gesture="✋"
                  name="Open Palm"
                  action="Expand orb"
                  active={
                    gesture ===
                    "OPEN PALM"
                  }
                />

                <GestureInstruction
                  gesture="✊"
                  name="Fist"
                  action="Contract orb"
                  active={
                    gesture ===
                    "FIST"
                  }
                />

                <GestureInstruction
                  gesture="☝"
                  name="Point"
                  action="Tracking mode"
                  active={
                    gesture ===
                    "POINT"
                  }
                />

                <GestureInstruction
                  gesture="🤏"
                  name="Pinch"
                  action="Selection mode"
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

/*
 * ============================
 * HELPERS
 * ============================
 */

function getOrbScale(
  gesture: string
) {
  switch (gesture) {
    case "OPEN PALM":
      return 1.35;

    case "FIST":
      return 0.7;

    case "PINCH":
      return 0.9;

    case "POINT":
      return 1.05;

    default:
      return 1;
  }
}

function getOrbLabel(
  gesture: string
) {
  switch (gesture) {
    case "OPEN PALM":
      return "EXPANDING";

    case "FIST":
      return "CONTRACTING";

    case "POINT":
      return "TRACKING";

    case "PINCH":
      return "SELECTING";

    default:
      return "WAITING";
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
              border-cyan-300/60
              bg-cyan-400/10
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

/*
 * ============================
 * SHARED COMPONENTS
 * ============================
 */

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