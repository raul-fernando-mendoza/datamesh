from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Cipher import AES, PKCS1_OAEP

import os

def encrypt( str ):
    current_working_directory = os.getcwd()

    # print output to the console
    print("current_working_directory:" + current_working_directory)

    recipient_key = RSA.import_key(open("./keys/publickey.pem").read())
    # Encrypt the session key with the public RSA key
    cipher_rsa = PKCS1_OAEP.new(recipient_key)
    
    session_key = get_random_bytes(16)
    enc_session_key = cipher_rsa.encrypt(session_key)
    # Encrypt the data with the AES session key
    
    cipher_aes = AES.new(session_key, AES.MODE_EAX)
    ciphertext, tag = cipher_aes.encrypt_and_digest(str.encode('utf-8'))

    obj = {
        "enc_session_key":enc_session_key, 
        "nonce":cipher_aes.nonce, 
        "tag":tag, 
        "ciphertext":ciphertext        
    }
    return obj
    
def decrypt(data):
    current_working_directory = os.getcwd()

    # print output to the console
    print("current_working_directory:" + current_working_directory)
    
    enc_session_key = data["enc_session_key"]
    nonce =  data["nonce"]
    tag = data["tag"]
    ciphertext = data["ciphertext"]   

    private_key = RSA.import_key(open("./keys/privatekey.pem").read())
    # Decrypt the session key with the private RSA key
    cipher_rsa = PKCS1_OAEP.new(private_key)
    session_key = cipher_rsa.decrypt(enc_session_key)

    # Decrypt the data with the AES session key
    cipher_aes = AES.new(session_key, AES.MODE_EAX, nonce)
    text = cipher_aes.decrypt_and_verify(ciphertext, tag)
    return text.decode("utf-8")
    
    