import json

import firebase_admin
import datamesh_flask.firestore_db as firestore_db
import datamesh_flask.datamesh_base as datamesh_base
import datamesh_flask.snowflake_odbc as snowflake_odbc
from google.api_core.datetime_helpers import DatetimeWithNanoseconds
import pandas as pd
from snowflake.snowpark.functions import col, sql_expr, lit, Column, sum, max, min, count  
import uuid

from firebase_admin import firestore

db = firestore.client()

def jsonFilter(obj, excludekeys=[]):
    result = {}
    for key in obj:
        if key in excludekeys:
            result[key] = "skipped"
        else:
            result[key] = obj[key]
    return result            

def custom_json(obj):
    if isinstance(obj, DatetimeWithNanoseconds):
        print("convering to date")
        t = obj
        r =  f'{t.year}-{t.month:02}-{t.month:02}' 
        return r
    raise TypeError(f'Cannot serialize object of {type(obj)}')


    


def getOdbcConnection( connectionId ):
     
    conn = snowflake_odbc.getOdbcConnection( connectionId )
    if conn == None:
        credentials = datamesh_base.getCredentials( connectionId ) 
        conn = snowflake_odbc.setOdbcConnection( connectionId, credentials)
    return conn

def setEncryptedDocument(req):
    
    collectionId = req["collectionId"]
    id = req["id"]
    data = req["data"]   
    unencryptedFields= req["unencriptedFields"] 
  
    obj = firestore_db.setEncryptedDocument( collectionId , id, data, unencryptedFields)
    print(json.dumps(obj))
    return obj
    
def getEncryptedDocument(req):
    
    collectionId = req["collectionId"]
    id = req["id"]
    
    obj = firestore_db.getEncryptedDocument( collectionId , id)
    print(json.dumps(obj)) 
    return obj   


def executeJoin( req ):
    print("executeJoin called")
    print(json.dumps(req,indent=4))
    leftSess = datamesh_base.getSnowparkSession( req["left_connectionId"] )
    rightSess = datamesh_base.getSnowparkSession( req["right_connectionId"] )

    leftQry:str = req["leftQry"] if "leftQry" in req else None
    rightQry:str = req["rightQry"] if "rightQry" in req else None
    
    
    leftCols=req["leftPorts"]
    rightCols=req["rightPorts"]
    joinColumns=req["joinColumns"]
    filter=req["filter"] if "filter" in req and len(req["filter"]) > 0 else None
    
    return datamesh_base.executeJoin( leftSess, leftQry, leftCols,
                            rightSess, rightQry, rightCols, 
                            joinColumns,
                            filter)

def executeSql(req):
        sql = req["sql"]
        connectionId = req["connectionId"]
        print("connectionId:" + connectionId)
        
        
        conn = getOdbcConnection(connectionId)
   
        print("using session:" + str(conn)) 
        
            
        return snowflake_odbc.executeSql(conn, sql)
    
def getFielsForQuery(req):
    print("getFielsForQuery called")
    print(json.dumps(req))
    sess = datamesh_base.getSnowparkSession( req["connectionId"] )
    qry = req["qry"] if "qry" in req else None
    
    return datamesh_base.getFielsForQuery( sess, qry )

#run as req = { 
# path:'SqlJupiterDoc/b8d2a095-2bda-4bef-9d56-8130280f43e1/SqlJupiter/34a89c65-ad66-4b5e-b0e4-2c737c1faa97'
# }
def executeSqlByPath(req):
    basepath = ""
    id = ""
    doc_ref = None
    try:
        path = req["path"]
        
        basepathArr = path.split("/")
        
        id = basepathArr[-1]

        basepath = "/".join( map(str,basepathArr[:-1]) )        
        
        doc_ref = db.collection(basepath).document(id)
        
    except Exception as e:
        raise
    
    try:
        doc = doc_ref.get()
        
        data = doc.to_dict() 
        
        connectionId = data["connectionId"]
        print("connectionId:" + connectionId)
        
        sql = data["sql"]
        request_id = data["request_id"]
        request_status = data["request_status"]
        
        if request_status == 'requested':
            print("*** update to inprogress")
        
            conn = getOdbcConnection(connectionId)
    
            print("using session:" + str(conn)) 
            
            updateObj = {
                "request_status":"inprogress",
            }
            doc_ref.update( updateObj )        
            print("**** status set to inprogress")
                
            result = snowflake_odbc.executeSql(conn, sql)
            
            #verify if the doc is using the same request_id
            doc_ref = db.collection(basepath).document(id)
            doc = doc_ref.get()
            data = doc.to_dict() 
            request_status = data["request_status"]
            if request_id == data["request_id"] and request_status == 'inprogress':
                #update the result as success
                print("*** writting result")
                resultSetStr = []
                
                for row in result["resultSet"]:
                    obj={}
                    for i in range(len(row)):
                        obj[str(i)]=row[i]
                    resultSetStr.append( obj )
                
                updateObj = {
                    "result_status":"completed",
                    "result_metadata":result["metadata"],
                    "result_set":resultSetStr,
                    "request_error_message":""
                }
            
                doc_ref_result = db.collection(basepath + "/"+ id + "/SqlResult").document(request_id)
                doc_ref_result.set( updateObj )
                return { "status":"success"}
            else:
                return { "status":"failed" }
        else:
            return { "status":"failed" }
    except Exception as e:
        updateObj = {
            "request_status":"error",
            "request_error_message":str(e),
            "result_set":[]
        }
        doc_ref.update( updateObj )        
        raise
        
def executeModelById(req):
        modelId = req["modelId"]        
        print("modelId:" + modelId)
        doc_ref = db.collection("Model").document(modelId)
        doc = doc_ref.get()
        model = doc.to_dict() 
        #print( json.dumps(jsonFilter(model,("columns")), indent=1, default=custom_json) )
        
        df = datamesh_base.getDFChild( model["data"][0])
        df.show()
        collected = df.limit(2000).collect()
        p_df = pd.DataFrame(data=collected)
        records = p_df.to_json(orient = "records")
    
        fields = []
        for field in df.schema.fields:
            fields.append( { "name":str(field.name) , "datatype":str(field.datatype)} )         
        obj ={
            "records":json.loads(records),
            "schema":fields
        } 
        
        print(json.dumps({"result":obj},indent=4))
        print("executeModelById END")
        return obj 
                
        return qry

def getInitialRead( joinNode ):
    connectionId = joinNode["connectionId"]
    tableName = joinNode["tableName"]
    session = datamesh_base.getSnowparkSession( connectionId )
    df = session.table(tableName) 
    result = df.select("*") 
    return result 

def toSqlGeneric( df , max = 10):
    sqlGeneric = {
        "columns":[],
        "resultSet":[]
    }
    
    for col in df.dtypes:
        colGeneric = {
            "columnName":col[0],
            "columnType":col[1]
        }
        sqlGeneric["columns"].append( colGeneric )
    
                
    collected = df.limit(max).collect()
    for row in collected:
        rowGeneric = {}
        for i in range(len(row)):
            property = f"{i:0>3}"
            if row[i] != None:
                columType = sqlGeneric["columns"][i]['columnType'] 
                if (columType.startswith('string')) \
                    or (columType == 'bigint'):
                    rowGeneric[property] = row[i]
                elif columType == 'date':
                    t = row[i]
                    rowGeneric[property] = f'{t.year}/{t.month:02}/{t.day:02}'
                elif columType.startswith('timestamp'): 
                    t = row[i]
                    rowGeneric[property] = f'{t.year}/{t.month:02}/{t.day:02} {t.hour:02}:{t.minute:02}:{t.second:02}' 
                elif columType == 'boolean':
                    if row[i]:
                       rowGeneric[property] = 'Y'
                    else:         
                       rowGeneric[property] = 'N' 
                elif columType.startswith('Decimal') or \
                    columType.startswith('decimal') :
                    rowGeneric[property] = float(f"{row[i]}")       
                else:    
                    rowGeneric[property] = f"{row[i]}"
            else:
               rowGeneric[property] = None         
                
        sqlGeneric["resultSet"].append( rowGeneric )
    
    return sqlGeneric

def applyTransformation( df, t):
    if t["type"] == 'filter':
        leftValue = t["leftValue"]
        comparator = t["comparator"]
        rightValue = t["rightValue"]
        result = df.filter( leftValue + " " + comparator +  " " + rightValue )
        return result 
    elif t["type"] == 'selectColumns':
        columnsNames = t["columnsNames"]
        
        if len(columnsNames) == 0:
            colsSelected = df.columns
        else:    
            for n in columnsNames:
                colsSelected.append( col(n).alias(n) )
        result = df.select( colsSelected )    
        return result
    elif t["type"] == 'groupBy':
        aggs = []
        functions = t["functions"]
        groupByColumns = t["groupByColumns"]
        for f in functions:
            columnName = f["columnName"]
            functionOption = f["functionOption"]
            alias = f["alias"] if f["alias"] else f["columnName"] + "_" + functionOption
            if functionOption == "sum":
                aggs.append( sum(columnName).alias(alias) )
            elif functionOption == "count":
                aggs.append( count(columnName).alias(alias) )                
            elif functionOption == "max":
                aggs.append( max(columnName).alias(alias) ) 
            elif functionOption == "min":
                aggs.append( min(columnName).alias(alias) )                   
            
        cols = []    
        for c in groupByColumns:
             cols.append( col(c) )  
        result = df.group_by(cols).agg( aggs )   
        return result 
    elif t["type"] == 'renameColumn':
        columnName = t["columnName"]
        newColumnName = t["newColumnName"] 
        
        colsSelected = []
        for field in df.schema.fields:  
            if field.name == columnName: 
                colsSelected.append( col(field.name).alias(newColumnName) )
            else:
                colsSelected.append( col(field.name) )    
        result = df.select( colsSelected )
        return result    
    elif t["type"] == 'newColumn':
        columnName = t["columnName"]
        expression = t["expression"] 
        
        colsSelected = []

        for field in df.schema.fields:  
            colsSelected.append( field.name )         
  
        result =  df.select_expr(*colsSelected, expression + " as " + columnName)
        return result   
    if t["type"] == 'localFilter':
        for f in t["listValues"]:
            columnName = f["columnName"]
            filterValues = f["filterValues"]
            df = df.filter( columnName + " in (" + filterValues + ")" )
        return df             
       
def findColumnInColumnList(col, columns):
    for c in columns:
        if col.getName() == c.getName():
            return True
    return False
    
def updateModelSamplesRecursive(collection, modelId):

    doc_ref = db.collection(collection).document(modelId)
    doc = doc_ref.get()
    joinNode = doc.to_dict() 
    
    #get the initial read of the table and write its results
    df = getInitialRead( joinNode )
    sqlResultGeneric = toSqlGeneric( df )
    doc_ref = firestore.client().collection(collection + "/" + modelId + "/sampledata").document(joinNode["transformations"][0]["id"])
    doc_ref.set(sqlResultGeneric)
    
    #now make the join with all their childs and write as a second transaformation
    childCollection = collection+"/"+modelId+"/JoinNode"
    query = firestore.client().collection(childCollection)
    docs = query.get()

    joinNodeChilds = []
    for doc in docs:
        data =  doc.to_dict() 
        joinNodeChilds.append(data)
    
    for childJoinNode in joinNodeChilds:  
        childdf = updateModelSamplesRecursive(childCollection , childJoinNode["id"]) 
        
        #add all the columns from the parent
        colsSelected = []
        for field in df.schema.fields:  
            colsSelected.append( df.col(field.name).alias(field.name) )
        #for each column check in the child check if it exist in the left then remove it from the selection
        for field in childdf.schema.fields: 
            if findColumnInColumnList(childdf.col(field.name), colsSelected): 
                #no not add
                None         
            else:
                colsSelected.append( childdf.col(field.name) )    
        
        joinCriterias = childJoinNode["joinCriteria"]
        if len(joinCriterias) > 0: #only make join if there is at leas a rule
            joinConditions = None 
            for join in joinCriterias:
                leftValue = join["leftValue"]
                comparator = join["comparator"]
                rightValue = join["rightValue"]
                condition = df.col(leftValue) == childdf.col(rightValue)
                if joinConditions:
                    joinConditions = joinConditions and condition
                else:
                    joinConditions = condition
            df = df.join(childdf, joinConditions).select( colsSelected )
    
    #now update the result of the join
    if len(joinNodeChilds) > 0:
        sqlResultGeneric = toSqlGeneric( df )
    doc_ref = firestore.client().collection(collection + "/" + modelId + "/sampledata").document(joinNode["transformations"][1]["id"])
    doc_ref.set(sqlResultGeneric)
        
        
    #now apply all other transformations     
    for i in range(2, len(joinNode["transformations"])):
        t = joinNode["transformations"][i]
        df = applyTransformation( df , t)
        sqlResultGeneric = toSqlGeneric( df, 10 )
        doc_ref = firestore.client().collection(collection + "/" + modelId + "/sampledata").document(joinNode["transformations"][i]["id"])
        doc_ref.set(sqlResultGeneric)

    return df    
    
#expecting the collection "Model" and the id of the model
#will retrieve the first child and update all from there
def updateModelSamples(req):
    collection = req['collection']
    modelId = req["id"]   
    print("updateModelSamples called.\n")     
    print("collection:" + collection)
    print("modelId:" + modelId)
    
    childCollection = collection+"/"+modelId+"/JoinNode"
    query = firestore.client().collection(childCollection)
    docs = query.get()

    if len(docs) > 0:
        data =  docs[0].to_dict()
        df = updateModelSamplesRecursive(childCollection, data["id"])
        columns = df.columns
        firestore.client().collection(collection).document(modelId).update({"columns": columns})

    obj ={
        "result":"success",
    } 
    
    print("executeModelById END")
    return obj 


#Duplicate model overwritting the properties in overwrites obj
# {
#  id:/
#  overwrites:{ label:"newName" , "otherproperty":"overwrittenValue"} 
# }
def ModelDuplicate(req):
    id = req["id"]        
    overwrites = req["overwrites"]
    print("collection:" + id)
    print("modelId:" + json.dumps(overwrites))
    
    collection = "Model"
    
    new_obj = firestore_db.dupDocument(collection, id, overwrites, exceptions=[])
    
    obj ={
        "result":"success",
        "id":new_obj["id"]
    } 
    
    print("ModelDuplicate END")
    return obj 

    
if __name__ == '__main__':
    print("datamesh_base compiled")    
 