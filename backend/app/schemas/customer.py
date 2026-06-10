from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from ._validators import StrippedOptionalStr, StrippedStr


class CustomerBase(BaseModel):
    full_name: StrippedStr = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: StrippedStr = Field(min_length=3, max_length=32)


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    """Partial update — every field is optional; unset fields are left untouched."""

    full_name: StrippedOptionalStr = Field(default=None, min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: StrippedOptionalStr = Field(default=None, min_length=3, max_length=32)


class CustomerRead(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
