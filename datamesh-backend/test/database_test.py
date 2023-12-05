import unittest
import json
import logging
from datamesh_flask.datamesh_base import database

log = logging.getLogger("datamesh")

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        
        print(json.dumps({"result":[]}))
       
        request = {
            
        }
        data = database() 
        
        print(json.dumps({"result":data}))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__':
    unittest.main()