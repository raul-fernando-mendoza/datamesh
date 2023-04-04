import unittest
import json
import logging
import snowpark_base
from typing import List, Optional

log = logging.getLogger("datamesh")

class Port:
    fieldName:str
    alias:str

class Request:
    leftQry:str
    rightQry:str
    leftColumns:List[Port]
    rightColumns:List[Port]
    joinColumns:List[str]
    
    

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        
        print(json.dumps({"result":[]}))
       
        request:Request = {
            "leftQry":"select ACCOUNT_NUM, ACCOUNT_SHORT_DESC from im_prd.dw_24hr.MEMSTATS_ACCOUNT_LIST where ACCOUNT_NUM in ('901227','901231')",
            "rightQry":"select  ACCOUNT_NUM, ACCOUNT_SHORT_DESC from da_prd_v1.da_mem.MEMSTATS_ACCOUNT_LIST where ACCOUNT_NUM in ('901227','901231')",
            "leftColumns":[
                {
                    'fieldName':'ACCOUNT_NUM',
                    'alias':'ACCOUNT_NUM'
                },
                {
                    'fieldName':'ACCOUNT_SHORT_DESC',
                    'alias':'ACCOUNT_SHORT_DESC'
                }
            ],
            "rightColumns":[
                {
                    "fieldName":"ACCOUNT_NUM"
                    ,"alias":"ACCOUNT_NUM_1"
                },
                {
                    "fieldName":"ACCOUNT_SHORT_DESC"
                    ,"alias":"DA_ACCOUNT_SHORT_DESC_1"
                }
            ],
            "joinColumns":["ACCOUNT_NUM"]
        }
        f = request["leftColumns"][0]["fieldName"]
        data = snowpark_base.executeJoin(request) 
        
        #print(json.dumps({"result":data}, indent=1))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__': 
    unittest.main()