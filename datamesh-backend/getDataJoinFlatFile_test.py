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
            "leftFile":"C:/Users/raul.mendoza/Documents/24hourfit/memstat/integration_test/bimemstats_SF_20230404.txt",
    "leftPorts": [
        {
            "datatype": "LongType()",
            "name": "ACCOUNT"
        },
        {
            "name": "CLUB",
            "datatype": "StringType()"
        },
        {
            "name": "AMOUNT",
            "datatype": "DecimalType(38, 12)"
        },
        {
            "name": "ACCOUNT_SHORT_DESC",
            "datatype": "StringType()"
        },        
    ],
    "rightQry":"""
  select  to_number(account_id) as ACCOUNT, club_src_num as CLUB, month_id, account_long_desc, sum(round(value,0)) im_value
  from im_prd.dw_24hr.memstat_account_summary 
  join im_prd.dw_24hr.dim_club using(club_id)
  left join im_prd.dw_24hr.memstats_account_list on account_id = account_num
  where month_id = 20230300 
  group by 1,2,3,4   
    """,
    "rightPorts": [
        {
            "datatype": "StringType()",
            "name": "ACCOUNT"
        },
        {
            "datatype": "LongType()",
            "name": "MONTH_ID"
        },
        {
            "name": "CLUB",
            "datatype": "StringType()"
        },        
        {
            "name": "ACCOUNT_SHORT_DESC",
            "datatype": "StringType()"
        },
        {
            "name": "AMOUNT",
            "datatype": "LongType()"
        }
    ],
    "joinColumns": [
        "ACCOUNT",
        "CLUB"
    ],
    "filter": "ACCOUNT == 901227"
}
        data = snowpark_base.executeJoin(request) 
        
        #print(json.dumps({"result":data}, indent=1))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__': 
    unittest.main()