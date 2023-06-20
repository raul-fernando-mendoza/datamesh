import unittest
import json
import logging
import snowflake_odbc

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        print("hello")
        data = {
            "sql":"select * from DA_PRD_V1.da_smt.historic_notes_vw limit 10"
        }
        res = snowflake_odbc.executeSql(data)      
        print(json.dumps({"result":res}, indent=1))
              
        
if __name__ == '__main__': 
    unittest.main()        