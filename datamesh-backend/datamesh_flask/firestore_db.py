from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import logging
from datamesh_flask.encrypt_lib import encrypt,decrypt

import base64



log = logging.getLogger("cheneque")

db = firestore.client()

#store a document with all its fields encrypted, 
#Eonly the fields listed in unecryptedFields will be left plain text
def addEncryptedDocument( collectionId, id, data , unencryptedFields):
    
# get the current working directory
    
    obj = {
    }
    for key in data:
        if key not in unencryptedFields if unencryptedFields else []:
            obj[key]=encrypt(data[key])
        else:
            obj[key]=data[key]
    
    doc_ref = db.collection(collectionId).document(id)
    doc = doc_ref.get()
    if doc.exists:
        doc_ref.update(obj)
    else:
        doc_ref.set(obj)    
    return obj
    

#get a json replacing the attributes: ciphertext, enc_session, nonce, tag for text attribute decrypted
def getEncryptedDocument(collectionId, id):
    
    
    doc_ref = db.collection(collectionId).document(id)

    doc = doc_ref.get()
    
    data = None 
    if doc.exists:
        data = doc.to_dict()
    else:
        return None  
    
    result = {}
    
    for key in data:
        if "ciphertext" in data[key]:
            result[key] = decrypt( data[key] )
        else:
            result[key] = data[key]
    
    return result

def decryptDocument( data ):
    result = {}
    
    for key in data:
        if "ciphertext" in data[key]:
            result[key] = decrypt( data[key] )
        else:
            result[key] = data[key]
    
    return result    
  

def addSingleDocument(collectionId, id, data):
    try:
        db.collection(collectionId).document(id).set(data)
    except Exception as e:
        log.error("Exception addSubCollection:" + str(e) )
        raise
    finally:
        log.debug("addSingleSubCollectionToDoc end") 
    return data    

def getSingleDocument(collectionId, id):    

    doc_ref = db.collection(collectionId).document(id)

    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    else:
        return None
    
    
    
def getEncryptedDocuments(collectionId, filters = []):
    try:
        query = db.collection(collectionId)
        
        for filter in filters:
            field, comp, val = (filter)
            query = query.where(filter=FieldFilter(field, comp, val))
        
        docs = query.get()

        result = []
        for doc in docs:
            data = decryptDocument( doc.to_dict() )            
            result.append(data)
        return data

    except Exception as e:
        log.error("**** getDocsIDs Exception:" + str(e))
        raise e
    

             
      
if __name__ == '__main__':
    print("firestore_db ran nothing")