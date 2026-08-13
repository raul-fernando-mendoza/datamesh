import unittest
import json
import logging
import firebase_admin

firebase_admin.initialize_app( )
from datamesh_flask.bsnrules import getOdbcConnection
from datamesh_flask.snowflake_odbc import executeSql
#takes the connection from the environment variable FIREBASE_CONFIG make sure is development
from datamesh_flask.firestore_db import getEncryptedDocument

log = logging.getLogger("datamesh")

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        
        conn = getOdbcConnection("6b81f387-0457-4a47-a44a-dd9d34e60e41")
        print("using session:" + str(conn))

        result = executeSql(conn,"select 1 from dual")
        resultSetStr = []
                        
        for row in result["resultSet"]:
            obj={}
            for i in range(len(row)):
                obj[str(i)]=row[i]
            print(obj)
                


if __name__ == '__main__':
    unittest.main()