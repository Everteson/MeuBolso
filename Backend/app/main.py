from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes.auth import router as auth_router
from app.api.routes.admin import router as admin_router
from app.api.routes.transactions import router as transactions_router
from app.api.routes.stats import router as stats_router


def create_app() -> FastAPI:
    app = FastAPI(title="MeuBolso API")

    os.makedirs(settings.upload_dir, exist_ok=True)

    if settings.cors_origins_list:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins_list,
            allow_credentials=True,
            allow_methods=["*"] ,
            allow_headers=["*"],
        )

    app.include_router(auth_router)
    app.include_router(admin_router)
    app.include_router(transactions_router)
    app.include_router(stats_router)

    @app.get("/health")
    def health():
        return {"ok": True}

    return app


app = create_app()
