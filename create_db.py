from sqlalchemy import create_engine
from sqlalchemy import MetaData, Table, Column, Integer, String

metadata = MetaData() # box that provides info for each column of table
engine = create_engine("sqlite:///app.db", echo=True) #'echo=True' logs all sql queries

from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Boolean, ForeignKey, DateTime

engine = create_engine("sqlite:///app.db", echo=True)
metadata = MetaData()

users_table = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(100), nullable=False, unique=True),
    Column("email", String(120), unique=True),
    Column("password", String(200), nullable=False),
    Column("role", String(20), nullable=False),  # 'student', 'teacher', 'admin'
)

events_table = Table(
    "events", metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String(150), nullable=False),
    Column("description", String(300)),
    Column("date", DateTime, nullable=False),
    Column("priority", Integer, default=0),  # 0 = low, 1 = medium, 2 = high
    Column("genre", String(50)),  # e.g. 'sports', 'academic', etc.
    Column("created_by", Integer, ForeignKey("users.id"), nullable=False),
    Column("is_public", Boolean, default=True)  # True = visible to everyone
)
