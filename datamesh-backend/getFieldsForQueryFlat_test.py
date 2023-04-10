import unittest
import json
import logging
import snowpark_base

log = logging.getLogger("datamesh")

qry2 = {"csvfile": "C:/Users/raul.mendoza/Documents/24hourfit/memstat/integration_test/bimemstats_SF_20230401.txt"}

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        
        print(json.dumps({"result":[]}))
       
        request = {
            "csvfile":"C:/Users/raul.mendoza/Documents/24hourfit/memstat/integration_test/bimemstats_SF_20230404.txt"
        }
        data = snowpark_base.getFielsForQuery(qry2) 
        
        print(json.dumps({"result":data}))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__':
    unittest.main()