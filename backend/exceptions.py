from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(self, detail: str, status_code: int):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class ObjectNotFoundException(AppException):
    def __init__(self, detail: str = "Object not found"):
        super().__init__(detail=detail, status_code=404)


class BadRequestException(AppException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(detail=detail, status_code=400)


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(detail=detail, status_code=401)


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(detail=detail, status_code=403)


def register_exception_handlers(app: FastAPI):
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
