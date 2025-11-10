from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import logging
from datamesh_flask.encrypt_lib import encrypt,decrypt
from google.api_core.datetime_helpers import DatetimeWithNanoseconds
import json
import uuid


log = logging.getLogger("cheneque")


#store a document with all its fields encrypted, 
#Eonly the fields listed in unecryptedFields will be left plain text
def setEncryptedDocument( collectionId, id, data , unencryptedFields):
    
    print("setEncryptedDocument")
    print("collectionId:" + str(collectionId))
    print("id:" + str(id))
    print("data:" + str(data))
    print("unencryptedFields" + str(unencryptedFields) )
    
    
    
    obj = {
    }
    for key in data:
        if key not in unencryptedFields if unencryptedFields else []:
            obj[key]=encrypt(data[key])
        else:
            obj[key]=data[key]
    
    doc_ref = firestore.client().collection(collectionId).document(id)
    doc = doc_ref.get()
    if doc.exists:
        doc_ref.update(obj)
    else:
        doc_ref.set(obj)  
        
    print("setEncryptedDocument end:" + str(obj))      
    return { id:id }
    

#get a json replacing the attributes: ciphertext, enc_session, nonce, tag for text attribute decrypted
def getEncryptedDocument(collectionId, id):
    
    print("getEncryptedDocument")
    print("collectionId:" + str(collectionId))
    print("id:" + str(id))    
    doc_ref = firestore.client().collection(collectionId).document(id)

    doc = doc_ref.get()
    
    data = None 
    if doc.exists:
        data = doc.to_dict()
    else:
        return None  
    
    result = {}
    
    for key in data:
        print( key + str( type( data[key]) ) )
        if isinstance( data[key] , dict) and "ciphertext" in data[key]:
            result[key] = decrypt( data[key] )
        elif isinstance( data[key] ,DatetimeWithNanoseconds):
            print("convering to date")
            t = data[key] 
            result[key] =   f'{t.year}-{t.month:02}-{t.month:02}' 
        else:
            result[key] = data[key]
            
    print( "end getEncryptedDocument:" + str(result))        
    
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
        firestore.client().collection(collectionId).document(id).set(data)
    except Exception as e:
        log.error("Exception addSubCollection:" + str(e) )
        raise
    finally:
        log.debug("addSingleSubCollectionToDoc end") 
    return data    

def getSingleDocument(collectionId, id):    

    doc_ref = firestore.client().collection(collectionId).document(id)

    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    else:
        return None
    
    
    
def getEncryptedDocuments(collectionId, filters = []):
    try:
        query = firestore.client().collection(collectionId)
        
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
    
    
def copySubCollection(transaction, parentDocRef, collectionId, sourceDoc, exceptions):
    values = None
    try:
        log.debug( "copy:" + collectionId )
        
        newDocRef = parentDocRef.collection(collectionId).document()
        
        parent_id_key = parentDocRef.parent.id + "_id"

        values = {"id":newDocRef.id , parent_id_key: parentDocRef.id}    
        documentJSON = sourceDoc.to_dict()
        for key in documentJSON:
            if key != "id" and isInExceptions(key, exceptions)==False:
                keyValue = documentJSON[key]
                if key != "id" and key != parent_id_key:
                    values[key] = documentJSON[key]
        transaction.create( newDocRef,values)
        #the new doc thas been created and now copy all the sub collections
        collections = sourceDoc.reference.collections()
        

        for subCollection in collections:
            if( isInExceptions(subCollection.id, exceptions)==False ):
                log.debug("collection %s", subCollection.id)
                subDocs = subCollection.get()
                values[subCollection.id] = []
                for subDoc in subDocs:
                    newCollection = copySubCollection(transaction, newDocRef, subCollection.id, subDoc, exceptions)
                    values[subCollection.id].append(newCollection)

    except Exception as e:
        log.error("Exception copySubCollection:" + str(e) )
        raise
    finally:
        log.debug("copySubCollection end")  
    return values

def isInExceptions( str:str, options):
    if options != None and "exceptions" in options:
        patterns = options["exceptions"]
        if isinstance(patterns,list):
            for pattern in patterns:
                if str.endswith( pattern ) == True:
                    log.debug("not coping:" + str)
                    return True
        else:
            raise Exception("exceptions shuld be a list of strings")
    
    return False
#copy object the fields in the name will be overritten
#options if the name ends with any of the string it will not be copied
#overwrittes = {
# id:"abcd"
# name:"newNameOfObject" 
#}
# exceptions = ["Path", "secretInfo"] 
def dupDocument(collection, id, overwrites, exeptions):
    logging.debug( "firestore dupObject called")
    #logging.debug( "obj:%s",json.dumps(id,  indent=4, sort_keys=True) )
    values = None
    try:
        db = firestore.client()

        docId = id
        
        docList = db.collection(collection).where(u"id", u"==", docId).get()
        if len(docList) < 1:
            raise("document to copy not found:" + docId)
        transaction = db.transaction()
        sourceDoc = docList[0]

        newDocRef = db.collection(collection).document()
        values = {"id":newDocRef.id }  
        #now copy all the fields 
        documentJSON = sourceDoc.to_dict()
        for key in documentJSON:
            if key != "id" and isInExceptions(key, exeptions)==False:
                keyValue = documentJSON[key]
                if key in overwrites: #the value can be overwritten from the source object
                    values[key] = overwrites[key]
                else:
                    values[key] = documentJSON[key]
  

        transaction.create( newDocRef,values)
        for collection in sourceDoc.reference.collections():
            if( isInExceptions(collection.id,exeptions) == False):
                values[collection.id] = []
                for subDoc in sourceDoc.reference.collection(collection.id).get():
                    subCollection = copySubCollection(transaction, newDocRef, collection.id, subDoc, exeptions)
                    values[collection.id].append(subCollection)
        transaction.commit()
        
      
    except Exception as e:
        log.error("Exception dupDocument:" + str(e) )
        raise
    finally:
        log.debug("dupDocument end")  
    #result = newDocRef.get().to_dict() 
    return values 
    
      
if __name__ == '__main__':
    print("firestore_db ran nothing")