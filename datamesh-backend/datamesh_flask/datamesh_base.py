import os
from snowflake.snowpark import Session
from snowflake.snowpark.functions import col, sql_expr, lit, Column
import pandas as pd
import json


sessions = {
}


def setSession( connectionId, credentials ):
    print("setting session for:" + connectionId)
    sess = Session.builder.configs(credentials).create()
    print("session generated:" + str(sess))
    sessions[connectionId] = sess       
    return sess 

def getSession( connectionId ):
    print("retriving session for:" + connectionId)
    if connectionId in sessions:
        print("session found:")
        return sessions[connectionId]
    else:
        return None


def database(sess):
    r = sess.sql("select current_warehouse() warehouse, current_database() database, current_schema() schema").collect()
    return {
        "warehouse":r[0]['WAREHOUSE'],
        "database":r[0]['DATABASE'],
        "schema":r[0]['SCHEMA']
    }

#return the fields of a query or the fields of a csv
# req = { "qry":"select * from dual"}
# or
# req = { "csvfile": "c://my_file.csv"}  
def getFielsForQuery(sess, qry ):
    print("getFielsForQuery called")
    
    fields = []
    
    if qry: 
        r = sess.sql(qry)
        for field in r.schema.fields:
            fields.append( { "name":str(field.name) , "datatype":str(field.datatype)} ) 
        return {"fields":fields}
"""
    else:
        csvfile:str = req["csvfile"] if "csvfile" in req else None
        print("read csv")
        leftDF = pd.read_csv(csvfile, sep = ',', dtype = {'ACCOUNT': int,'CLUB': str,
                                                      'AMOUNT': float,'ACCOUNT_SHORT_DESC': str})
        print( leftDF.head(10) ) 
        types = leftDF.dtypes
        for columnName in leftDF.columns.tolist():
            fields.append( { "name":str(columnName) , "datatype":str(types[columnName].name)} ) 
        return {"fields":fields}               
"""    

def executeJoin( leftSess, leftQry, leftCols,
                            rightSess, rightQry, rightCols, 
                            joinColumns,
                            filter):
    
    if leftQry and rightQry:

        leftColsSelected = []
        for ct in leftCols:
            if ct["isSelected"]:
                fn:str = ct["name"] 
                fa:str = ct["alias"] if "alias" in ct and ct["alias"] != "" else ct["name"]
                leftColsSelected.append( col(fn).alias(fa) )
            
        print("run query left")
        leftDF = leftSess.sql(leftQry).select( leftColsSelected )
        print( leftDF.schema.fields)        
        leftDF.show()
        
        rightColsSelected = []    
        for ct in rightCols:
            if ct["isSelected"]:
                fn:str = ct["name"] 
                fa:str = ct["alias"] if "alias" in ct and ct["alias"] != "" else ct["name"]
                rightColsSelected.append( col(fn).alias(fa) )

        print("run query right")
        rightDF = rightSess.sql(rightQry).select(rightColsSelected)                  
        rightDF.show()
        print( rightDF.schema.fields)        

        #here both sources fields have been replaced with aliases so proceed with the join  
        #snowspark does not allow for for suffix as parameter so output has to be renamed manually for duplicated columns

        finalColumns = []
        
        for ct in leftCols:
            if ct["isSelected"]:
                fn:str = ct["name"] 
                fa:str = ct["alias"] if "alias" in ct and ct["alias"] != "" else ct["name"] 
                finalColumns.append( leftDF[fa].alias(fa) )         
        #append the column with its alias if it does not exist in the left  
        for ct in rightCols:
            if ct["isSelected"]:            
                fn:str = ct["name"] 
                fa:str = ct["alias"] if "alias" in ct and ct["alias"] != "" else ct["name"]            
                firstOcurrJoin = next( (jc for jc in joinColumns if (jc == fa)), None)
                if firstOcurrJoin == None: #only add the righ column if it is not part of the join
                    #now search for the right column in the left columns 
                    firstOcurrLeft = next( (lc for lc in leftCols 
                                        if ( lc["alias"] if "alias" in lc and lc["alias"] != "" else lc["name"]) == fa
                                        ), None)
                    if firstOcurrLeft == None:
                        print("Not found in left:" + fa + " " + str(firstOcurrLeft) )
                        finalColumns.append( rightDF[fn].alias(fa) )
                    else: #here the column exist in the left then append with suffix 
                        finalColumns.append( rightDF[fn].alias(fa + "_r") )
                
        print( "allColumns")
        print( finalColumns )
        
        print("join columns")
        for jc in joinColumns:
            print(jc)

        if leftSess == rightSess :
                
            print("left join right 1")   
            df = leftDF \
                .join( right=rightDF, 
                    using_columns=joinColumns,
                    join_type= "full",
                    lsuffix='_l', rsuffix='_r'
                    )  \
                    .select( finalColumns ) \
                    .sort( joinColumns )
                
            df.show()    
                
            #now apply filters if there is any
            print("apply filter")
            if filter and len(filter.strip())>0:
                df = df.filter(filter)
                
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
            print("executeJoin END")
            return obj 
        else: #join with pandas
            print("pandas left collect")
            leftpDF = pd.DataFrame(data=leftDF.collect())
            print( leftpDF.head() ) 
            
            print("pandas right collect")
            rightpDF = pd.DataFrame(data=rightDF.collect()) 
            print( rightpDF.head() )
           
            if leftpDF.empty:
                print("left empty add left cols to right:" + str(joinColumns))
                for c in leftDF.columns:
                    print(c)
                    if c not in joinColumns:
                        if c in rightDF.columns:
                            rightpDF.rename(columns={c: c + "_r"}, inplace=True)
                        rightpDF[c] = None 
                pDf = rightpDF                 
            
            elif rightpDF.empty :
                print("right empty add right colums to left:" + str(joinColumns))
                for c in rightDF.columns:
                    print(c)
                    if c not in joinColumns:
                        if c in leftDF.columns:
                            leftpDF[c + "_r"] = None
                        else: 
                            leftpDF[c] = None 
                pDf = leftpDF                
                
            else:
                print("left join pandas")   
                pDf = pd.merge( leftpDF, 
                    rightpDF, 
                    on=joinColumns,
                    how = "outer",
                    suffixes=('', '_r'))  

            print("join result:")
            print( pDf.head() )
            
            if not pDf.empty:
                print("check filter")
                if filter and len(filter.strip())>0:
                    print("apply filter:" + filter)
                    pDf = pDf.query(filter)
                
                print("apply sort")   
                pDf = pDf.sort_values(by = joinColumns)    
                    
                print( pDf.head() )
                records = pDf.iloc[:200].to_json(orient = "records")

                print("retrive datatype from panda dataframe")   
                fields = []
                
                for columnName,datatype in pDf.dtypes.iteritems():
                    fields.append( { "name":str(columnName) , "datatype":str(datatype)} )   
                obj ={
                    "records":json.loads(records),
                    "schema":fields
                }                           
            else:
                records = []
                fields = []
                for c in finalColumns:
                    print("c:" + c.getName() )
                    fields.append({ "name":c.getName() , "datatype":"StringType(1)" })
                print("end empty result")           
                obj ={
                    "records":[],
                    "schema":fields
                }

            return obj            
    else: #we have to do the join using pandas
        print("run query left")
        leftDF = pd.read_csv(leftFile, sep = ',', dtype = {'ACCOUNT': int,'CLUB': str,
                                                      'AMOUNT': float,'ACCOUNT_SHORT_DESC': str})
        
        print( leftDF.head(10) )
        print("run query right")
        r_Dataframe = right_sess.sql(rightQry)
        r_Dataframe.show()
        rightDF = pd.DataFrame(data=r_Dataframe.collect())
        
        
        columnsArray = []
        for ct in leftCols:
            fn:str = ct["name"] 
            fa:str = ct["alias"] if "alias" in ct else ct["name"]
            columnsArray.append( fn.upper() )
        for ct in rightCols:
            fn:str = ct["name"] 
            fa:str = ct["alias"] if "alias" in ct else ct["name"]
            firstOcurr = next( (lc for lc in leftCols if lc["name"] == fa), None)
            if firstOcurr == None:
                columnsArray.append( fn.upper() )
        
        print("left join right 2")   
        df = pd.merge( leftDF, 
                rightDF, 
                on=joinColumns,
            how = "outer")
        #    .sort_values( joinColumns )
        print("selecting columns")
        
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
    sess = getSession( req["connectionId"] )
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
    print(parentDF.schema)    
    parentDF.show()
    
    print("left query")
    leftOnlyDF = sess.sql(leftQry)        
    print(leftOnlyDF.schema)
    leftOnlyDF.show()
    
    print("right query")
    rightOnlyDF = sess.sql(rightQry)
    print(rightOnlyDF.schema)
    rightOnlyDF.show()
        
    
    print("prepare the names fot the left inner join")
    
    leftJoinColumns = [] #join columns vs parent
    leftColumnsNames = [] #all the columns in the left
    leftColumnsAliasArray = [] #names overwritten to the parent join
    for ct in leftColumns:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct  else ct["name"] 
        firstOcurr = next( (parentColumn for parentColumn in joinColumns if parentColumn == fn), None)
        if firstOcurr != None:
            leftJoinColumns.append( fn )
        leftColumnsNames.append( leftOnlyDF[fn] )   
        leftColumnsAliasArray.append( leftOnlyDF[fn].alias(fa) )
        
    #first join the parent with the left using all the common fields
    print("parent join left")
    print("join columns:" + str(leftJoinColumns))
    leftDF = parentDF \
        .join( right=leftOnlyDF,
              using_columns=leftJoinColumns,
          join_type= "inner")\
              .select( leftColumnsNames )

    print("left Dataframe")    
    leftDF.show() 
    print("left count:" + str(leftDF.count()) ) 
    
    rightJoinColumns = []  
    rightColumnNames = [] 
    rightColumnsAliasArray = [] 
    for ct in rightColumns:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct else ct["name"] 
        firstOcurr = next( (parentColumn for parentColumn in joinColumns if parentColumn == fn), None)
        if firstOcurr != None:
            rightJoinColumns.append( fn )
        rightColumnNames.append( rightOnlyDF[fn] )
        rightColumnsAliasArray.append( rightOnlyDF[fn].alias(fa) )
            
    print("parent join right")
    print("joinclumns:" + str(rightJoinColumns))
    rightDF = parentDF \
        .join( right=rightOnlyDF
        ,using_columns=rightJoinColumns,
          join_type= "inner")\
        .select( rightColumnNames ) 
    
    print("right data")
    print(rightDF.schema)
    rightDF.show()    
    print("right count:" + str(rightDF.count())) 
    
    #prepare the names of the outerjoin
    leftRighJoinColumns = leftColumnsAliasArray #pick from right only those that does not exist in left 
    
    for ct in rightColumns:
        fn:str = ct["name"] 
        fa:str = ct["alias"] if "alias" in ct else ct["name"]
        
        
        firstOcurrLeft = next( (jc for jc in joinColumns if (jc == fn)), None)
        if firstOcurrLeft == None: #only add the righ column is if it is not part of the join

            firstOcurrLeft = next( (lc for lc in leftColumns if (lc["alias"] if "alias" in lc else lc["name"] == fa)), None)
            if firstOcurrLeft == None: #the righ column does not exist in left so pick it.
                leftRighJoinColumns.append( rightOnlyDF[fn].alias(fa) )
            else:
                #the righ column exist in left add the
                leftRighJoinColumns.append( rightOnlyDF[fn].alias(fa + "_r") )   
        
    #now do an ounter join between both resulting columns
    print("left join right")
    print("joincolumns:" + str(joinColumns))
    df = leftDF \
        .join( right=rightDF 
        ,using_columns=joinColumns
          ,join_type= "full") \
         .select( 
                 leftRighJoinColumns
                )
             
    df.show()
    print("export to json")
    collected = df.limit(2000).collect()
    p_df = pd.DataFrame(data=collected)
    obj = p_df.to_json(orient = "records")   
    #print(json.dumps({"result":obj},indent=4))
    print("executeChildJoin END")
    return obj 



if __name__ == '__main__':
    print("datamesh_base compiled")