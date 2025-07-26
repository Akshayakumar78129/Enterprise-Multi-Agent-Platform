import os
import sqlite3

def connect_inventory_db():
    db_path = os.path.join(os.path.dirname(os.path.dirname((os.path.abspath(__file__)))), "database", "inventory.db")
    conn = sqlite3.connect(db_path)
    return conn


