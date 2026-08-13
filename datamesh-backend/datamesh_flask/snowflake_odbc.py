import unittest
import json
import logging
import snowflake.connector

import datamesh_flask.snowflake_odbc as snowflake_odbc
import os
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization

odbcConnections ={}

def getOdbcConnection( connectionId ):   
    print("retriving odbcsession for:" + connectionId)
    if connectionId in odbcConnections:
        print("session found:")
        return odbcConnections[connectionId]
    else: None

def setOdbcConnection( connectionId , credentials):   
    print("retriving odbcsession for:" + connectionId)
    if connectionId in odbcConnections:
        print("session found:")
        return odbcConnections[connectionId]
    else:
        print("session not found")
        if "private_key" in credentials:

            private_key_str = credentials["private_key"]
            private_key_passphrase = credentials["private_key_passphrase"]

            private_key_bytes = private_key_str.encode("utf-8")
            private_key_object = serialization.load_pem_private_key(
                private_key_bytes,
                password=private_key_passphrase.encode("utf-8"),  # Use None if unencrypted
                backend=default_backend()
            )    

            sess = snowflake.connector.connect(
                type= credentials["type"],
                account= credentials["account"],
                user= credentials["user"],
                role= credentials["role"],
                private_key=private_key_object,
                private_key_passphrase= private_key_passphrase,
                database= credentials["database"],
                warehouse= credentials["warehouse"],
                schema= credentials["schema"],
                threads= credentials["threads"],
                client_session_keep_alive= credentials["client_session_keep_alive"],
                query_tag= credentials["query_tag"] 
            )
        elif "authenticator" in credentials:
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
        print("snowflake.setOdbcConnection generated:" + str(sess))
        odbcConnections[connectionId] = sess       
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
#  connectionId:"123-3434324-234242-42432423"
# })   
def executeSql(conn, sql):
        cur = conn.cursor()
        try:
            desc = cur.describe(sql)
            
            metadata = []
            print("sql fields:")
            for d in desc: 
                print( "-name:" + d.name + " type:" + str(d.type_code) + " precision:" + str(d.precision) + " scale:" + str(d.scale) + "\n")
                res = ResultMetadataDao(d)
                metadata.append( res )
                
            
            cur.execute(sql)
            
            print(cur.sfqid)
            
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
            print( "Exception executeSql:" + str(e) )
            raise e                           
        finally:
            cur.close()
        resultSetDao = ResultSetDao(sql, metadata, resultSet)
        print( "snowflake.executeSql ended OK" )
        return resultSetDao.toJson()
        
