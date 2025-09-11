from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class TagCreate(BaseModel):
    name: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "vegan"
            }
        }
    )

class TagOut(BaseModel):
    tag_id: int
    name: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "tag_id": 1,
                "name": "vegan"
            }
        }
    )

class UserTagAssign(BaseModel):
    user_id: int
    tag_id: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 1,
                "tag_id": 3
            }
        }
    )

class UserTagRemove(BaseModel):
    user_id: int
    tag_id: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 1,
                "tag_id": 3
            }
        }
    )

class UserTagsOut(BaseModel):
    user_id: int
    tags: List[TagOut]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 1,
                "tags": [
                    {"tag_id": 1, "name": "vegan"},
                    {"tag_id": 2, "name": "geek"}
                ]
            }
        }
    )
