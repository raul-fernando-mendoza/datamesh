import unittest
import json
import logging
import snowflake.connector

import datamesh_flask.snowflake_odbc as snowflake_odbc
import os
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization

# 1. Fetch your string from environment variables
private_key_str = os.environ.get("SNOWFLAKE_PRIVATE_KEY")
#private_key_str ="-----BEGIN ENCRYPTED PRIVATE KEY-----abc\n-----END ENCRYPTED PRIVATE KEY-----\n"
private_key_passphrase = os.environ.get("PRIVATE_KEY_PASSPHRASE")

# 2. Convert the string to bytes and deserialize it
private_key_bytes = private_key_str.encode("utf-8")
private_key_object = serialization.load_pem_private_key(
    private_key_bytes,
    password=private_key_passphrase.encode("utf-8"),  # Use None if unencrypted
    backend=default_backend(),
)    

class TestFireStore(unittest.TestCase):
    
     

    

    def test01_testdatabase(self):
        print("hello")
        
              
        conn = snowflake.connector.connect(
            type= "snowflake",
            account= "twentyfourhourfit.east-us-2.azure",
            user= "DA_DBT_PRD_SVC_KEY",
            role= "TRANSFORMER_PRD_ADMIN",
            private_key=private_key_object,
            private_key_passphrase= private_key_passphrase,
            database= "PLANNING_PRD",
            warehouse= "LOAD_WH",
            schema= "DA_FIN",
            threads= "1",
            client_session_keep_alive= "False",
            query_tag= "daily" 
        )
   
        print("using session:" + str(conn)) 
        
        #sql = "use warehouse LOAD_WH"    
        #result = snowflake_odbc.executeSql(conn, sql)
        #print(result)

        sql = "select * from dual"    
        return snowflake_odbc.executeSql(conn, sql)
            
        conn.close()
        
if __name__ == '__main__': 
    unittest.main()        