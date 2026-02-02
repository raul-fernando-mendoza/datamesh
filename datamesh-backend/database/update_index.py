import firebase_admin
from firebase_admin import firestore
import json
import logging
import uuid
from datetime import datetime
import re

firebase_admin.initialize_app()

def get_word_index_array(name: str):
    split_list = re.split(' |\_|,', name)
    index_list = []
    
    for i in range(len(split_list)):
        for y in range(1, len(split_list[i]) + 1):
            index_list.append(split_list[i][0:y].lower())
    
    return index_list


log = logging.getLogger("cheneque")

db = firestore.client()

docRef = db.collection_group("SqlJupiterGroup").get()

for doc in docRef:
    e = doc.to_dict()
    print( e["label"] )

    indxWords = get_word_index_array(e["label"])
    print( indxWords )
    
    json = {        
        "indexWords":indxWords
    }        
    doc.reference.update(json)
    