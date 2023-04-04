import os
from snowflake.snowpark import Session
from snowflake.snowpark.functions import col, sql_expr, lit, Column
import pandas as pd
import json

dev_connection_parameters = {
      "type": "snowflake",
      "account": "twentyfourhourfit.east-us-2.azure",
      "user": "rmendoza@24hourfit.com",
      "authenticator": "externalbrowser",
      "role": "DA_ANALYTICS_RO_PRD",
      "database": "DA_PRD_V1",
      "warehouse": "BI_WH",
      "schema": "DA_DW",
      "threads": "1",
      "client_session_keep_alive": "False",
      "query_tag": "daily" 
}
sess = Session.builder.configs(dev_connection_parameters).create()

def database():
    r = sess.sql("select current_warehouse() warehouse, current_database() database, current_schema() schema").collect()
    return {
        "warehouse":r[0]['WAREHOUSE'],
        "database":r[0]['DATABASE'],
        "schema":r[0]['SCHEMA']
    }

def getFielsForQuery(req):
    print("getFielsForQuery called")
    print(json.dumps(req))
    qry = req["qry"]
    r = sess.sql(qry)
    
    fields = []

    for field in r.schema.fields:
        fields.append( { "name":str(field.name) , "datatype":str(field.datatype)} ) 
    return {"fields":fields}


def executeJoin( req):
    print("executeJoin called")
    leftQry:str = req["leftQry"]
    rightQry:str = req["rightQry"]
    leftCols=req["leftColumns"]
    rightCols=req["rightColumns"]
    joinColumns=req["joinColumns"]
    
    print("run query left")
    leftDF = sess.sql(leftQry)
    leftDF.show()
    print("run query right")
    rightDF = sess.sql(rightQry)
    rightDF.show()
    
    columnsArray = []
    for ct in leftCols:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct else ct["name"]
        columnsArray.append( leftDF[fn].alias(fa) )
    for ct in rightCols:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct else ct["name"]
        firstOcurr = next( (lc for lc in leftCols if lc["name"] == fa), None)
        if firstOcurr == None:
            columnsArray.append( rightDF[fn].alias(fa) )
     
    print("left join right")   
    df = leftDF \
        .join( right=rightDF, 
              using_columns=joinColumns,
          join_type= "leftouter") \
         .select( columnsArray )
         
    df.show()
    collected = df.limit(100).collect()
    p_df = pd.DataFrame(data=collected)
    obj = p_df.to_json(orient = "records")   
    print(json.dumps({"result":obj},indent=4))
    print("executeJoin END")
    return obj 

def executeChildJoin( req ):
    print("executeChildJoin: called")
    print(json.dumps(req,indent=4))
    parentData = req["parentData"]
    leftQry:str = req["leftQry"]
    rightQry:str = req["rightQry"]
    leftCols=req["leftColumns"]
    rightCols=req["rightColumns"]
    joinCols=req["joinColumns"]
    
    #create query from parent data
    print("creating parent cte")
    parentFields = ""
    for key in parentData:
        if( parentFields != ""):
            parentFields += ","
        if isinstance(parentData[key],int) or isinstance(parentData[key],float):
            parentFields += str(parentData[key]) + " as " + key
        else:    
            parentFields += "'" + str(parentData[key]) + "'" + " as " + key
        
    parentCTE = "select " + parentFields
    print("parent query:" + parentCTE)
    
    parentDF = sess.sql(parentCTE)      
    parentDF.show()
    
    print("left query")
    leftOnlyDF = sess.sql(leftQry)
    leftOnlyDF.show()
    print("right query")
    rightOnlyDF = sess.sql(rightQry)
    rightOnlyDF.show()
    
    print("prepare the names fot the inner join")
    
    leftJoinColumns = []
    leftColumnsAliasArray = []
    for ct in leftCols:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct  else ct["name"] 
        firstOcurr = next( (parentColumn for parentColumn in parentDF.columns if parentColumn == fa), None)
        if firstOcurr != None:
            leftJoinColumns.append( fn )
        else: 
            leftColumnsAliasArray.append( fa )
        
    #first join the parent with the left and with the right
    print("parent join left")
    leftDF = parentDF \
        .join( right=leftOnlyDF,
              using_columns=leftJoinColumns,
          join_type= "inner")\
        .select( parentDF.columns + leftColumnsAliasArray ) 
    
    print("left Dataframe")    
    leftDF.show()  
    
                 
        
    rightJoinColumns = []   
    rightColumnsAliasArray = [] 
    for ct in rightCols:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct else ct["name"] 
        firstOcurr = next( (parentColumn for parentColumn in parentDF.columns if parentColumn == fa), None)
        if firstOcurr != None:
            rightJoinColumns.append( fn )
        else: 
            rightColumnsAliasArray.append( fa )
        
    print("parent join right")
    rightDF = parentDF \
        .join( right=rightOnlyDF
        ,using_columns=leftJoinColumns,
          join_type= "inner")\
        .select( parentDF.columns + rightColumnsAliasArray ) 
    
    print("right data")
    rightDF.show()
    
    #prepare the names of the outerjoin
    JoinColumnsArray = []
    joinColumnsAliasArray = []
    
    for ct in leftCols:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct else ct["name"] 
        joinColumnsAliasArray.append( fa )
        
   
    for ct in rightCols:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct else ct["name"]

        firstOcurr = next( (jc for jc in joinColumnsAliasArray if jc == fa), None)
        if firstOcurr != None:
            JoinColumnsArray.append( fa )
        else:            
            joinColumnsAliasArray.append( fa )
        
    #now do an ounter join between both resulting columns
    print("left join right")
    df = leftDF \
        .join( right=rightDF 
        ,using_columns=JoinColumnsArray
          ,join_type= "leftouter") \
         .select( joinColumnsAliasArray )
             
    df.show()
    print("export to json")
    collected = df.limit(100).collect()
    p_df = pd.DataFrame(data=collected)
    obj = p_df.to_json(orient = "records")   
    print(json.dumps({"result":obj},indent=4))
    print("executeChildJoin END")
    return obj 