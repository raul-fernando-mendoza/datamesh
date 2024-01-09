import json
import datamesh_flask.firestore_db as firestore_db
import datamesh_flask.datamesh_base as datamesh_base
import datamesh_flask.snowflake_odbc as snowflake_odbc




def getCredentials(connectionId):
    connection = firestore_db.getEncryptedDocument("Connection",connectionId)
    return json.loads( connection["credentials"] )
    
def getSnowparkSession( connectionId ):
     
    sess = datamesh_base.getSession( connectionId )
    if sess == None:
        credentials = getCredentials( connectionId ) 
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

if __name__ == '__main__':
    print("datamesh_base compiled")    
            
        
        
        
         
    
    
