import time
import random
import requests
from typing import Dict, Any
from datetime import datetime
import os
import threading

import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS

from settings import settings

app = Flask(__name__)
CORS(app)

data: pd.DataFrame = pd.read_csv("ip_addresses.csv")
sending_thread = None
stop_sending = False
thread_lock = threading.Lock()


def send_data() -> None:
    global stop_sending
    with thread_lock:
        stop_sending = False

    current_time: int = int(time.time())
    first_timestamp: int = data["Timestamp"].iloc[0]
    initial_delay: int = first_timestamp - current_time

    if (initial_delay) > 0:
        time.sleep(initial_delay)

    server_url = os.getenv(
        "SERVER_URL", f"http://{settings.server_address}:{settings.server_port}"
    )

    for i in range(len(data) - 1):
        with thread_lock:
            if stop_sending:
                print("Packet sending stopped by user request")
                return

        current_timestamp: int = data["Timestamp"].iloc[i]
        next_timestamp: int = data["Timestamp"].iloc[i + 1]
        delay: int = next_timestamp - current_timestamp

        packet_data: Dict[str, Any] = {
            "ip_address": data.iloc[i]["ip address"],
            "latitude": data.iloc[i]["Latitude"],
            "longitude": data.iloc[i]["Longitude"],
            "timestamp": datetime.fromtimestamp(current_timestamp).isoformat(),
            "suspicious_mask": bool(data.iloc[i]["suspicious"]),
        }

        try:
            response: requests.Response = requests.post(
                f"{server_url}/receive", json=packet_data, timeout=5.0
            )

            if response.status_code == 200:
                print(
                    f"Successfully sent packet to {data['ip address'].iloc[i]} at {datetime.fromtimestamp(current_timestamp)}"
                )
            else:
                print(
                    f"Failed to send packet to {data['ip address'].iloc[i]} at {datetime.fromtimestamp(current_timestamp)}. Status code: {response.status_code}"
                )
                break
        except requests.exceptions.RequestException as e:
            print(f"Error sending packet: {e}")
            break

        time.sleep(delay + random.uniform(0, 0.1))


@app.route("/start_packages_sending", methods=["POST"])
def start_packages_sending():
    global sending_thread, stop_sending

    with thread_lock:
        # Check if already running
        if sending_thread and sending_thread.is_alive():
            return (
                jsonify({"status": "error", "message": "Already sending packages"}),
                400,
            )

        stop_sending = False

    try:
        sending_thread = threading.Thread(target=send_data)
        sending_thread.daemon = True
        sending_thread.start()

        return (
            jsonify({"status": "success", "message": "Started sending packages"}),
            200,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/stop_packages_sending", methods=["POST"])
def stop_packages_sending():
    global stop_sending, sending_thread

    with thread_lock:
        if not sending_thread or not sending_thread.is_alive():
            return (
                jsonify({"status": "error", "message": "No active sending process"}),
                400,
            )

        # Set stop flag
        stop_sending = True

    try:
        sending_thread.join(timeout=2.0)
        if sending_thread.is_alive():
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Failed to stop sending process in time",
                    }
                ),
                500,
            )

        return (
            jsonify({"status": "success", "message": "Stopped sending packages"}),
            200,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host=settings.sender_host, port=settings.sender_port)
