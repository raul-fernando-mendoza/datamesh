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
            "id":"testABCD",
            "data":{
                "label":"test1",
                "password":"secret1",
                "description":"esto no esta encriptado"
            },
            "unencriptedFields":["label","description"]
        }
        obj = bsnrules.setEncryptedDocument( req )
        print(json.dumps(obj))


if __name__ == '__main__':
    unittest.main()