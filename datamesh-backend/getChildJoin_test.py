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
        "ACCOUNT": 901259,
        "CLUB": "00024",
        "AMOUNT": 48,
        "ACCOUNT_SHORT_DESC": "Unit/Basic/Nation/M/Ret#",
        "MONTH_ID": "20230300.00000",
        "REQUIRED": True,
        "AMOUNT_V1": 48
    },
    "leftQry": "select distinct month_id, subscription_src_num,club_src_num CLUB, ad.account ACCOUNT, customer_src_num,  effective_date, ad.access, ad.product_rp_name, ad.master_addon_flag, ad.retail_corp_flag, ad.subscription_type_desc, IS_3DAY_CANCEL_FLAG,IS_SAME_DAY_CANCEL_FLAG,is_excludable_promo_flag, value as value_subscription_v1   from da_mem.memstats_account_detail ad join da_dw.dim_club using(club_id) join da_mem.memstats_account_list al on al.account_num = ad.account join da_dw.dim_subscription_new ds using(subscription_id) where  ds.is_current_record = true and month_id = 20230300",
    "rightQry": "select distinct SUBSCRIPTION_VERSION, VERSION_STATUS, ds.curr_version_flag, month_id month_id, subscription_src_num,club_src_num CLUB, ad.account account, customer_src_num,  effective_date, ad.access, ad.product_rp_name, ad.master_addon_flag, ad.retail_corp_flag, ad.subscription_type_desc, IS_3DAY_CANCEL_FLAG,IS_SAME_DAY_CANCEL_FLAG, value as value_subscription_im   from im_prd.dw_24hr.memstats_account_detail ad join im_prd.dw_24hr.dim_club using(club_id) join im_prd.dw_24hr.memstats_account_list al on al.account_num = ad.account join im_prd.dw_24hr.dim_subscription ds using(subscription_id) where  lower(ds.version_status) = 'active' and month_id = 20230300 order by subscription_src_num",
    "leftColumns": [
        {
            "datatype": "StringType()",
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
    "rightColumns": [
        {
            "datatype": "LongType()",
            "name": "SUBSCRIPTION_VERSION"
        },
        {
            "datatype": "StringType()",
            "name": "VERSION_STATUS"
        },
        {
            "datatype": "StringType()",
            "name": "CURR_VERSION_FLAG"
        },
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
            "datatype": "StringType()",
            "name": "IS_3DAY_CANCEL_FLAG"
        },
        {
            "datatype": "StringType()",
            "name": "IS_SAME_DAY_CANCEL_FLAG"
        },
        {
            "datatype": "DecimalType(18, 4)",
            "name": "VALUE_SUBSCRIPTION_IM"
        }
    ],
    "joinColumns": [
        "MONTH_ID",
        "SUBSCRIPTION_SRC_NUM",
        "CLUB",
        "ACCOUNT",
        "CUSTOMER_SRC_NUM",
        "EFFECTIVE_DATE",
        "ACCESS",
        "PRODUCT_RP_NAME",
        "MASTER_ADDON_FLAG",
        "RETAIL_CORP_FLAG",
        "SUBSCRIPTION_TYPE_DESC",
        "IS_3DAY_CANCEL_FLAG",
        "IS_SAME_DAY_CANCEL_FLAG"
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
                "ACCOUNT_ID":901231,
                "ACCOUNT_SHORT_DESC":"NS/AGV/Basic/Region/M/Ret$",
                "Owner":"Brian"
            },
            "leftQry":leftqry,
            "rightQry":rightQry,
            "leftColumns":[
                {
                    "name":'ACCOUNT_NUM'
                    ,"alias":"ACCOUNT_ID"
                },
                {
                    "name":'ACCOUNT_SHORT_DESC'
                    #,'alias':'CLUB_SRC_NUM'
                }
            ],
            "rightColumns":[
                {
                    "name":'ACCOUNT_NUM'
                    ,"alias":"ACCOUNT_ID"
                },
                {
                    "name":'ACCOUNT_SHORT_DESC'
                    ,'alias':'ACCOUNT_SHORT_DESC_1'
                }
            ],
            "joinColumns":["ACCOUNT_ID"]
        }
        print( list(map( lambda x: x + x, ["a","b"])) )
        
        leftCols = request["leftColumns"]
        print( list(map( lambda column: ( column['alias'] if 'alias' in column else column['name'] ),leftCols)) )
        
        data = snowpark_base.executeChildJoin(qry2) 
        
        #print(json.dumps({"result":data}, indent=1))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__': 
    unittest.main()