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
            "leftQry":"select * from im_prd.dw_24hr.MEMSTATS_ACCOUNT_LIST where ACCOUNT_NUM in ('901227','901231')",
            "rightQry":"select * from da_prd_v1.da_mem.MEMSTATS_ACCOUNT_LIST where ACCOUNT_NUM in ('901227','901231')",
            "leftColumns":[
                {
                    'name':'ACCOUNT_NUM',
                    'alias':'ACCOUNT_NUM'
                },
                {
                    'name':'ACCOUNT_SHORT_DESC',
                    'alias':'ACCOUNT_SHORT_DESC'
                }
            ],
            "rightColumns":[
                {
                    "name":"ACCOUNT_NUM"
                    ,"alias":"ACCOUNT_NUM_1"
                },
                {
                    "name":"ACCOUNT_SHORT_DESC"
                    ,"alias":"DA_ACCOUNT_SHORT_DESC_1"
                }
            ],
            "joinColumns":["ACCOUNT_NUM"],
            "filter":"nvl(ACCOUNT_SHORT_DESC,'') != nvl(DA_ACCOUNT_SHORT_DESC_1,'')"
            
        }
        f = request["leftColumns"][0]["name"]
        data = snowpark_base.executeJoin(request) 
        
        #print(json.dumps({"result":data}, indent=1))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__': 
    unittest.main()