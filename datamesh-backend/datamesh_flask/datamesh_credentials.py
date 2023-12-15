import json
from datamesh_flask.firestore_db import  getEncryptedDocuments

def getCredentials(connectionName):
    connections = getEncryptedDocuments("connections",[( "name", "==", connectionName)])
    if len(connections)>0:
        return json.loads(connections["credentials"])
    
    