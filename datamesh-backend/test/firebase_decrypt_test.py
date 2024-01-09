import unittest
import json
import logging
import firebase_admin
#takes the connection from the environment variable FIREBASE_CONFIG make sure is development
firebase_admin.initialize_app( )
from datamesh_flask.firestore_db import getEncryptedDocument

log = logging.getLogger("datamesh")

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        
        obj = getEncryptedDocument( "connections", "c3fe5c67-1a18-4aff-b6ef-5faef9b6b5d2")
        print(json.dumps(obj))


if __name__ == '__main__':
    unittest.main()