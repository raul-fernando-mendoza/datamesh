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
    qry = req["qry"] if "qry" in req else None
    csvfile:str = req["csvfile"] if "csvfile" in req else None
    fields = []
    
    if qry: 
        r = sess.sql(qry)
        for field in r.schema.fields:
            fields.append( { "name":str(field.name) , "datatype":str(field.datatype)} ) 
        return {"fields":fields}
    else:
        print("run query left")
        leftDF = pd.read_csv(csvfile, sep = ',')
        print( leftDF.head(10) ) 
        types = leftDF.dtypes
        for columnName in leftDF.columns.tolist():
            fields.append( { "name":str(columnName) , "datatype":str(types[columnName].name)} ) 
        return {"fields":fields}               


def executeJoin( req):
    print("executeJoin called")
    print(json.dumps(req,indent=4))

    leftQry:str = req["leftQry"] if "leftQry" in req else None
    rightQry:str = req["rightQry"] if "rightQry" in req else None
    
    leftFile:str = req["leftFile"] if "leftFile" in req else None
    righFile:str = req["rightFile"] if "rightFile" in req else None
    
    leftCols=req["leftPorts"]
    rightCols=req["rightPorts"]
    joinColumns=req["joinColumns"]
    filter=req["filter"] if "filter" in req and len(req["filter"]) > 0 else None
    
    if leftQry and rightQry:
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
            .select( columnsArray )\
            .sort( joinColumns )
            
        #now apply filters if there is any
        print("apply filter")
        if filter and len(filter.strip())>0:
            df = df.filter(filter)
            
        df.show()
        collected = df.limit(2000).collect()
        p_df = pd.DataFrame(data=collected)
        obj = p_df.to_json(orient = "records")   
        print(json.dumps({"result":obj},indent=4))
        print("executeJoin END")
        return obj 
    else: #we have to do the join using pandas
        print("run query left")
        leftDF = pd.read_csv(leftFile, sep = ',', dtype = {'ACCOUNT': int,'CLUB': str,
                                                      'AMOUNT': float,'ACCOUNT_SHORT_DESC': str})
        print( leftDF.head(10) )
        print("run query right")
        r_Dataframe = sess.sql(rightQry)
        r_Dataframe.show()
        rightDF = pd.DataFrame(data=r_Dataframe.collect())
        
        
        columnsArray = []
        for ct in leftCols:
            fn:str = ct["name"] 
            fa:str = ct["alias"] if "alias" in ct else ct["name"]
            columnsArray.append( fn )
        for ct in rightCols:
            fn:str = ct["name"] 
            fa:str = ct["alias"] if "alias" in ct else ct["name"]
            firstOcurr = next( (lc for lc in leftCols if lc["name"] == fa), None)
            if firstOcurr == None:
                columnsArray.append( fn )
        
        print("left join right")   
        df = pd.merge( leftDF, 
                rightDF, 
                on=joinColumns,
            how = "outer")
        #    .sort_values( joinColumns )
        
        df = df[ columnsArray ]
            
        #now apply filters if there is any
        print("apply filter")
        if filter and len(filter.strip())>0:
            print("apply filter:" + filter)
            df = df.query(filter)
            
        df = df.sort_values(by = joinColumns)    
            
        print( df.head() )
        obj = df.iloc[:2000].to_json(orient = "records")   
        print(json.dumps({"result":obj},indent=4))
        print("executeJoin END")
        return obj         
        

def executeChildJoin( req ):
    print("executeChildJoin: called")
    print(json.dumps(req,indent=4))
    parentData = req["parentData"]
    leftQry:str = req["leftQry"]
    rightQry:str = req["rightQry"]
    leftColumns=req["leftColumns"]
    rightColumns=req["rightColumns"]
    joinColumns=req["joinColumns"]
    
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
    leftOnlyDF = sess.sql(leftQry)\
        .select( list(map( lambda column: col(column["name"]).alias( column['alias'] if 'alias' in column else column['name'] ), leftColumns)) ) 
    leftOnlyDF.show()
    print("right query")
    rightOnlyDF = sess.sql(rightQry)\
        .select( list(map( lambda column: col(column["name"]).alias( column['alias'] if 'alias' in column else column['name'] ), rightColumns)) ) 
    rightOnlyDF.show()
        
    
    print("prepare the names fot the inner join")
    
    leftJoinColumns = [] #join columns vs parent
    leftColumnsAliasArray = [] #names overwritten to the parent join
    for ct in leftColumns:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct  else ct["name"] 
        firstOcurr = next( (parentColumn for parentColumn in parentDF.columns if parentColumn == fa), None)
        if firstOcurr != None:
            leftJoinColumns.append( fa )
        else: 
            leftColumnsAliasArray.append( fa )
        
    #first join the parent with the left and with the right
    print("parent join left")
    print("join columns:" + str(leftJoinColumns))
    leftDF = parentDF \
        .join( right=leftOnlyDF,
              using_columns=leftJoinColumns,
          join_type= "inner")\
        .select( list(map( lambda column: leftOnlyDF[ column['alias'] if 'alias' in column else column['name'] ].alias( column['alias'] if 'alias' in column else column['name'] ), leftColumns)) ) 

    print("left Dataframe")    
    leftDF.show() 
    print("left count:" + str(leftDF.count()) ) 
    
    rightJoinColumns = []   
    rightColumnsAliasArray = [] 
    for ct in rightColumns:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct else ct["name"] 
        firstOcurr = next( (parentColumn for parentColumn in parentDF.columns if parentColumn == fa), None)
        if firstOcurr != None:
            rightJoinColumns.append( fa )
        else: 
            rightColumnsAliasArray.append( fa )
            
    print("parent join right")
    print("joinclumns:" + str(rightJoinColumns))
    rightDF = parentDF \
        .join( right=rightOnlyDF
        ,using_columns=rightJoinColumns,
          join_type= "inner")\
        .select( list(map( lambda column: rightOnlyDF[column['alias'] if 'alias' in column else column['name'] ].alias( column['alias'] if 'alias' in column else column['name'] ),rightColumns)) ) 
    
    print("right data")
    rightDF.show()
    print("right count:" + str(rightDF.count())) 
    
    #prepare the names of the outerjoin
    joinColumnsRigh = [] #pick from right only those that does not exist in left 
    
    for ct in rightColumns:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct else ct["name"]
        
        
        print("searching:" + fa)

        firstOcurrJoin = next( (jc for jc in joinColumns if (jc == fa)), None)
        if firstOcurrJoin == None: #if column is not in the list of joins then if exist append _rigth
            print("key:" + fa + "not found in join columns")
            firstOcurrLeft = next( (lc for lc in leftColumns if (lc["alias"] if "alias" in lc else lc["name"] == fa)), None)
            if firstOcurrLeft == None:
                print("key:" + fa + " not found in left_columns")
                joinColumnsRigh.append( ct )
            else:
                print("key:" + fa + "found in left_columns")
                ct["alias"] = fa + "_right" 
                joinColumnsRigh.append( ct )   
        
    #now do an ounter join between both resulting columns
    print("left join right")
    print("joincolumns:" + str(joinColumns))
    df = leftDF \
        .join( right=rightDF 
        ,using_columns=joinColumns
          ,join_type= "full") \
         .select( 
                 list(map( lambda    column: leftOnlyDF[column['alias'] if 'alias' in column else column['name'] ].alias( column['alias'] if 'alias' in column else column['name'] ), leftColumns)) 
                 + list(map( lambda column: rightOnlyDF[column['alias'] if 'alias' in column else column['name'] ].alias( column['alias'] if 'alias' in column else column['name'] ),joinColumnsRigh))  
                )
             
    df.show()
    print("export to json")
    collected = df.limit(2000).collect()
    p_df = pd.DataFrame(data=collected)
    obj = p_df.to_json(orient = "records")   
    print(json.dumps({"result":obj},indent=4))
    print("executeChildJoin END")
    return obj 