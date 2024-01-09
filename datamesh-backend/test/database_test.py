import unittest
import json
import logging
import datamesh_flask.bsnrules as bsnrules

import firebase_admin
firebase_admin.initialize_app( )


log = logging.getLogger("datamesh")

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        
        print(json.dumps({"result":[]}))
       
        request = {
            
        }
        data = bsnrules.getDatabaseDetails("c3fe5c67-1a18-4aff-b6ef-5faef9b6b5d2") 
        
        print(json.dumps({"result":data}))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__':
    unittest.main()