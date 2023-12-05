import unittest
import json
import logging
import snowflake.connector
import types

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
    

conn = snowflake.connector.connect(
            type= "snowflake",
            account= "twentyfourhourfit.east-us-2.azure",
            user= "rmendoza@24hourfit.com",
            authenticator= "externalbrowser",
            role= "DA_ANALYTICS_RO_PRD",
            database= "DA_PRD_V1",
            warehouse= "BI_WH",
            schema= "DA_DW",
            threads= "1",
            client_session_keep_alive= "False",
            query_tag= "daily" 
        )

def getConnection():
    return conn
    
def executeSql(data:dict):
        sql = data["sql"]
        connection = getConnection()
        cur = connection.cursor()
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
        
