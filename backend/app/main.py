from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import init_db
from app.core.exceptions import BusinessError
from app.routers import customers, dashboard, health, orders, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(BusinessError)
    async def _business_error_handler(_: Request, exc: BusinessError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )

    @app.get("/", tags=["meta"])
    def root() -> dict[str, str]:
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs",
        }

    app.include_router(health.router)
    app.include_router(products.router)
    app.include_router(customers.router)
    app.include_router(orders.router)
    app.include_router(dashboard.router)

    return app


app = create_app()
