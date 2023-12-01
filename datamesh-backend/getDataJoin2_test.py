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
    "leftQry": """
        select subscription_src_num, subscription_version, subscription_status from dim_subscription_new where subscription_src_num = '00942908653' and subscription_version in (1)    
    """,
    "rightQry": """
        select subscription_src_num, subscription_version, subscription_status from dim_subscription_new where subscription_src_num = '00942908653' and subscription_version in (2)
    """,      
    "leftPorts": [
        {
            "datatype": "StringType()",
            "name": "SUBSCRIPTION_SRC_NUM"
        },
        {
            "datatype": "LongType()",
            "name": "SUBSCRIPTION_VERSION"
        },
        {
            "name": "SUBSCRIPTION_STATUS",
            "datatype": "StringType()"
        }
    ],
    "rightPorts": [
        {
            "datatype": "StringType()",
            "name": "SUBSCRIPTION_SRC_NUM"
        },
        {
            "datatype": "LongType()",
            "name": "SUBSCRIPTION_VERSION"
        },
        {
            "name": "SUBSCRIPTION_STATUS",
            "datatype": "StringType()"
        }
    ],
    "joinColumns": [
        "SUBSCRIPTION_SRC_NUM"
    ],
    "filter": ""
}
        
        data = snowpark_base.executeJoin(request) 
        
        #print(json.dumps({"result":data}, indent=1))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__': 
    unittest.main()