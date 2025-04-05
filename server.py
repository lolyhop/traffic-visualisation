from datetime import datetime
from dataclasses import dataclass
from typing import Tuple, Dict, Any, List

from flask import Flask, request, jsonify
from flask_cors import CORS

from settings import settings


@dataclass(kw_only=True)
class NetworkPackage:
    """Represents a network package."""

    ip_address: str
    coordinates: Tuple[float, float]
    timestamp: datetime
    suspicious_mask: bool

    def serialize(self) -> Dict[str, str]:
        return {
            "ip_address": self.ip_address,
            "latitude": self.coordinates[0],
            "longitude": self.coordinates[1],
            "timestamp": self.timestamp.isoformat(),
            "suspicious_mask": self.suspicious_mask,
        }

    @classmethod
    def deserialize(cls, data: Dict[str, Any]) -> "NetworkPackage":
        return cls(
            ip_address=data["ip_address"],
            coordinates=(data["latitude"], data["longitude"]),
            timestamp=datetime.fromisoformat(data["timestamp"]),
            suspicious_mask=data["suspicious_mask"],
        )


@dataclass(kw_only=True)
class ResponseModel:
    """Response model for API endpoints."""

    status: int
    message: str
    data: Any = None

    def to_dict(self) -> Dict[str, Any]:
        return {"status": self.status, "message": self.message, "data": self.data}


app = Flask(__name__)
CORS(app)

received_packages: List[NetworkPackage] = []


@app.route("/receive", methods=["POST"])
async def receive_data():
    data: str = request.get_json()
    if data:
        received_packages.append(NetworkPackage.deserialize(data))
        response = ResponseModel(status=200, message="Data received successfully")
        return jsonify(response.to_dict()), response.status
    response = ResponseModel(status=400, message="Invalid data format")
    return jsonify(response.to_dict()), response.status


@app.route("/get_data", methods=["GET"])
async def get_data():
    response = ResponseModel(
        status=200,
        message="Data retrieved successfully",
        data=[package.serialize() for package in received_packages],
    )
    return jsonify(response.to_dict()), response.status


if __name__ == "__main__":
    app.run(host=settings.sender_address, port=settings.server_port)
