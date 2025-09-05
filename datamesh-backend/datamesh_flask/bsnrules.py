import json
import datamesh_flask.firestore_db as firestore_db
import datamesh_flask.datamesh_base as datamesh_base
import datamesh_flask.snowflake_odbc as snowflake_odbc
from google.api_core.datetime_helpers import DatetimeWithNanoseconds
import pandas as pd

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
    
if __name__ == '__main__':
    print("datamesh_base compiled")    
            
        
        
        
         
    
    
