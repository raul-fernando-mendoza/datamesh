import unittest
import json
import logging
import firebase_admin
#takes the connection from the environment variable FIREBASE_CONFIG make sure is development
firebase_admin.initialize_app( )
from datamesh_flask.firestore_db import dupDocument

log = logging.getLogger("datamesh")

class TestFireStore(unittest.TestCase):

    def test01(self):
        
        obj = dupDocument( "Model", "f9512d25-9a8c-4b2f-ad4d-cf23b9a8873a", {"label":"new_metric"}, ["sampledata"])
        #print(json.dumps(obj))


if __name__ == '__main__':
    unittest.main()