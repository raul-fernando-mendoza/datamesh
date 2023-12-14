import unittest
import json
import logging
import firebase_admin
#takes the connection from the environment variable FIREBASE_CONFIG make sure is development
firebase_admin.initialize_app( )
from datamesh_flask.firestore_db import addSingleEncryptedDocumentValue

log = logging.getLogger("datamesh")

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        
        addSingleEncryptedDocumentValue( "secrets", "test", "hola" )


if __name__ == '__main__':
    unittest.main()