import unittest
import json
import logging
import snowpark_base

log = logging.getLogger("datamesh")

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        
        print(json.dumps({"result":[]}))
       
        request = {
            "qry":"select * from da_dw.dim_club"
        }
        data = snowpark_base.getFielsForQuery(request) 
        
        print(json.dumps({"result":data}))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__':
    unittest.main()