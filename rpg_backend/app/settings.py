from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "RPG FastAPI Backend"
    database_url: str = "sqlite+aiosqlite:///./rpg.db"
    gemini_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
