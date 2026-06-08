from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CustomerBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str = Field(min_length=3, max_length=32)

    @field_validator("full_name", "phone", mode="before")
    @classmethod
    def _strip(cls, v):
        return v.strip() if isinstance(v, str) else v


class CustomerCreate(CustomerBase):
    pass


class CustomerRead(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
