from datetime import datetime

from mongoengine import (
    DateTimeField,
    EmailField,
    ReferenceField,
    StringField,
    CASCADE,
    Document,
)


class User(Document):
    username = StringField(required=True, unique=True)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)
    full_name = StringField(null=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "users",
        "indexes": ["username", "email"],
    }


class News(Document):
    title = StringField(required=True)
    content = StringField(required=True)
    category = StringField(default="General")
    image_url = StringField(null=True)
    author = ReferenceField(User, required=False, null=True, reverse_delete_rule=CASCADE)
    author_id = StringField(null=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "news",
        "indexes": ["-created_at", "author", "author_id"],
        "strict": False,
    }


class Comment(Document):
    news = ReferenceField(News, required=False, null=True, reverse_delete_rule=CASCADE)
    user = ReferenceField(User, required=False, null=True, reverse_delete_rule=CASCADE)
    news_id = StringField(null=True)
    user_id = StringField(null=True)
    username = StringField(required=True)
    full_name = StringField(null=True)
    text = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "comments",
        "indexes": ["news", "user", "news_id", "user_id", "-created_at"],
        "strict": False,
    }
