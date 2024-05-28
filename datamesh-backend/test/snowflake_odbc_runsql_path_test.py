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
            "path":"SqlJupiterDoc/b8d2a095-2bda-4bef-9d56-8130280f43e1/SqlJupiter/34a89c65-ad66-4b5e-b0e4-2c737c1faa97"
        }
        res = bsnrules.executeSqlByPath(req)      
        print(json.dumps({"result":res}, indent=1))
              
        
if __name__ == '__main__': 
    unittest.main()        