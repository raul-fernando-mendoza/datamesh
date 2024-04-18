import json
import datamesh_flask.firestore_db as firestore_db
import datamesh_flask.datamesh_base as datamesh_base
import datamesh_flask.snowflake_odbc as snowflake_odbc

from firebase_admin import firestore

db = firestore.client()

def getCredentials(connectionId):
    connection = firestore_db.getEncryptedDocument("Connection",connectionId)
    return json.loads( connection["credentials"] )
    
def getSnowparkSession( connectionId ):
     
    sess = datamesh_base.getSession( connectionId )
    if sess == None:
        credentials = getCredentials( connectionId )
        print("connection" + str(credentials["database"])) 
        print("role" + str(credentials["role"])) 
        sess = datamesh_base.setSession( connectionId, credentials)
    return sess

def getOdbcConnection( connectionId ):
     
    conn = snowflake_odbc.getOdbcConnection( connectionId )
    if conn == None:
        credentials = getCredentials( connectionId ) 
        conn = snowflake_odbc.setOdbcConnection( connectionId, credentials)
    return conn

def getDatabaseDetails( connectionId ):
    sess = getSnowparkSession( connectionId )
    result = datamesh_base.database( sess )
    return result

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
    leftSess = getSnowparkSession( req["left_connectionId"] )
    rightSess = getSnowparkSession( req["right_connectionId"] )

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
    sess = getSnowparkSession( req["connectionId"] )
    qry = req["qry"] if "qry" in req else None
    
    return datamesh_base.getFielsForQuery( sess, qry )

#run as req = { 
# path:'SqlJupiterDoc/b8d2a095-2bda-4bef-9d56-8130280f43e1/SqlJupiter/34a89c65-ad66-4b5e-b0e4-2c737c1faa97'
# }
def executeSqlByPath(req):
        path = req["path"]
        
        basepathArr = path.split("/")
        
        id = basepathArr[-1]

        basepath = "/".join( map(str,basepathArr[:-1]) )        
        
        doc_ref = db.collection(basepath).document(id)
        doc = doc_ref.get()
        
        data = doc.to_dict() 
        
        connectionId = data["connectionId"]
        print("connectionId:" + connectionId)
        
        sql = data["sql"]
        
        conn = getOdbcConnection(connectionId)
   
        print("using session:" + str(conn)) 
        
        updateObj = {
            "request_status":"inprogress",
        }
        
        doc_ref.update( updateObj )        
        print("**** status set to inprogress")
            
        result = snowflake_odbc.executeSql(conn, sql)
        
        resultSetStr = []
        
        for row in result["resultSet"]:
            obj={}
            for i in range(len(row)):
                obj[str(i)]=row[i]
            resultSetStr.append( obj )
        
        updateObj = {
            "request_status":"completed",
            "result_metadata":result["metadata"],
            "result_set":resultSetStr
        }
        doc_ref.update( updateObj )
        
        return { "status":"success"}

if __name__ == '__main__':
    print("datamesh_base compiled")    
            
        
        
        
         
    
    
