import unittest
import json
import logging
import firebase_admin
firebase_admin.initialize_app( )
from datamesh_flask.datamesh_credentials import getCredentials
import datamesh_flask.snowflake_odbc as snowflake_odbc

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        print("hello")
        data = {
            "sql":"select 'hola' ",
            "connectionname":"DA_DBT_DEV_SVC"
        }
        res = snowflake_odbc.executeSql(data)      
        print(json.dumps({"result":res}, indent=1))
              
        
if __name__ == '__main__': 
    unittest.main()        