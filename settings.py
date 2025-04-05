import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    server_host: str = os.getenv("SERVER_HOST", "localhost")
    server_port: int = int(os.getenv("SERVER_PORT", "1337"))
    sender_host: str = os.getenv("SENDER_HOST", "localhost")
    sender_port: int = int(os.getenv("SENDER_PORT", "1338"))

    @property
    def server_address(self) -> str:
        server_url = os.getenv("SERVER_URL", "server")
        if "://" in server_url:
            return server_url.split("://")[1].split(":")[0]
        return server_url

    @property
    def sender_address(self) -> str:
        return os.getenv("SENDER_HOST", "localhost")


settings = Settings()
