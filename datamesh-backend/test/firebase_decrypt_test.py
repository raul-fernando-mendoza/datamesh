import unittest
import json
import logging
import firebase_admin
#takes the connection from the environment variable FIREBASE_CONFIG make sure is development
firebase_admin.initialize_app( )
from datamesh_flask.firestore_db import getSingleEncryptedDocumentValue

log = logging.getLogger("datamesh")

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        
        str = getSingleEncryptedDocumentValue( "secrets", "test")
        print(str.decode('utf-8'))


if __name__ == '__main__':
    unittest.main()