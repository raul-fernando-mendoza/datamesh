import unittest
import json
import logging

from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Cipher import AES, PKCS1_OAEP

#python3 -m pip uninstall PyCrypto
#python3 -m pip uninstall PyCryptodome
#python3 -m pip install PyCryptodome

log = logging.getLogger("datamesh")

APP_NAME="datamesh"
    
data = "I met aliens in UFO. Here is the map.".encode("utf-8")
file_out = open("encrypted_data.bin", "wb")

recipient_key = RSA.import_key(open("keys/publickey.pem").read())
session_key = get_random_bytes(16)

# Encrypt the session key with the public RSA key
cipher_rsa = PKCS1_OAEP.new(recipient_key)
enc_session_key = cipher_rsa.encrypt(session_key)

# Encrypt the data with the AES session key
cipher_aes = AES.new(session_key, AES.MODE_EAX)
ciphertext, tag = cipher_aes.encrypt_and_digest(data)
[ file_out.write(x) for x in (enc_session_key, cipher_aes.nonce, tag, ciphertext) ]
file_out.close()


class TestFireStore(unittest.TestCase):
    #read private key, clean it and return usable key
    


    #decrypted encrypteddata file and print
    print("nothig here")


if __name__ == '__main__':
    unittest.main()