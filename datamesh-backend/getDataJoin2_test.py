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
    "leftQry": """with accounts_required as (   select 900110 as account_id union all   select 900244 as account_id union all   select 900322 as account_id union all   select 900510 as account_id union all   select 900704 as account_id union all   select 900710 as account_id union all   select 900711 as account_id union all   select 900715 as account_id union all   select 900726 as account_id union all   select 900732 as account_id union all   select 900737 
as account_id union all   select 900743 as account_id union all   select 900744 as account_id union all   select 900754 as account_id union all   select 900759 as account_id union all   select 900765 as account_id union all   select 900766 as account_id union all   select 900803 as account_id union all   select 900809 as account_id union all  
 select 900974 as account_id union all   select 900976 as account_id union all   select 901027 as account_id union 
all   select 901028 as account_id union all   select 901031 as account_id union all   select 901033 as account_id union all   select 901034 as account_id union all   select 901038 as account_id union all   select 901039 as account_id union all   select 901042 as account_id union all   select 901044 as account_id union all   select 901045 as account_id union all   select 901049 as account_id union all   select 901050 as account_id union all   select 901053 
as account_id union all   select 901055 as account_id union all   select 901056 as account_id union all   select 901060 as account_id union all   select 901061 as account_id union all   select 901066 as account_id union all   select 901067 as account_id union all   select 901227 as account_id union all   select 901228 as account_id union all  
 select 901229 as account_id union all   select 901230 as account_id union all   select 901251 as account_id union 
all   select 901252 as account_id union all   select 901253 as account_id union all   select 901254 as account_id union all   select 901259 as account_id union all   select 901260 as account_id union all   select 901261 as account_id union all   select 901262 as account_id union all   select 901283 as account_id union all   select 901284 as account_id union all   select 901285 as account_id union all   select 901286 as account_id union all   select 901297 
as account_id union all   select 901298 as account_id union all   select 901321 as account_id union all   select 901322 as account_id union all   select 901323 as account_id union all   select 901329 as account_id union all   select 901330 as account_id union all   select 901353 as account_id union all   select 901354 as account_id union all  
 select 901367 as account_id union all   select 901368 as account_id union all   select 901369 as account_id union 
all   select 901379 as account_id union all   select 901380 as account_id union all   select 901381 as account_id union all   select 901387 as account_id union all   select 901391 as account_id union all   select 901392 as account_id union all   select 901393 as account_id union all   select 901394 as account_id union all   select 901403 as account_id union all   select 901404 as account_id union all   select 901405 as account_id union all   select 901406 
as account_id union all   select 901411 as account_id union all   select 901412 as account_id union all   select 901413 as account_id union all   select 901414 as account_id union all   select 901423 as account_id union all   select 901424 as account_id union all   select 901425 as account_id union all   select 901426 as account_id union all  
 select 901435 as account_id union all   select 901436 as account_id union all   select 901437 as account_id union 
all   select 901447 as account_id union all   select 901448 as account_id union all   select 901449 as account_id union all   select 901455 as account_id union all   select 901456 as account_id union all   select 901457 as account_id union all   select 901467 as account_id union all   select 901468 as account_id union all   select 901469 as account_id union all   select 901480 as account_id union all   select 901481 as account_id union all   select 901482 
as account_id union all   select 901483 as account_id union all   select 901484 as account_id union all   select 901485 as account_id union all   select 901486 as account_id union all   select 901487 as account_id union all   select 901488 as account_id union all   select 901489 as account_id union all   select 901490 as account_id union all  
 select 901491 as account_id union all   select 901492 as account_id union all   select 901508 as account_id union 
all   select 901509 as account_id union all   select 901510 as account_id union all   select 901511 as account_id union all   select 901512 as account_id union all   select 901513 as account_id union all   select 901514 as account_id union all   select 901515 as account_id union all   select 901516 as account_id union all   select 901517 as account_id union all   select 901518 as account_id union all   select 901519 as account_id union all   select 902053 
as account_id union all   select 902055 as account_id union all   select 902080 as account_id union all   select 902101 as account_id union all   select 902102 as account_id union all   select 902104 as account_id union all   select 902113 as account_id union all   select 902130 as account_id union all   select 902134 as account_id union all  
 select 902139 as account_id union all   select 902143 as account_id union all   select 902150 as account_id union 
all   select 902151 as account_id union all   select 902152 as account_id union all   select 902153 as account_id union all   select 902174 as account_id union all   select 902175 as account_id union all   select 902176 as account_id union all   select 902177 as account_id union all   select 902180 as account_id union all   select 902181 as account_id union all   select 902182 as account_id union all   select 902184 as account_id union all   select 902185 
as account_id union all   select 902187 as account_id union all   select 902188 as account_id union all   select 902189 as account_id union all   select 902190 as account_id union all   select 902209 as account_id union all   select 902351 as account_id union all   select 902352 as account_id union all   select 902353 as account_id union all  
 select 902354 as account_id union all   select 902360 as account_id union all   select 902361 as account_id union 
all   select 902362 as account_id union all   select 902363 as account_id union all   select 902364 as account_id union all   select 902370 as account_id union all   select 902371 as account_id union all   select 902372 as account_id union all   select 902373 as account_id union all   select 902374 as account_id union all   select 902380 as account_id union all   select 902381 as account_id union all   select 902382 as account_id union all   select 902383 
as account_id union all   select 902384 as account_id union all   select 902390 as account_id union all   select 902396 as account_id union all   select 902397 as account_id union all   select 902398 as account_id union all   select 902399 as account_id union all   select 902405 as account_id union all   select 902411 as account_id union all  
 select 902419 as account_id union all   select 902425 as account_id union all   select 902461 as account_id union 
all   select 902470 as account_id union all   select 902471 as account_id union all   select 902473 as account_id union all   select 904100 as account_id union all   select 904110 as account_id union all   select 904120 as account_id union all   select 906003 as account_id union all   select 906004 as account_id union all   select 907603 as account_id union all   select 907604 as account_id union all   select 907609 as account_id union all   select 907610 
as account_id union all   select 907703 as account_id union all   select 907704 as account_id union all   select 907709 as account_id union all   select 907803 as account_id union all   select 907804 as account_id union all   select 907903 as account_id union all   select 932026 as account_id union all   select 932027 as account_id   ),  accounts_generated as (     select * from da_mem.memstats_account_summary where month_id = 20230200  )  select account_id, TO_NUMBER(month_id) as month_id, club_src_num, value as value_da  from accounts_required  left join accounts_generated using( account_id )  left join dim_club using( club_id )""",
    "rightQry": """select account_id, to_number(month_id) as month_id, club_src_num, ACCOUNT_LONG_DESC, sum(round(value,0)) value_m1   from im_prd.dw_24hr.memstat_account_summary mas   left join im_prd.dw_24hr.dim_club using(club_id)   join im_prd.dw_24hr.memstats_account_list al on mas.account_id = al.account_num where  month_id = 20230300 and 
account_id > 0 group by  account_id, month_id, club_src_num,ACCOUNT_LONG_DESC order by month_id, account_id""",      
    "leftColumns": [
        {
            "datatype": "LongType()",
            "name": "ACCOUNT_ID"
        },
        {
            "datatype": "LongType()",
            "name": "MONTH_ID"
        },
        {
            "name": "CLUB_SRC_NUM",
            "datatype": "StringType()"
        },
        {
            "name": "VALUE_DA",
            "datatype": "DecimalType(38, 12)"
        }
    ],
    "rightColumns": [
        {
            "datatype": "LongType()",
            "name": "ACCOUNT_ID"
        },
        {
            "datatype": "LongType()",
            "name": "MONTH_ID"
        },
        {
            "name": "CLUB_SRC_NUM",
            "datatype": "StringType()"
        },
        {
            "name": "ACCOUNT_LONG_DESC",
            "datatype": "StringType()"
        },
        {
            "name": "VALUE_M1",
            "datatype": "LongType()"
        }
    ],
    "joinColumns": [
        "ACCOUNT_ID",
        "MONTH_ID",
        "CLUB_SRC_NUM"
    ],
    "filter": " "
}
        f = request["leftColumns"][0]["name"]
        data = snowpark_base.executeJoin(request) 
        
        #print(json.dumps({"result":data}, indent=1))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__': 
    unittest.main()