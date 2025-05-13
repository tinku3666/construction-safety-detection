# Construction Safety Detection - Mail Alert (YOLOv8)

This project focuses on enhancing construction site safety through real-time detection of safety gear such as helmets, vests, and masks worn by workers, as well as detecting the presence of a person. The detection is performed using YOLOv8, a state-of-the-art object detection algorithm.

---

## Overview

Construction sites present various safety hazards, and ensuring that workers wear appropriate safety gear is crucial for accident prevention. This project automates the process of safety gear detection using computer vision techniques. By deploying YOLOv8, the system can detect whether a worker is wearing a helmet, a vest, a mask, or all, and identify people in real-time.

---

## Features

- **Helmet Detection:** Detects whether a worker is wearing a helmet.
- **Vest Detection:** Detects whether a worker is wearing a safety vest.
- **Mask Detection:** Detects whether a worker is wearing a mask.
- **Person Detection:** Detects the presence of a person within the construction site.
- **Count Display:** Displays real-time counts of detected helmets, vests, masks, and persons on a sideboard overlay.
- **Email Alerts:** Sends email alerts if a person is detected without a helmet, with a frame of the incident attached.
- **Non-Blocking Email Process:** Ensures video feed remains smooth while email alerts are sent in the background.
- **Mail Sent Notification:** A popup is displayed in the top-right corner of the video feed when an email alert is successfully sent.

---

## Requirements

- Python 3.9
- YOLOv8 dependencies (refer to YOLOv8 documentation for installation instructions)
- OpenCV
- Other dependencies as mentioned in the project code

---

## Installation

### Using `conda` (Recommended)

1. Clone the repository:

    ```bash
    git clone https://github.com/tinku3666/construction-safety-detection.git
    cd Construction-PPE-Detection
    ```

2. Create a conda environment from the `yolo_env.yml` file:

    ```bash
    conda env create -f yolo_env.yml
    ```

3. Activate the environment:

    ```bash
    conda activate yolo
    ```

4. Ensure the YOLOv8 weights file (`ppe.pt`) and place it in the designated directory.

### Using `pip`

1. Clone the repository:

    ```bash
    git clone [https://github.com/tinku3666/construction-safety-detection.git]
    cd Construction-PPE-Detection
    ```

2. Install the dependencies:

    ```bash
    pip install -r requirements.txt
    ```

3. Ensure the YOLOv8 weights file (`ppe.pt`) and place it in the designated directory.

---

## Configuration for Email Alerts

To enable email alert functionality, update the `.env` file in the project directory with your email details:

```text
SENDER_EMAIL=your_email@gmail.com
RECEIVER_EMAIL=receiver_email@example.com
EMAIL_PASSWORD=your_email_password
