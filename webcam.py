import os
import face_recognition
import cv2
import numpy as np
import time
import threading
import smtplib
from dotenv import load_dotenv
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from ultralytics import YOLO
import signal
import sys

# Global video capture
cap = None

# SIGTERM handler
def signal_handler(sig, frame):
    global cap
    print("🛑 SIGTERM received. Releasing webcam and closing windows.")
    if cap:
        cap.release()
    cv2.destroyAllWindows()
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)

# Load .env variables
load_dotenv()
sender_email = os.getenv("SENDER_EMAIL")
email_password = os.getenv("EMAIL_PASSWORD")

try:
    with open(".receiver_email.txt", "r") as f:
        receiver_email = f.read().strip()
except FileNotFoundError:
    receiver_email = os.getenv("RECEIVER_EMAIL")
    print("⚠ Using email from .env as fallback")

def draw_text_with_background(frame, text, position, font_scale=0.4, color=(255, 255, 255), thickness=1, bg_color=(0, 0, 0), alpha=0.7, padding=5):
    font = cv2.FONT_HERSHEY_SIMPLEX
    text_size = cv2.getTextSize(text, font, font_scale, thickness)[0]
    overlay = frame.copy()
    x, y = position
    cv2.rectangle(overlay, (x - padding, y - text_size[1] - padding), (x + text_size[0] + padding, y + padding), bg_color, -1)
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
    cv2.putText(frame, text, (x, y), font, font_scale, color, thickness)

def send_email_alert(image_path):
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = "Alert: Hardhat Missing!"
    body = "A hardhat was not detected for the past 10 seconds. See the attached image."
    message.attach(MIMEText(body, "plain"))
    with open(image_path, "rb") as attachment:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(attachment.read())
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f"attachment; filename={image_path}")
        message.attach(part)
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, email_password)
            server.sendmail(sender_email, receiver_email, message.as_string())
        print("✅ Email sent.")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

def send_email_in_background(image_path):
    threading.Thread(target=send_email_alert, args=(image_path,)).start()

# Load known faces
def load_known_faces(dataset_dir="Person_Dataset"):
    known_encodings = []
    known_names = []
    for name in os.listdir(dataset_dir):
        person_dir = os.path.join(dataset_dir, name)
        if not os.path.isdir(person_dir):
            continue
        for filename in os.listdir(person_dir):
            filepath = os.path.join(person_dir, filename)
            image = face_recognition.load_image_file(filepath)
            encodings = face_recognition.face_encodings(image)
            if encodings:
                known_encodings.append(encodings[0])
                known_names.append(name)
    return known_encodings, known_names

def main():
    global cap
    model = YOLO("Model/ppe.pt")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Error: Cannot access webcam.")
        return

    known_encodings, known_names = load_known_faces()
    print("📸 Loaded known faces:", known_names)

    cv2.namedWindow("YOLOv8 Annotated Feed", cv2.WINDOW_NORMAL)

    last_email_time = time.time()
    email_sent_flag = False
    email_sent_time = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        hardhat_detected = False
        person_detected = False
        hardhat_count = vest_count = person_count = 0

        results = model(frame)
        face_locations = face_recognition.face_locations(frame)
        face_encodings = face_recognition.face_encodings(frame, face_locations)

        # Match faces
        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.5)
            name = "Unknown"
            face_distances = face_recognition.face_distance(known_encodings, face_encoding)
            if matches:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    name = known_names[best_match_index]
            cv2.rectangle(frame, (left, top), (right, bottom), (255, 255, 0), 2)
            draw_text_with_background(frame, name, (left, top - 10))

        # Object Detection
        for result in results:
            if result.boxes is not None:
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cls = int(box.cls[0])
                    label = f"{model.names[cls]}"
                    if model.names[cls] == "Hardhat":
                        hardhat_detected = True
                        hardhat_count += 1
                    elif model.names[cls] == "Person":
                        person_detected = True
                        person_count += 1
                    elif model.names[cls] == "Safety Vest":
                        vest_count += 1
                    color = (0, 255, 0)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    draw_text_with_background(frame, label, (x1, y1 - 10))

        if person_detected and not hardhat_detected and (time.time() - last_email_time) >= 10:
            image_path = "no_hardhat_frame.jpg"
            cv2.imwrite(image_path, frame)
            send_email_in_background(image_path)
            email_sent_flag = True
            email_sent_time = time.time()
            last_email_time = time.time()

        if email_sent_flag and (time.time() - email_sent_time) < 3:
            draw_text_with_background(frame, "🚨 Email Sent", (frame.shape[1] - 160, 30), color=(0, 255, 0), bg_color=(0, 0, 0))

        info_texts = [f"Hardhats: {hardhat_count}", f"Vests: {vest_count}", f"Persons: {person_count}"]
        for i, txt in enumerate(info_texts):
            draw_text_with_background(frame, txt, (10, 30 + i * 30))

        resized = cv2.resize(frame, (640, 480))
        cv2.imshow("YOLOv8 Annotated Feed", resized)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
