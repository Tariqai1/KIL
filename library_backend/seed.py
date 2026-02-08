from sqlalchemy import text
from database import engine

def add_userid_to_logs():
    print("Connecting to database...")
    with engine.connect() as conn:
        try:
            print("Adding 'user_id' column to logs table...")
            # SQL command to add the missing column
            conn.execute(text("ALTER TABLE logs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);"))
            conn.commit()
            print("✅ Success! 'user_id' column added to logs table.")
        except Exception as e:
            print(f"❌ Error: {e}")
            # Agar table hi nahi bani hui to ye error ignore karein, 
            # kyunki jab app chalegi to table khud ban jayegi.

if __name__ == "__main__":
    add_userid_to_logs()