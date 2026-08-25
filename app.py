import cv2
import mediapipe as mp
import time
import math

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils


def get_finger_states(hand_landmarks, hand_label):
    landmarks = hand_landmarks.landmark
    fingers = []

    # Thumb
    if hand_label == "Right":
        thumb_open = landmarks[4].x < landmarks[3].x
    else:
        thumb_open = landmarks[4].x > landmarks[3].x

    fingers.append(1 if thumb_open else 0)

    # Index, middle, ring and pinky
    finger_tips = [8, 12, 16, 20]
    finger_pips = [6, 10, 14, 18]

    for tip, pip in zip(finger_tips, finger_pips):
        finger_open = landmarks[tip].y < landmarks[pip].y
        fingers.append(1 if finger_open else 0)

    return fingers


def get_distance(point1, point2):
    x1, y1 = point1
    x2, y2 = point2

    return math.sqrt(
        (x2 - x1) ** 2 +
        (y2 - y1) ** 2
    )


def recognize_gesture(fingers, thumb_tip, index_tip):
    pinch_distance = get_distance(
        thumb_tip,
        index_tip
    )

    if pinch_distance < 40:
        return "PINCH"

    if fingers == [1, 1, 1, 1, 1]:
        return "OPEN PALM"

    if fingers == [0, 0, 0, 0, 0]:
        return "FIST"

    if (
        fingers[1] == 1
        and fingers[2] == 0
        and fingers[3] == 0
        and fingers[4] == 0
    ):
        return "POINT"

    return "UNKNOWN"


def is_inside_button(cursor, button):
    cursor_x, cursor_y = cursor

    x1, y1, x2, y2 = button["rect"]

    return (
        x1 <= cursor_x <= x2
        and y1 <= cursor_y <= y2
    )


def draw_button(frame, button, hovered):
    x1, y1, x2, y2 = button["rect"]

    thickness = 4 if hovered else 2

    cv2.rectangle(
        frame,
        (x1, y1),
        (x2, y2),
        (255, 255, 255),
        thickness
    )

    cv2.putText(
        frame,
        button["label"],
        (x1 + 20, y1 + 55),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )


hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

camera = cv2.VideoCapture(0)

previous_time = 0

selected_option = "NONE"

pinch_active = False


buttons = [
    {
        "label": "PROJECTS",
        "rect": (60, 330, 230, 410)
    },
    {
        "label": "AI LAB",
        "rect": (260, 330, 430, 410)
    },
    {
        "label": "ABOUT",
        "rect": (460, 330, 630, 410)
    }
]


while True:
    success, frame = camera.read()

    if not success:
        print("Could not access the camera.")
        break

    frame = cv2.flip(frame, 1)

    frame_height = frame.shape[0]
    frame_width = frame.shape[1]

    rgb_frame = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    results = hands.process(rgb_frame)

    hand_count = 0

    cursor = None

    gesture = "NONE"

    if results.multi_hand_landmarks:
        hand_count = len(
            results.multi_hand_landmarks
        )

        for index, hand_landmarks in enumerate(
            results.multi_hand_landmarks
        ):

            mp_drawing.draw_landmarks(
                frame,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS
            )

            if results.multi_handedness:
                hand_label = (
                    results.multi_handedness[index]
                    .classification[0]
                    .label
                )

                hand_score = (
                    results.multi_handedness[index]
                    .classification[0]
                    .score
                )

                finger_states = get_finger_states(
                    hand_landmarks,
                    hand_label
                )

                thumb_x = int(
                    hand_landmarks.landmark[4].x
                    * frame_width
                )

                thumb_y = int(
                    hand_landmarks.landmark[4].y
                    * frame_height
                )

                index_x = int(
                    hand_landmarks.landmark[8].x
                    * frame_width
                )

                index_y = int(
                    hand_landmarks.landmark[8].y
                    * frame_height
                )

                thumb_tip = (
                    thumb_x,
                    thumb_y
                )

                index_tip = (
                    index_x,
                    index_y
                )

                cursor = index_tip

                gesture = recognize_gesture(
                    finger_states,
                    thumb_tip,
                    index_tip
                )

                wrist_x = int(
                    hand_landmarks.landmark[0].x
                    * frame_width
                )

                wrist_y = int(
                    hand_landmarks.landmark[0].y
                    * frame_height
                )

                cv2.putText(
                    frame,
                    f"{hand_label} {hand_score:.2f}",
                    (wrist_x, wrist_y - 20),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    2
                )

                cv2.circle(
                    frame,
                    cursor,
                    12,
                    (255, 255, 255),
                    -1
                )

                cv2.line(
                    frame,
                    thumb_tip,
                    index_tip,
                    (255, 255, 255),
                    2
                )

    hovered_button = None

    if cursor:
        for button in buttons:
            hovered = is_inside_button(
                cursor,
                button
            )

            if hovered:
                hovered_button = button

            draw_button(
                frame,
                button,
                hovered
            )
    else:
        for button in buttons:
            draw_button(
                frame,
                button,
                False
            )

    # Detect a new pinch event
    if gesture == "PINCH":
        if not pinch_active:

            pinch_active = True

            if hovered_button:
                selected_option = (
                    hovered_button["label"]
                )

                print(
                    f"Selected: {selected_option}"
                )

    else:
        pinch_active = False

    current_time = time.time()

    if previous_time != 0:
        fps = 1 / (
            current_time - previous_time
        )
    else:
        fps = 0

    previous_time = current_time

    cv2.putText(
        frame,
        "GESTUREVISION",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 255, 255),
        2
    )

    cv2.putText(
        frame,
        f"Hands: {hand_count}",
        (20, 75),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )

    cv2.putText(
        frame,
        f"FPS: {int(fps)}",
        (20, 100),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )

    cv2.putText(
        frame,
        f"Gesture: {gesture}",
        (20, 135),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2
    )

    cv2.putText(
        frame,
        f"Selected: {selected_option}",
        (20, 180),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )

    cv2.putText(
        frame,
        "Point to a button and pinch to select",
        (20, 220),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )

    cv2.imshow(
        "GestureVision - Interactive Playground",
        frame
    )

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


camera.release()
hands.close()
cv2.destroyAllWindows()