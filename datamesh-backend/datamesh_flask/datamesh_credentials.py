import json
from datamesh_flask.firestore_db import  getEncryptedDocument

def getCredentials(connectionId):
    connection = getEncryptedDocument("Connection",connectionId)
    return json.loads( connection["credentials"] )
    
    