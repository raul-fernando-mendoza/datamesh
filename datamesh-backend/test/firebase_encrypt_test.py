import unittest
import json
import logging
import uuid
import firebase_admin
#takes the connection from the environment variable FIREBASE_CONFIG make sure is development
firebase_admin.initialize_app( )
from datamesh_flask.firestore_db import addEncryptedDocument

log = logging.getLogger("datamesh")

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        credentials = json.dumps(
    {
      "type": "snowflake",
      "account": "",
      "user": "",
      "password": "",
      "role": "",
      "database": "",
      "warehouse": "",
      "schema": "",
      "threads": "1",
      "client_session_keep_alive": "False",
      "query_tag": "daily" 
    }            
        )
        id = str(uuid.uuid4())
        
        addEncryptedDocument( 
                             "connections"
                            ,id
                            ,{
                                "owner":"abc",
                                "group":"admins",
                                "name":"DA_DBT_DEV_SVC",
                                "credentials":credentials
                            }
                            ,["owner","group","name"]
                            )


if __name__ == '__main__':
    unittest.main()