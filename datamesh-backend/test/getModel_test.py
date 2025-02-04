import os
from snowflake.snowpark import Session
from snowflake.snowpark.functions import col
import firebase_admin
firebase_admin.initialize_app( )

#from firebase_admin import firestore
import json
from google.api_core.datetime_helpers import DatetimeWithNanoseconds
import datamesh_flask.bsnrules as bsnrules


#db = firestore.client()


def custom_json(obj):
    if isinstance(obj, DatetimeWithNanoseconds):
        print("convering to date")
        t = obj
        r =  f'{t.year}-{t.month:02}-{t.month:02}' 
        return r
    raise TypeError(f'Cannot serialize object of {type(obj)}')

'''
connection_parameters = {
    "type":"snowflake",
    "account":"twentyfourhourfit.east-us-2.azure",
    "user":"rmendoza@24hourfit.com",
    "authenticator":"externalbrowser",
    "role":"DA_ANALYTICS_RO_PRD",
    "database":"DA_PRD_V1",
    "warehouse":"BI_WH",
    "schema":"DA_DW",
    "threads":"1",
    "client_session_keep_alive":"False",
    "query_tag":"daily" 
}
test_session = Session.builder.configs(connection_parameters).create()

r = test_session.sql("select current_warehouse(), current_database(), current_schema()").collect()
print(r)
df_table = test_session.table("dim_club").select(col("club_id"), col("club_src_num")).filter(col("club_src_num") == '00024')
df_table.show()

doc_ref = db.collection("Model").document("12fbec6e-a32e-4834-8085-cde4e0990a8f")
doc = doc_ref.get()
model = doc.to_dict() 
print( json.dumps(model, indent=1, default=custom_json) )
'''
        
req = {
    "modelId":'db36612a-b2c1-4955-8048-cc4e3b2707ba',
}
df = bsnrules.executeModelById( req )
print( json.dumps(df, indent=1, default=custom_json) )

