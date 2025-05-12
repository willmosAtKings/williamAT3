from sqlalchemy import create_engine
from sqlalchemy import MetaData, Table, Column, Integer, String

metadata = MetaData() # box that provides info for each column of table
engine = create_engine("sqlite:///app.db", echo=True) #'echo=True' logs all sql queries

users_table = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String, nullable=False),
    Column("email", String),
)