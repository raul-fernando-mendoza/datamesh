import unittest
import json
import logging
import datamesh_flask.bsnrules as bsnrules
from typing import List, Optional

import firebase_admin
firebase_admin.initialize_app()

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
            "leftQry":"select ACCOUNT_NUM as ACCOUNT_NUM_IM, ACCOUNT_SHORT_DESC as ACCOUNT_SHORT_DESC_IM from im_prd.dw_24hr.MEMSTATS_ACCOUNT_LIST where ACCOUNT_NUM in ('901227','901231')",
            "left_connectionId":"c3fe5c67-1a18-4aff-b6ef-5faef9b6b5d2",
            "rightQry":"select * from da_prd_v1.da_mem.MEMSTATS_ACCOUNT_LIST where ACCOUNT_NUM in ('901227','901231')",
            "right_connectionId":"c3fe5c67-1a18-4aff-b6ef-5faef9b6b5d2",
            "leftPorts":[
                {
                    'name':'ACCOUNT_NUM_IM',
                    'alias':'ACCOUNT_NUM',
                    "isSelected":True
                },
                {
                    'name':'ACCOUNT_SHORT_DESC_IM',
                    'alias':"ACCOUNT_SHORT_DESC",
                    "isSelected":True
                }
            ],
            "rightPorts":[
                {
                    "name":"ACCOUNT_NUM"
                    ,"alias":"ACCOUNT_NUM"
                    ,"isSelected":True
                },
                {
                    "name":"ACCOUNT_SHORT_DESC"
                    ,"alias":"ACCOUNT_SHORT_DESC"
                    ,"isSelected":True
                }
            ],
            "joinColumns":["ACCOUNT_NUM"],
            "filter":"nvl(ACCOUNT_SHORT_DESC,'') != nvl(ACCOUNT_SHORT_DESC_R,'')"
            
        }
        data = bsnrules.executeJoin(request) 
        
        print(json.dumps({"result":data}, indent=1))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__': 
    unittest.main()