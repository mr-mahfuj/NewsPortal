from fastapi import FastAPI, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from mongoengine import connect
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import os
from dotenv import load_dotenv
from exceptions import (
    register_exception_handlers,
    ObjectNotFoundException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
)
from models import User, News, Comment


load_dotenv()

app = FastAPI()
register_exception_handlers(app)


origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware, 
    allow_origins = origins,
    allow_credentials = True, 
    allow_methods = ["*"],
    allow_headers = ["*"],
)


MONGODB_URI = os.getenv("MONGODB_URI")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

connect(db="news-portal", host=MONGODB_URI)


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class NewsCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = "General"
    image_url: Optional[str] = None

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None

class CommentCreate(BaseModel):
    text: str

class CommentResponse(BaseModel):
    id: str
    news_id: str
    user_id: str
    username: str
    full_name: Optional[str]
    text: str
    created_at: datetime

class NewsResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    image_url: Optional[str]
    author_id: str
    author_name: Optional[str]
    created_at: datetime
    updated_at: datetime


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException("Token has expired")
    except jwt.InvalidTokenError:
        raise UnauthorizedException("Invalid token")


def parse_object_id(value: str, field_name: str) -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise BadRequestException(f"Invalid {field_name} id")


def resolve_news_author(news: News) -> Optional[User]:
    if getattr(news, "author", None):
        return news.author

    legacy_author_id = getattr(news, "author_id", None)
    if legacy_author_id:
        try:
            return User.objects(id=ObjectId(str(legacy_author_id))).first()
        except InvalidId:
            return None
    return None


def resolve_comment_user(comment: Comment) -> Optional[User]:
    if getattr(comment, "user", None):
        return comment.user

    legacy_user_id = getattr(comment, "user_id", None)
    if legacy_user_id:
        try:
            return User.objects(id=ObjectId(str(legacy_user_id))).first()
        except InvalidId:
            return None
    return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
    except AttributeError:
        raise UnauthorizedException("Invalid authentication credentials")
    
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Invalid authentication credentials")

    object_id = parse_object_id(user_id, "user")
    user = User.objects(id=object_id).first()
    if user is None:
        raise UnauthorizedException("User not found")
    return user


async def get_current_user_optional(request: Request):
    """Optional authentication - useful for endpoints that work with or without auth"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1]
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id:
            object_id = parse_object_id(user_id, "user")
            return User.objects(id=object_id).first()
    except:
        pass
    return None


@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserRegister):
    
    if User.objects(username=user.username).first():
        raise BadRequestException("Username already registered")
    if User.objects(email=user.email).first():
        raise BadRequestException("Email already registered")
    
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        full_name=user.full_name,
        created_at=datetime.utcnow(),
    ).save()
    
    return {
        "message": "User registered successfully",
        "user_id": str(new_user.id)
    }

@app.post("/login")
def login(user: UserLogin):
    
    db_user = User.objects(username=user.username).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise UnauthorizedException("Invalid credentials")
    
    
    access_token = create_access_token(data={"sub": str(db_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(db_user.id),
            "username": db_user.username,
            "email": db_user.email,
            "full_name": db_user.full_name,
        }
    }

@app.get("/users/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
    }


@app.get("/news")
def get_news():
    news_list = []
    for news in News.objects.order_by("-created_at").select_related(max_depth=1):
        author = resolve_news_author(news)
        news_list.append({
            "id": str(news.id),
            "title": news.title,
            "content": news.content,
            "category": news.category or "General",
            "image_url": news.image_url,
            "author_id": str(author.id) if author else (str(news.author_id) if getattr(news, "author_id", None) else None),
            "author": {
                "id": str(author.id),
                "username": author.username,
                "full_name": author.full_name,
            } if author else None,
            "created_at": news.created_at.isoformat(),
            "updated_at": news.updated_at.isoformat(),
        })
    return news_list

@app.get("/news/{news_id}")
def get_news_by_id(news_id: str):
    object_id = parse_object_id(news_id, "news")
    news = News.objects(id=object_id).first()
    if not news:
        raise ObjectNotFoundException("News not found")

    author = resolve_news_author(news)

    return {
        "id": str(news.id),
        "title": news.title,
        "content": news.content,
        "category": news.category or "General",
        "image_url": news.image_url,
        "author_id": str(author.id) if author else (str(news.author_id) if getattr(news, "author_id", None) else None),
        "author": {
            "id": str(author.id),
            "username": author.username,
            "full_name": author.full_name,
        } if author else None,
        "created_at": news.created_at.isoformat(),
        "updated_at": news.updated_at.isoformat(),
    }

@app.post("/news", status_code=status.HTTP_201_CREATED)
def create_news(news: NewsCreate, current_user: User = Depends(get_current_user)):
    created_news = News(
        title=news.title,
        content=news.content,
        category=news.category,
        image_url=news.image_url,
        author=current_user,
        author_id=str(current_user.id),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    ).save()
    
    return {
        "message": "News created successfully",
        "id": str(created_news.id)
    }

@app.patch("/news/{news_id}")
def update_news(news_id: str, news: NewsUpdate, current_user: User = Depends(get_current_user)):
    object_id = parse_object_id(news_id, "news")
    existing_news = News.objects(id=object_id).first()
    if not existing_news:
        raise ObjectNotFoundException("News not found")

    existing_author = resolve_news_author(existing_news)
    existing_author_id = str(existing_author.id) if existing_author else (str(existing_news.author_id) if getattr(existing_news, "author_id", None) else None)
    if existing_author_id != str(current_user.id):
        raise ForbiddenException("Not authorized to update this news")

    update_data = news.dict(exclude_none=True)
    if update_data:
        for key, value in update_data.items():
            setattr(existing_news, key, value)
        existing_news.updated_at = datetime.utcnow()
        existing_news.save()

    return {"message": "News updated successfully"}

@app.delete("/news/{news_id}")
def delete_news(news_id: str, current_user: User = Depends(get_current_user)):
    object_id = parse_object_id(news_id, "news")
    existing_news = News.objects(id=object_id).first()
    if not existing_news:
        raise ObjectNotFoundException("News not found")

    existing_author = resolve_news_author(existing_news)
    existing_author_id = str(existing_author.id) if existing_author else (str(existing_news.author_id) if getattr(existing_news, "author_id", None) else None)
    if existing_author_id != str(current_user.id):
        raise ForbiddenException("Not authorized to delete this news")

    Comment.objects(news=existing_news).delete()
    Comment.objects(news_id=str(existing_news.id)).delete()
    existing_news.delete()
    return {"message": "News deleted successfully"}



@app.post("/news/{news_id}/comments", status_code=status.HTTP_201_CREATED)
def create_comment(news_id: str, comment: CommentCreate, current_user: User = Depends(get_current_user)):
    news_object_id = parse_object_id(news_id, "news")
    news = News.objects(id=news_object_id).first()
    if not news:
        raise ObjectNotFoundException("News not found")

    created_comment = Comment(
        news=news,
        user=current_user,
        news_id=str(news.id),
        user_id=str(current_user.id),
        username=current_user.username,
        full_name=current_user.full_name,
        text=comment.text,
        created_at=datetime.utcnow(),
    ).save()

    return {
        "message": "Comment created successfully",
        "id": str(created_comment.id),
        "comment": {
            "id": str(created_comment.id),
            "news_id": str(news.id),
            "user_id": str(current_user.id),
            "username": current_user.username,
            "full_name": current_user.full_name,
            "text": created_comment.text,
            "created_at": created_comment.created_at.isoformat(),
        },
    }


@app.get("/news/{news_id}/comments")
def get_news_comments(news_id: str):
    news_object_id = parse_object_id(news_id, "news")
    news = News.objects(id=news_object_id).first()
    if not news:
        raise ObjectNotFoundException("News not found")

    comments = []
    comments_qs = Comment.objects(news=news).order_by("-created_at")
    legacy_comments_qs = Comment.objects(news_id=str(news.id)).order_by("-created_at")

    merged = {}
    for comment in comments_qs:
        merged[str(comment.id)] = comment
    for comment in legacy_comments_qs:
        merged[str(comment.id)] = comment

    sorted_comments = sorted(
        merged.values(),
        key=lambda c: c.created_at or datetime.min,
        reverse=True,
    )

    for comment in sorted_comments:
        comment_user = resolve_comment_user(comment)
        user_id = str(comment_user.id) if comment_user else (str(comment.user_id) if getattr(comment, "user_id", None) else None)
        comments.append({
            "id": str(comment.id),
            "news_id": str(news.id),
            "user_id": user_id,
            "username": comment.username,
            "full_name": comment.full_name,
            "text": comment.text,
            "created_at": comment.created_at.isoformat(),
        })

    return {
        "news_id": news_id,
        "count": len(comments),
        "comments": comments,
    }


@app.delete("/comments/{comment_id}")
def delete_comment(comment_id: str, current_user: User = Depends(get_current_user)):
    comment_object_id = parse_object_id(comment_id, "comment")
    comment = Comment.objects(id=comment_object_id).first()
    if not comment:
        raise ObjectNotFoundException("Comment not found")

    comment_user = resolve_comment_user(comment)
    comment_user_id = str(comment_user.id) if comment_user else (str(comment.user_id) if getattr(comment, "user_id", None) else None)
    if comment_user_id != str(current_user.id):
        raise ForbiddenException("Not authorized to delete this comment")

    comment.delete()
    return {"message": "Comment deleted successfully"}

@app.get("/test")
def testing():
    return {"msg": "backend is running"}