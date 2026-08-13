import unittest
import json
import logging
import firebase_admin
#takes the connection from the environment variable FIREBASE_CONFIG make sure is development
firebase_admin.initialize_app( )
import datamesh_flask.bsnrules as bsnrules

log = logging.getLogger("datamesh")

class TestFireStore(unittest.TestCase):

    def test01_testdatabase(self):
        
        req = {
            "collectionId":"Connection",
            "id":"6b81f387-0457-4a47-a44a-dd9d34e60e41"            
        }
        
        obj = bsnrules.getEncryptedDocument( req )
        print(json.dumps(obj))


if __name__ == '__main__':
    unittest.main()