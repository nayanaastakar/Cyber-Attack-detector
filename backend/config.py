import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    
    # CORS Settings
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Detection Thresholds
    DDOS_INDEGREE_THRESHOLD: int = 50
    PORT_SCAN_OUTDEGREE_THRESHOLD: int = 30
    WORM_REACHABILITY_THRESHOLD: int = 100
    C2_INDEGREE_MIN_THRESHOLD: int = 10
    C2_OUTDEGREE_MAX_THRESHOLD: int = 5
    
    # Simulation Settings
    DEFAULT_NODE_COUNT: int = 50
    DEFAULT_EDGE_COUNT: int = 150
    
    # WebSocket Settings
    WS_HEARTBEAT_INTERVAL: int = 30
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()
