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
        
        obj = getEncryptedDocument( "Connection", "c25a5c0b-25c5-49b0-83ab-1ac9f8f18a76")
        print(json.dumps(obj))


if __name__ == '__main__':
    unittest.main()