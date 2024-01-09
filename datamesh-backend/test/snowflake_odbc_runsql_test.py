import unittest
import json
import logging
import firebase_admin
firebase_admin.initialize_app( )
import datamesh_flask.bsnrules as bsnrules

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        print("hello")
        req = {
            "sql":"select 'hola' ",
            "connectionId":"d6e07195-73d6-4702-a22f-e09adfbd088d"
        }
        res = bsnrules.executeSql(req)      
        print(json.dumps({"result":res}, indent=1))
              
        
if __name__ == '__main__': 
    unittest.main()        