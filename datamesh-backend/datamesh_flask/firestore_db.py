from firebase_admin import firestore
import logging

import base64
import os

from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Cipher import AES, PKCS1_OAEP


log = logging.getLogger("cheneque")

db = firestore.client()

def addSingleEncryptedDocumentValue( collectionId, id, data ):

    recipient_key = RSA.import_key(open("./../keys/publickey.pem").read())
    session_key = get_random_bytes(16)

    # Encrypt the session key with the public RSA key
    cipher_rsa = PKCS1_OAEP.new(recipient_key)
    enc_session_key = cipher_rsa.encrypt(session_key)

    # Encrypt the data with the AES session key
    cipher_aes = AES.new(session_key, AES.MODE_EAX)
    ciphertext, tag = cipher_aes.encrypt_and_digest(data.encode('utf-8'))
    
    obj = {
        "enc_session_key":enc_session_key, 
        "nonce":cipher_aes.nonce, 
        "tag":tag, 
        "ciphertext":ciphertext        
    }
    doc_ref = db.collection(collectionId).document(id)
    doc_ref.set(obj)    
    return obj
    


def getSingleEncryptedDocumentValue(collectionId, id):
    private_key = RSA.import_key(open("./../keys/privatekey.pem").read())
    
    doc_ref = db.collection(collectionId).document(id)

    doc = doc_ref.get()
    data = None 
    
    if doc.exists:
        data = doc.to_dict()
    else:
        return None   

    enc_session_key = data["enc_session_key"]
    nonce =  data["nonce"]
    tag = data["tag"]
    ciphertext = data["ciphertext"]

    # Decrypt the session key with the private RSA key
    cipher_rsa = PKCS1_OAEP.new(private_key)
    session_key = cipher_rsa.decrypt(enc_session_key)

    # Decrypt the data with the AES session key
    cipher_aes = AES.new(session_key, AES.MODE_EAX, nonce)
    data = cipher_aes.decrypt_and_verify(ciphertext, tag)
    print(data.decode("utf-8"))
    return data 
  

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
    
if __name__ == '__main__':
    print("firestore_db ran nothing")