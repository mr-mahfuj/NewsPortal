from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import os
from dotenv import load_dotenv


load_dotenv()

app = FastAPI()


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


client = MongoClient(MONGODB_URI)
db = client["news-portal"]
users_collection = db["users"]
news_collection = db["news"]
comments_collection = db["comments"]


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
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
    except AttributeError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
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
            return users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        pass
    return None


@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserRegister):
    
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered")
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    
    hashed_password = get_password_hash(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "full_name": user.full_name,
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(user_data)
    
    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
    }

@app.post("/login")
def login(user: UserLogin):
    
    db_user = users_collection.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    
    access_token = create_access_token(data={"sub": str(db_user["_id"])})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(db_user["_id"]),
            "username": db_user["username"],
            "email": db_user["email"],
            "full_name": db_user.get("full_name")
        }
    }

@app.get("/users/me")
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name")
    }


@app.get("/news")
def get_news():
    news_list = []
    for news in news_collection.find().sort("created_at", -1):
        author = users_collection.find_one({"_id": ObjectId(news["author_id"])})
        news_list.append({
            "id": str(news["_id"]),
            "title": news["title"],
            "content": news["content"],
            "category": news.get("category", "General"),
            "image_url": news.get("image_url"),
            "author_id": str(news["author_id"]),
            "author": {
                "id": str(author["_id"]),
                "username": author["username"],
                "full_name": author.get("full_name")
            } if author else None,
            "created_at": news["created_at"].isoformat(),
            "updated_at": news["updated_at"].isoformat()
        })
    return news_list

@app.get("/news/{news_id}")
def get_news_by_id(news_id: str):
    try:
        news = news_collection.find_one({"_id": ObjectId(news_id)})
        if not news:
            raise HTTPException(status_code=404, detail="News not found")
        
        author = users_collection.find_one({"_id": ObjectId(news["author_id"])})
        
        return {
            "id": str(news["_id"]),
            "title": news["title"],
            "content": news["content"],
            "category": news.get("category", "General"),
            "image_url": news.get("image_url"),
            "author_id": str(news["author_id"]),
            "author": {
                "id": str(author["_id"]),
                "username": author["username"],
                "full_name": author.get("full_name")
            } if author else None,
            "created_at": news["created_at"].isoformat(),
            "updated_at": news["updated_at"].isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/news", status_code=status.HTTP_201_CREATED)
def create_news(news: NewsCreate, current_user: dict = Depends(get_current_user)):
    news_data = {
        "title": news.title,
        "content": news.content,
        "category": news.category,
        "image_url": news.image_url,
        "author_id": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = news_collection.insert_one(news_data)
    
    return {
        "message": "News created successfully",
        "id": str(result.inserted_id)
    }

@app.patch("/news/{news_id}")
def update_news(news_id: str, news: NewsUpdate, current_user: dict = Depends(get_current_user)):
    try:
        existing_news = news_collection.find_one({"_id": ObjectId(news_id)})
        if not existing_news:
            raise HTTPException(status_code=404, detail="News not found")
        
        
        if existing_news["author_id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to update this news")
        
        
        update_data = {k: v for k, v in news.dict().items() if v is not None}
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            news_collection.update_one({"_id": ObjectId(news_id)}, {"$set": update_data})
        
        return {"message": "News updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/news/{news_id}")
def delete_news(news_id: str, current_user: dict = Depends(get_current_user)):
    try:
        existing_news = news_collection.find_one({"_id": ObjectId(news_id)})
        if not existing_news:
            raise HTTPException(status_code=404, detail="News not found")
        
        
        if existing_news["author_id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to delete this news")
        
        news_collection.delete_one({"_id": ObjectId(news_id)})
        # Also delete associated comments
        comments_collection.delete_many({"news_id": news_id})
        return {"message": "News deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== COMMENTS ENDPOINTS ====================

@app.post("/news/{news_id}/comments", status_code=status.HTTP_201_CREATED)
def create_comment(news_id: str, comment: CommentCreate, current_user: dict = Depends(get_current_user)):
    try:
        # Verify news exists
        news = news_collection.find_one({"_id": ObjectId(news_id)})
        if not news:
            raise HTTPException(status_code=404, detail="News not found")
        
        # Create comment
        comment_data = {
            "news_id": news_id,
            "user_id": str(current_user["_id"]),
            "username": current_user["username"],
            "full_name": current_user.get("full_name"),
            "text": comment.text,
            "created_at": datetime.utcnow()
        }
        result = comments_collection.insert_one(comment_data)
        
        return {
            "message": "Comment created successfully",
            "id": str(result.inserted_id),
            "comment": {
                "id": str(result.inserted_id),
                "news_id": comment_data["news_id"],
                "user_id": comment_data["user_id"],
                "username": comment_data["username"],
                "full_name": comment_data["full_name"],
                "text": comment_data["text"],
                "created_at": comment_data["created_at"].isoformat()
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/news/{news_id}/comments")
def get_news_comments(news_id: str):
    try:
        # Verify news exists
        news = news_collection.find_one({"_id": ObjectId(news_id)})
        if not news:
            raise HTTPException(status_code=404, detail="News not found")
        
        # Get all comments for this news
        comments = []
        for comment in comments_collection.find({"news_id": news_id}).sort("created_at", -1):
            comments.append({
                "id": str(comment["_id"]),
                "news_id": comment["news_id"],
                "user_id": comment["user_id"],
                "username": comment["username"],
                "full_name": comment.get("full_name"),
                "text": comment["text"],
                "created_at": comment["created_at"].isoformat()
            })
        
        return {
            "news_id": news_id,
            "count": len(comments),
            "comments": comments
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/comments/{comment_id}")
def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    try:
        comment = comments_collection.find_one({"_id": ObjectId(comment_id)})
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        # Verify user is the comment author
        if comment["user_id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
        comments_collection.delete_one({"_id": ObjectId(comment_id)})
        return {"message": "Comment deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/test")
def testing():
    return {"msg": "backend is running"}