import firebase_admin
from firebase_admin import firestore
import json
import logging
import uuid
from datetime import datetime

firebase_admin.initialize_app()

log = logging.getLogger("cheneque")

db = firestore.client()

docRef = db.collection_group("SqlJupiterGroup").get()

for doc in docRef:
    createon = datetime.fromtimestamp(doc.create_time.seconds) 
    updateon = datetime.fromtimestamp(doc.update_time.seconds) 
    e = doc.to_dict()
    print( e["label"] )
    json = {
        "updateon":createon,
        "createon":updateon,
        "updatedon":firestore.DELETE_FIELD
    }
    doc.reference.update(json)