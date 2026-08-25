# GestureVision

GestureVision is an interactive computer vision experience that allows users to control a web interface using real-time hand gestures through their webcam.

The project combines hand tracking, gesture recognition, interactive navigation, a gesture-controlled precision challenge, and a real-time 3D environment directly in the browser.

## Features

- Real-time webcam hand tracking
- MediaPipe hand landmark detection
- 21-point hand landmark mapping
- Gesture recognition
- Gesture-controlled cursor
- Pinch-based selection
- Open palm scrolling
- Open palm swipe-back navigation
- Gesture Playground precision challenge
- Real-time performance metrics
- Interactive 3D AI Lab
- Responsive interface
- Live tracking status and FPS monitoring

## Supported Gestures

| Gesture                | Action                              |
| ---------------------- | ----------------------------------- |
| Point                  | Move the virtual cursor             |
| Pinch                  | Select elements and interact        |
| Open Palm              | Scroll through the interface        |
| Open Palm + Swipe Left | Navigate back                       |
| Fist                   | Recognized gesture / 3D interaction |

## How It Works

GestureVision processes webcam input through a real-time computer vision pipeline:

Camera → MediaPipe → 21 Hand Landmarks → Gesture Recognition → Interaction Engine → UI / 3D Response

The browser captures the camera feed and MediaPipe detects the user's hand landmarks. GestureVision interprets those landmark positions and converts them into commands that control the interface.

## Gesture Playground

The Gesture Playground provides an interactive precision challenge where users can test gesture control.

Users point to move the virtual cursor and perform a pinch gesture over the target to register a hit.

The challenge tracks:

- Score
- Hits
- Misses
- Accuracy
- Reaction time
- Best reaction time

## AI Lab

The AI Lab demonstrates how recognized gestures can control a real-time 3D environment.

Different gestures modify the behavior of the 3D object, providing immediate visual feedback from the computer vision system.

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Computer Vision

- MediaPipe
- Browser Camera API
- Real-time hand landmark tracking

### 3D

- Three.js
- React Three Fiber
- Drei

### Deployment

- Vercel

## Architecture

```text
Webcam
   ↓
MediaPipe Hand Tracking
   ↓
21 Hand Landmarks
   ↓
Gesture Recognition
   ↓
Interaction Engine
   ↓
┌─────────────────────────────┐
│ UI Navigation               │
│ Gesture Playground          │
│ 3D AI Lab                   │
└─────────────────────────────┘
```

## Getting Started

Clone the repository:

```bash
git clone https://github.com/Dsgalvist/GestureVision.git
cd GestureVision/frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local development URL shown in the terminal and allow camera access when prompted.

## Production Build

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

## Camera Permission

GestureVision requires access to the user's webcam for hand tracking.

Camera processing is used to detect hand landmarks and translate physical hand movements into interface interactions.

## Project Goal

GestureVision explores how computer vision can create alternative human-computer interaction methods without requiring traditional input devices.

The project demonstrates how hand tracking, gesture recognition, real-time UI interaction, and 3D graphics can be combined into a browser-based experience.

## Author

**Diego Galvis**

Software Development  
Calgary, Alberta, Canada

GitHub: Dsgalvist
