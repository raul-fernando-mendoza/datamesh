import unittest
import json
import logging
import snowflake.connector


    

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        print("hello")
        
              
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
        
        cur = conn.cursor()
        try:
            desc = cur.describe("select NOTE_CREATION_DATE from DA_PRD_V1.da_smt.historic_notes_vw limit 10")
            for d in desc: 
                print( "name:" + d.name + " type:" + str(d.type_code) + " precision:" + str(d.precision) + " scale:" + str(d.scale) + "\n")
            
            cur.execute("select NOTE_CREATION_DATE from DA_PRD_V1.da_smt.historic_notes_vw limit 10")
            
            ret = cur.fetchmany(3)
            #print(ret)
            for row in range(0,len(ret)):
                for c in range(0,len(ret[row])):
                    print('%s' % (ret[row][c]))            
        finally:
            cur.close()
            
        conn.close()
        
if __name__ == '__main__': 
    unittest.main()        