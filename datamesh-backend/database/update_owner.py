import firebase_admin
from firebase_admin import firestore
import json
import logging
import uuid
from datetime import datetime

firebase_admin.initialize_app()

log = logging.getLogger("cheneque")

db = firestore.client()

docRef = db.collection_group("SqlJupiterDoc").get()

for doc in docRef:
    e = doc.to_dict()
    print( e["label"] )

    if not "owner" in e :
        json = {
            "owner":'Ur6fSk7hAERU7vCGGevmFQwEbOK2',
            "deleted":False
        }        
        doc.reference.update(json)
    