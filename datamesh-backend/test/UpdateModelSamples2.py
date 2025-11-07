import unittest
import json
import logging
import firebase_admin

#takes the connection from the environment variable FIREBASE_CONFIG make sure is development
firebase_admin.initialize_app( )

from datamesh_flask.bsnrules  import updateModelSamples

log = logging.getLogger("datamesh")

class TestFireStore(unittest.TestCase):

    def test01(self):
        req = {
            "collection":"Model",
            "id":"78bbca8c-2401-443c-98d2-e8837c07727f"
        }
        
        obj = updateModelSamples( req )
        print(json.dumps(obj))


if __name__ == '__main__':
    unittest.main()