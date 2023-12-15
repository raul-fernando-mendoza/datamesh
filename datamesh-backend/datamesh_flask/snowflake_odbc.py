import unittest
import json
import logging
import snowflake.connector
from datamesh_flask.datamesh_credentials import getCredentials

odbcsessions ={}

def getOdbcSession( connectionName ):   
    print("retriving odbcsession for:" + connectionName)
    if connectionName in odbcsessions:
        print("session found:")
        return odbcsessions[connectionName]
    else:
        print("session not found")
        credentials = getCredentials(connectionName)
        if "authenticator" in credentials:
            sess = snowflake.connector.connect(
                        type= credentials["type"],
                        account= credentials["account"],
                        user= credentials["user"],
                        authenticator= credentials["authenticator"],
                        role= credentials["role"],
                        database= credentials["database"],
                        warehouse= credentials["warehouse"],
                        schema= credentials["schema"],
                        threads= credentials["threads"],
                        client_session_keep_alive= credentials["client_session_keep_alive"],
                        query_tag= credentials["query_tag"]        
                )
        else:
            sess = snowflake.connector.connect(
                        type= credentials["type"],
                        account= credentials["account"],
                        user= credentials["user"],
                        password= credentials["password"],
                        role= credentials["role"],
                        database= credentials["database"],
                        warehouse= credentials["warehouse"],
                        schema= credentials["schema"],
                        threads= credentials["threads"],
                        client_session_keep_alive= credentials["client_session_keep_alive"],
                        query_tag= credentials["query_tag"]
            )          
        print("session generated:" + str(sess))
        odbcsessions[connectionName] = sess       
        return sess      

class ResultMetadataDao:
    def __init__(
        self,
        res
    ) -> None:
        self.name= res.name 
        self.type_code= res.type_code
        self.display_size= res.display_size
        self.internal_size= res.internal_size
        self.precision= res.precision
        self.scale= res.scale
        self.is_nullable= res.is_nullable
        
    def toJson(self):
        json = {
            "name":self.name,
            "type_code":self.type_code,
            "display_size":self.display_size,
            "internal_size":self.internal_size,
            "precision": self.precision,
            "scale":self.scale,
            "is_nullable":self.is_nullable            
        }
        return json    

class ResultSetDao:
    def __init__(
        self,
        sql:str,
        metadata:list,
        resultSet:list
    ) -> None:
        self.sql = sql
        self.metadata = metadata
        self.resultSet = resultSet
        
    def toJson(self) -> dict:
        metadataJson = []
        for m in self.metadata:
            metadataJson.append(m.toJson())
        json = {
           "sql":self.sql,
           "metadata":metadataJson,
           "resultSet":self.resultSet 
        }
        return json        
    



    
# usage executeSql({
#  sql:"select * from dual" 
#  connectionname:"DA_DEV"
# })   
def executeSql(data:dict):
        sql = data["sql"]
        connectionName = data["connectionname"]
        print("connectionName:" + connectionName)
        sess = getOdbcSession(connectionName)
   
        print("using session:" + str(sess)) 
        cur = sess.cursor()
        try:
            desc = cur.describe(sql)
            
            metadata = []
            for d in desc: 
                print( "name:" + d.name + " type:" + str(d.type_code) + " precision:" + str(d.precision) + " scale:" + str(d.scale) + "\n")
                res = ResultMetadataDao(d)
                metadata.append( res )
                
            
            cur.execute(sql)
            
            ret = cur.fetchmany(1000)
            
            resultSet = []
            #print(ret)
            for row in range(0,len(ret)):
                rowData = []
                for c in range(0,len(ret[row])):
                    print('%s' % (ret[row][c]))  
                    if ret[row][c] == None: 
                        rowData.append(None)
                    elif isinstance( ret[row][c] , ( int, float, bool )):
                        rowData.append(ret[row][c])         
                    else:
                        rowData.append(str(ret[row][c]))         
                        
                resultSet.append(rowData)
        except Exception as e: 
            raise e                           
        finally:
            cur.close()
        resultSetDao = ResultSetDao(sql, metadata, resultSet)
        return resultSetDao.toJson()
        
