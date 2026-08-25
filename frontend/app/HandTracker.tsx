"use client";

import { useEffect, useRef, useState } from "react";
import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

export type TrackingData = {
  gesture: string;
  hand: string;
  handsDetected: number;
  fps: number;
  cursorX: number | null;
  cursorY: number | null;
};

type HandTrackerProps = {
  onTrackingFrame: (data: TrackingData) => void;
};

export default function HandTracker({
  onTrackingFrame,
}: HandTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId = 0;
    let running = true;

    let previousTime = performance.now();
    let previousVideoTime = -1;

    async function initialize() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "GPU",
            },

            runningMode: "VIDEO",
            numHands: 2,

            minHandDetectionConfidence: 0.7,
            minHandPresenceConfidence: 0.7,
            minTrackingConfidence: 0.7,
          }
        );

        setModelReady(true);

        stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: 1280,
              height: 720,
            },
            audio: false,
          });

        if (!running) {
          return;
        }

        const video = videoRef.current;

        if (video) {
          video.srcObject = stream;

          await video.play();

          setCameraActive(true);

          detectHands();
        }
      } catch (error) {
        console.error(error);

        setCameraError(
          "Could not start GestureVision. Check camera permissions."
        );
      }
    }

    function detectHands() {
      if (
        !running ||
        !videoRef.current ||
        !canvasRef.current ||
        !handLandmarker
      ) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        animationFrameId =
          requestAnimationFrame(detectHands);

        return;
      }

      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (video.currentTime !== previousVideoTime) {
        previousVideoTime = video.currentTime;

        const now = performance.now();

        const results =
          handLandmarker.detectForVideo(
            video,
            now
          );

        const context =
          canvas.getContext("2d");

        if (context) {
          context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          const drawingUtils =
            new DrawingUtils(context);

          const handsDetected =
            results.landmarks.length;

          let detectedHand = "---";
          let detectedGesture = "---";

          let cursorX: number | null = null;
          let cursorY: number | null = null;

          for (
            let i = 0;
            i < results.landmarks.length;
            i++
          ) {
            const landmarks =
              results.landmarks[i];

            drawingUtils.drawConnectors(
              landmarks,
              HandLandmarker.HAND_CONNECTIONS,
              {
                lineWidth: 3,
              }
            );

            drawingUtils.drawLandmarks(
              landmarks,
              {
                radius: 4,
              }
            );

            if (
              i === 0 &&
              landmarks[8]
            ) {
              const indexTip =
                landmarks[8];

              // Camera is mirrored
              cursorX =
                1 - indexTip.x;

              cursorY =
                indexTip.y;
            }

            if (
              results.handedness[i] &&
              results.handedness[i][0]
            ) {
              detectedHand =
                results.handedness[i][0]
                  .categoryName;
            }

            if (i === 0) {
              detectedGesture =
                recognizeGesture(
                  landmarks
                );
            }
          }

          const currentTime =
            performance.now();

          const delta =
            currentTime -
            previousTime;

          const fps =
            delta > 0
              ? 1000 / delta
              : 0;

          previousTime =
            currentTime;

          onTrackingFrame({
            gesture:
              detectedGesture,
            hand:
              detectedHand,
            handsDetected,
            fps:
              Math.round(fps),
            cursorX,
            cursorY,
          });
        }
      }

      animationFrameId =
        requestAnimationFrame(
          detectHands
        );
    }

    initialize();

    return () => {
      running = false;

      cancelAnimationFrame(
        animationFrameId
      );

      stream
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      handLandmarker?.close();
    };
  }, [onTrackingFrame]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
      />

      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]"
      />

      {!cameraActive &&
        !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
            {modelReady
              ? "Starting camera..."
              : "Loading AI model..."}
          </div>
        )}

      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-400">
          {cameraError}
        </div>
      )}

      {cameraActive && (
        <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-xs backdrop-blur">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-400" />
          AI Vision Active
        </div>
      )}
    </div>
  );
}

function recognizeGesture(
  landmarks: {
    x: number;
    y: number;
    z: number;
  }[]
) {
  const thumbTip =
    landmarks[4];

  const indexTip =
    landmarks[8];

  const pinchDistance =
    Math.sqrt(
      Math.pow(
        thumbTip.x -
          indexTip.x,
        2
      ) +
        Math.pow(
          thumbTip.y -
            indexTip.y,
          2
        )
    );

  if (
    pinchDistance < 0.06
  ) {
    return "PINCH";
  }

  const indexOpen =
    landmarks[8].y <
    landmarks[6].y;

  const middleOpen =
    landmarks[12].y <
    landmarks[10].y;

  const ringOpen =
    landmarks[16].y <
    landmarks[14].y;

  const pinkyOpen =
    landmarks[20].y <
    landmarks[18].y;

  if (
    indexOpen &&
    middleOpen &&
    ringOpen &&
    pinkyOpen
  ) {
    return "OPEN PALM";
  }

  if (
    !indexOpen &&
    !middleOpen &&
    !ringOpen &&
    !pinkyOpen
  ) {
    return "FIST";
  }

  if (
    indexOpen &&
    !middleOpen &&
    !ringOpen &&
    !pinkyOpen
  ) {
    return "POINT";
  }

  return "UNKNOWN";
}