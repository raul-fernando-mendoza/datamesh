from datamesh_flask.encrypt_lib import encrypt, decrypt

obj = encrypt( "hola" )
result = decrypt( obj )
print( "result" + str(result) )