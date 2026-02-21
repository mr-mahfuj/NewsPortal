

from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()


MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client["news-portal"]
users_collection = db["users"]
news_collection = db["news"]


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def seed_users():
    """Seed initial users"""
    print("Seeding users...")
    
    
    users_collection.delete_many({})
    
    
    admin_pass = pwd_context.hash("admin123")
    user_pass = pwd_context.hash("pass123")
    
    users = [
        {
            "username": "admin",
            "email": "admin@newsportal.com",
            "password": admin_pass,
            "full_name": "Admin User",
            "created_at": datetime.utcnow()
        },
        {
            "username": "john_doe",
            "email": "john@example.com",
            "password": user_pass,
            "full_name": "John Doe",
            "created_at": datetime.utcnow()
        },
        {
            "username": "jane_smith",
            "email": "jane@example.com",
            "password": user_pass,
            "full_name": "Jane Smith",
            "created_at": datetime.utcnow()
        }
    ]
    
    result = users_collection.insert_many(users)
    print(f"✓ Inserted {len(result.inserted_ids)} users")
    return result.inserted_ids

def seed_news(user_ids):
    """Seed initial news articles"""
    print("Seeding news articles...")
    
    
    news_collection.delete_many({})
    
    news_articles = [
        {
            "title": "Breaking: AI Revolutionizes Software Development",
            "content": "Artificial Intelligence is transforming the way developers write code. New AI-powered tools are helping programmers write more efficient and bug-free code faster than ever before. This technology is expected to reshape the entire software development industry in the coming years.",
            "category": "Technology",
            "image_url": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
            "author_id": str(user_ids[0]),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Climate Change: Nations Commit to Carbon Neutrality",
            "content": "World leaders have announced ambitious new commitments to achieve carbon neutrality by 2050. The unprecedented agreement involves major economies pledging to reduce greenhouse gas emissions and invest in renewable energy infrastructure.",
            "category": "Environment",
            "image_url": "https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=800",
            "author_id": str(user_ids[1]),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Stock Markets Reach New Highs Amid Economic Recovery",
            "content": "Global stock markets have surged to record levels as economies continue to recover from the pandemic. Investors are optimistic about future growth prospects, with technology and renewable energy sectors leading the rally.",
            "category": "Business",
            "image_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
            "author_id": str(user_ids[2]),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Breakthrough in Quantum Computing Announced",
            "content": "Scientists have achieved a major milestone in quantum computing, demonstrating quantum advantage in solving complex problems. This breakthrough could revolutionize fields from cryptography to drug discovery.",
            "category": "Science",
            "image_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
            "author_id": str(user_ids[0]),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Space Tourism Takes Flight with First Commercial Mission",
            "content": "The era of space tourism has officially begun as the first fully commercial space mission successfully launched. Passengers experienced weightlessness and breathtaking views of Earth from orbit.",
            "category": "Science",
            "image_url": "https://images.unsplash.com/photo-1516849677043-ef67c9557e16?w=800",
            "author_id": str(user_ids[1]),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "New Study Reveals Benefits of Mediterranean Diet",
            "content": "A comprehensive study has shown that the Mediterranean diet significantly reduces the risk of heart disease and promotes longevity. Researchers recommend incorporating more olive oil, fish, and vegetables into daily meals.",
            "category": "Health",
            "image_url": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
            "author_id": str(user_ids[2]),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    result = news_collection.insert_many(news_articles)
    print(f"✓ Inserted {len(result.inserted_ids)} news articles")

def main():
    """Main seeder function"""
    print("\n🌱 Starting database seeding...\n")
    
    try:
        user_ids = seed_users()
        seed_news(user_ids)
        
        print("\n✅ Database seeded successfully!")
        print("\nDefault credentials:")
        print("  Username: admin | Password: admin123")
        print("  Username: john_doe | Password: pass123")
        print("  Username: jane_smith | Password: pass123\n")
    except Exception as e:
        print(f"\n❌ Error seeding database: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    main()
