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
            "collection":"Model/df4978e5-4336-42cf-af62-d30cc8aeacc9/JoinNode/194914ab-2893-45b7-87d8-6848ee285139/JoinNode",
            "id":"c4d4bc3f-6303-423d-9a59-869fd55de3b6"
        }
        
        obj = updateModelSamples( req )
        print(json.dumps(obj))


if __name__ == '__main__':
    unittest.main()