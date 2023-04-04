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
        "ACCOUNT_ID": 900110,
        "MONTH_ID": "20230200.00000",
        "CLUB_SRC_NUM": "00592",
        "VALUE": 8310,
        "V1_VALUE": 24932
    },
    "leftQry": """
    select distinct month_id, subscription_src_num,club_src_num, ad.account account_id, customer_src_num,  effective_date, ad.access, ad.product_rp_name, ad.master_addon_flag, ad.retail_corp_flag, ad.subscription_type_desc, IS_3DAY_CANCEL_FLAG,IS_SAME_DAY_CANCEL_FLAG,is_excludable_promo_flag, value as value_v1   from da_mem.memstats_account_detail ad join da_dw.dim_club using(club_id) join da_mem.memstats_account_list al on al.account_num = ad.account join da_dw.dim_subscription_new ds using(subscription_id) where  ds.is_current_record = true order by 
    subscription_src_num """,
    "rightQry": """select month_id, club_src_num, ad.account account_id, customer_src_num, subscription_src_num, effective_date, ad.access, ad.product_rp_name, ad.master_addon_flag, ad.retail_corp_flag, ad.subscription_type_desc, 
value   from im_prd.dw_24hr.memstats_account_detail ad join im_prd.dw_24hr.dim_club using(club_id)""",
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
            "name": "CLUB_SRC_NUM"
        },
        {
            "datatype": "LongType()",
            "name": "ACCOUNT_ID"
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
            "name": "VALUE_V1"
        }
    ],
    "rightColumns": [
        {
            "datatype": "LongType()",
            "name": "MONTH_ID"
        },
        {
            "datatype": "StringType()",
            "name": "CLUB_SRC_NUM"
        },
        {
            "datatype": "LongType()",
            "name": "ACCOUNT_ID"
        },
        {
            "datatype": "StringType()",
            "name": "CUSTOMER_SRC_NUM"
        },
        {
            "datatype": "StringType()",
            "name": "SUBSCRIPTION_SRC_NUM"
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
            "datatype": "DecimalType(18, 4)",
            "name": "VALUE"
        }
    ],
    "joinColumns": [
        "MONTH_ID",
        "SUBSCRIPTION_SRC_NUM",
        "CLUB_SRC_NUM",
        "ACCOUNT_ID",
        "CUSTOMER_SRC_NUM",
        "EFFECTIVE_DATE",
        "ACCESS",
        "PRODUCT_RP_NAME",
        "MASTER_ADDON_FLAG",
        "RETAIL_CORP_FLAG",
        "SUBSCRIPTION_TYPE_DESC"
    ]
}    

class TestFireStore(unittest.TestCase):

    def test01_test01(self):
        
        print(json.dumps({"result":[]}))
        
        leftqry = """
select month_id, club_src_num, ad.account as account_id, customer_src_num, subscription_src_num, effective_date, ad.access, ad.product_rp_name, ad.master_addon_flag, ad.retail_corp_flag, ad.subscription_type_desc, value as value_im 
from im_prd.dw_24hr.memstats_account_detail ad
join im_prd.dw_24hr.dim_club using(club_id)        
        """
        
        rightQry = """
select distinct month_id, subscription_src_num,club_src_num, ad.account as account_id, customer_src_num,  effective_date, ad.access, ad.product_rp_name, ad.master_addon_flag, ad.retail_corp_flag, ad.subscription_type_desc, IS_3DAY_CANCEL_FLAG,is_excludable_promo_flag, value as value_v1  
from da_mem.memstats_account_detail ad
join da_dw.dim_club using(club_id)
join da_mem.memstats_account_list al on al.account_num = ad.account
join da_dw.dim_subscription_new ds using(subscription_id)
where  ds.is_current_record = true         
        """
       
        request:Request = {
            "parentData":{
                "ACCOUNT_ID":901367,
                "CLUB_SRC_NUM":"00219",
                "MONTH_ID":"20220200.0000",
                "VALUE":2
            },
            "leftQry":leftqry,
            "rightQry":rightQry,
            "leftColumns":[
                {
                    "name":'ACCOUNT_ID'
                },
                {
                    "name":'CLUB_SRC_NUM'
                    #,'alias':'CLUB_SRC_NUM'
                },
                {
                    "name":'MONTH_ID',
                    #,'alias':'MONTH_ID'
                },
                {
                    "name":'VALUE_IM',
                    #,'alias':'VALUE'
                }
            ],
            "rightColumns":[
                {
                    "name":"MONTH_ID"                    
                },
                {
                    "name":"CLUB_SRC_NUM"
                    #,"alias":"CLUB_SRC_NUM_DETAIL"
                },
                {
                    "name":"ACCOUNT_ID"
                    #,"alias":"ACCOUNT_ID_DETAIL"
                },
                {
                    "name":"IS_3DAY_CANCEL_FLAG"
                    #,"alias":"IS_3DAY_CANCEL_FLAG"
                }
            ],
            "joinColumns":["ACCOUNT_ID","MONTH_ID","CLUB_SRC_NUM"]
        }
        data = snowpark_base.executeChildJoin(qry2) 
        
        #print(json.dumps({"result":data}, indent=1))

        #self.assertTrue(obj["id"] == "test1")           



if __name__ == '__main__': 
    unittest.main()