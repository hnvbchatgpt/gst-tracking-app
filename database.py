import pyodbc
import os
from config import Config

# Improved database.py
import pyodbc
import os
from config import Config

class DatabaseConnection:
    def __init__(self):
        self.connection_string = f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={Config.DATABASE_PATH};"
        self.connection = None
    
    def connect(self):
        if self.connection is None:
            try:
                self.connection = pyodbc.connect(self.connection_string)
                return self.connection
            except pyodbc.Error as e:
                print(f"Database connection error: {e}")
                return None
        return self.connection
    
    def disconnect(self):
        if self.connection:
            try:
                self.connection.close()
            except pyodbc.Error:
                pass  # Connection may already be closed
            finally:
                self.connection = None
    
    def execute_non_query(self, query, params=None):
        if not self.connect():
            return False
            
        try:
            cursor = self.connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            affected_rows = cursor.rowcount
            self.connection.commit()
            cursor.close()
            
            # Check if any rows were actually updated
            if affected_rows == 0:
                print(f"Warning: UPDATE query affected 0 rows")
                return False
            
            return True
            
        except pyodbc.Error as e:
            print(f"Non-query execution error: {e}")
            try:
                self.connection.rollback()
            except:
                pass
            return False
        except Exception as e:
            print(f"Unexpected error: {e}")
            return False

    def fetch_one(self, query, params=None):
        if not self.connect():
            return None
            
        try:
            cursor = self.connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
                
            result = cursor.fetchone()
            cursor.close()
            return result
            
        except pyodbc.Error as e:
            print(f"Fetch one error: {e}")
            return None

    def fetch_all(self, query, params=None):
        if not self.connect():
            return []
            
        try:
            cursor = self.connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
                
            result = cursor.fetchall()
            cursor.close()
            return result
            
        except pyodbc.Error as e:
            print(f"Fetch all error: {e}")
            return []

def create_database_tables():
    """Create database tables if they don't exist"""
    db = DatabaseConnection()
    
    if not db.connect():
        print("Could not connect to database")
        return False
    
    try:
        # Create Client Master table - FIXED SYNTAX
        cursor = db.connection.cursor()
        cursor.execute("""
            CREATE TABLE ClientMaster (
                ClientCode COUNTER PRIMARY KEY,
                ClientName TEXT(255) NOT NULL,
                DateOfRegistration DATE NOT NULL,
                EffectiveDateOfCancellation DATE,
                GSTIN TEXT(15) NOT NULL,
                TaxpayerType TEXT(50) NOT NULL,
                GSTPortalUserID TEXT(100) NOT NULL,
                GSTPortalPassword TEXT(100) NOT NULL,
                EWAYBillUserID TEXT(100),
                EWAYBillPassword TEXT(100),
                ClientEmailID TEXT(100) NOT NULL,
                MobileNo TEXT(15) NOT NULL,
                EmailPassword TEXT(100)
            )
        """)
        
        # Create GST Return Data table - FIXED SYNTAX
        cursor.execute("""
            CREATE TABLE GSTReturnData (
                ReturnID COUNTER PRIMARY KEY,
                ClientCode LONG NOT NULL,
                ReturnType TEXT(50) NOT NULL,
                Period TEXT(50) NOT NULL,
                DateOfFiling DATE,
                Status TEXT(50) NOT NULL,
                ARN TEXT(100),
                Remarks TEXT(255)
            )
        """)
        
        db.connection.commit()
        cursor.close()
        print("Database tables created successfully")
        return True
        
    except pyodbc.Error as e:
        print(f"Error creating tables: {e}")
        return False
    finally:
        db.disconnect()
