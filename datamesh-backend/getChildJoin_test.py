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
    parentPort:dict
    leftColumns:List[Port]
    rightColumns:List[Port]
    joinColumns:List[str]
    
qry2 = {
    "parentData": {
        "ACCOUNT": 900974,
        "CLUB": "00024",
        "AMOUNT": 69,
        "DESCRIPTION": "NM#HMOZERO",
        "MONTH_ID": 20230300,
        "REQUIRED": True,
        "AMOUNT_V1": 67
    },
    "leftQry": "select distinct to_number(month_id) month_id,  subscription_src_num,club_src_num CLUB, ad.account ACCOUNT, SUBSCRIPTION_VERSION SUBSCRIPTION_VERSION_IM, VERSION_STATUS VERSION_STATUS_IM, ds.curr_version_flag curr_version_flag_IM,   customer_src_num customer_src_num_IM,  effective_date effective_date_IM, ad.access access_IM, ad.product_rp_name product_rp_name_IM, ad.master_addon_flag master_addon_flag_IM, ad.retail_corp_flag retail_corp_flag_IM, ad.subscription_type_desc subscription_type_desc_IM, IS_3DAY_CANCEL_FLAG IS_3DAY_CANCEL_FLAG_IM,IS_SAME_DAY_CANCEL_FLAG IS_SAME_DAY_CANCEL_FLAG_IM, value as value_subscription_im   from im_prd.dw_24hr.memstats_account_detail ad join im_prd.dw_24hr.dim_club using(club_id) join im_prd.dw_24hr.memstats_account_list al on al.account_num = ad.account join im_prd.dw_24hr.dim_subscription ds using(subscription_id) order by subscription_src_num",
    "rightQry": "select distinct to_number(month_id) month_id, club_src_num CLUB, subscription_src_num, ad.account ACCOUNT, customer_src_num,  effective_date, ad.access, ad.product_rp_name, ad.master_addon_flag, ad.retail_corp_flag, ad.subscription_type_desc, IS_3DAY_CANCEL_FLAG,IS_SAME_DAY_CANCEL_FLAG,is_excludable_promo_flag, value as value_subscription_v1   from da_mem.memstats_account_detail ad join da_dw.dim_club using(club_id) join da_mem.memstats_account_list al on al.account_num = ad.account join da_dw.dim_subscription_new ds using(subscription_id) where   month_id = 20230300 ",
    "leftColumns": [
        {
            "datatype": "LongType()",
            "name": "MONTH_ID"
        },
        {
            "datatype": "StringType()",
            "name": "SUBSCRIPTION_SRC_NUM"
        },
        {
            "datatype": "StringType()",
            "name": "CLUB"
        },
        {
            "datatype": "LongType()",
            "name": "ACCOUNT"
        },
        {
            "datatype": "LongType()",
            "name": "SUBSCRIPTION_VERSION_IM"
        },
        {
            "datatype": "StringType()",
            "name": "VERSION_STATUS_IM"
        },
        {
            "datatype": "StringType()",
            "name": "CURR_VERSION_FLAG_IM"
        },
        {
            "datatype": "StringType()",
            "name": "CUSTOMER_SRC_NUM_IM"
        },
        {
            "datatype": "TimestampType()",
            "name": "EFFECTIVE_DATE_IM"
        },
        {
            "datatype": "StringType()",
            "name": "ACCESS_IM"
        },
        {
            "datatype": "StringType()",
            "name": "PRODUCT_RP_NAME_IM"
        },
        {
            "datatype": "StringType()",
            "name": "MASTER_ADDON_FLAG_IM"
        },
        {
            "datatype": "StringType()",
            "name": "RETAIL_CORP_FLAG_IM"
        },
        {
            "datatype": "StringType()",
            "name": "SUBSCRIPTION_TYPE_DESC_IM"
        },
        {
            "datatype": "StringType()",
            "name": "IS_3DAY_CANCEL_FLAG_IM"
        },
        {
            "datatype": "StringType()",
            "name": "IS_SAME_DAY_CANCEL_FLAG_IM"
        },
        {
            "datatype": "DecimalType(18, 4)",
            "name": "VALUE_SUBSCRIPTION_IM"
        }
    ],
    "rightColumns": [
        {
            "datatype": "LongType()",
            "name": "MONTH_ID"
        },
        {
            "datatype": "StringType()",
            "name": "CLUB"
        },
        {
            "datatype": "StringType()",
            "name": "SUBSCRIPTION_SRC_NUM"
        },
        {
            "datatype": "LongType()",
            "name": "ACCOUNT"
        },
        {
            "datatype": "StringType()",
            "name": "CUSTOMER_SRC_NUM"
        },
        {
            "datatype": "TimestampType()",
            "name": "EFFECTIVE_DATE"
        },
        {
            "datatype": "StringType()",
            "name": "ACCESS"
        },
        {
            "datatype": "StringType()",
            "name": "PRODUCT_RP_NAME"
        },
        {
            "datatype": "StringType()",
            "name": "MASTER_ADDON_FLAG"
        },
        {
            "datatype": "StringType()",
            "name": "RETAIL_CORP_FLAG"
        },
        {
            "datatype": "StringType()",
            "name": "SUBSCRIPTION_TYPE_DESC"
        },
        {
            "datatype": "BooleanType()",
            "name": "IS_3DAY_CANCEL_FLAG"
        },
        {
            "datatype": "BooleanType()",
            "name": "IS_SAME_DAY_CANCEL_FLAG"
        },
        {
            "datatype": "StringType()",
            "name": "IS_EXCLUDABLE_PROMO_FLAG"
        },
        {
            "datatype": "DecimalType(38, 12)",
            "name": "VALUE_SUBSCRIPTION_V1"
        }
    ],
    "joinColumns": [
        "MONTH_ID",
        "SUBSCRIPTION_SRC_NUM",
        "CLUB",
        "ACCOUNT"
    ]
}

class TestFireStore(unittest.TestCase):

    def test01_test01(self):
        
        print(json.dumps({"result":[]}))
        
        leftqry = """
select * from im_prd.dw_24hr.MEMSTATS_ACCOUNT_LIST where ACCOUNT_NUM in ('901227','901231')     
        """
        
        rightQry = """
select * from da_prd_v1.da_mem.MEMSTATS_ACCOUNT_LIST where ACCOUNT_NUM in ('901227','901231')        
        """
       
        request:Request = {
            "parentData":{
                "ACCOUNT_NUM":901231,
                "ACCOUNT_SHORT_DESC":"NS/AGV/Basic/Region/M/Ret$",
                "Owner":"Brian"
            },
            "leftQry":leftqry,
            "rightQry":rightQry,
            "leftColumns":[
                {
                    "name":'ACCOUNT_NUM'
                    ,"alias":"ACCOUNT_NUM"
                },
                {
                    "name":'ACCOUNT_SHORT_DESC'
                    #,'alias':'CLUB_SRC_NUM'
                }
            ],
            "rightColumns":[
                {
                    "name":'ACCOUNT_NUM'
                    ,"alias":"ACCOUNT_NUM"
                },
                {
                    "name":'ACCOUNT_SHORT_DESC'
                    ,'alias':'ACCOUNT_SHORT_DESC'
                }
            ],
            "joinColumns":["ACCOUNT_NUM"]
        }
        print( list(map( lambda x: x + x, ["a","b"])) )
        
        leftCols = request["leftColumns"]
        print( list(map( lambda column: ( column['alias'] if 'alias' in column else column['name'] ),leftCols)) )
        
        data = snowpark_base.executeChildJoin(request) 
        
        #print(json.dumps({"result":data}, indent=1))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__': 
    unittest.main()