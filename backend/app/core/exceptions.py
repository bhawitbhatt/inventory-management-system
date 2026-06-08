class BusinessError(Exception):
    """Base class for domain-level errors that map to HTTP responses."""

    status_code: int = 400

    def __init__(self, message: str, status_code: int | None = None) -> None:
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        super().__init__(message)


class NotFoundError(BusinessError):
    status_code = 404


class ConflictError(BusinessError):
    status_code = 409


class ValidationError(BusinessError):
    status_code = 422
