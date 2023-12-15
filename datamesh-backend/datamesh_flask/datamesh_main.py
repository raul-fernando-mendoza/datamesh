import logging
from datetime import datetime
from flask import Flask, request
from flask_json import FlaskJSON, JsonError, json_response, as_json
import firebase_admin
firebase_admin.initialize_app( )
import datamesh_base
import snowflake_odbc

logging.basicConfig(filename='datamesh.log', format='**** -- %(asctime)-15s %(message)s', level=logging.DEBUG)
log = logging.getLogger("datamesh")
log.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
log.addHandler(ch)


app = Flask(__name__)
FlaskJSON(app)

#this function handle the cors option request 
#return Null if the request is not "option" so the processing should continue
#if the return is not null the response should be returned to the browser

ALLOW_ORIGIN_HEADERS = {
        'Access-Control-Allow-Origin': '*'
} 

def handleCors(request):
    # We use 'force' to skip mimetype checking to have shorter curl command.
    print("getQueryFields called")
    log.info("**** receive:" + str(request))
    log.info("**** type:" + str(type(request)))
    log.info("**** method:" + str(request.method))
    log.info("**** content-type:" + str(request.content_type))
    log.info("**** mimetype:" + str(request.mimetype))    
    log.info("**** is_json:" + str(request.is_json))      
    log.info("**** get content_encoding:" + str(request.content_encoding))    
    log.info("**** get data:" + str(type(request.get_data())))
    log.info("**** decode:" + str(request.get_data().decode()))
        
    # For more information about CORS and CORS preflight requests, see:
    # https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request

    # Set CORS headers for the preflight request
    if request.method == 'OPTIONS':
        # Allows GET requests from any origin with the Content-Type
        # header and caches preflight response for an 3600s
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('Options accepted', 204, headers)
    else:
        return None    

@app.route('/get_time')
def get_time():
    print("get time called 2")
    now = datetime.utcnow()
    return json_response(time=now)


@app.route('/database', methods=['POST','OPTIONS'])
def getQueryFields():
    # We use 'force' to skip mimetype checking to have shorter curl command.
    headers = handleCors(request)
    if headers:
        return headers
        # Set CORS headers for the main request
    headers = ALLOW_ORIGIN_HEADERS
        
    print("data:"+ str(request.data))
    try:
        req = request.get_json(force=True)
        data = datamesh_base.database(req)
    except Exception as e:
        log.error("**** processRequest Exception:" + str(e))
        return ({"error":str(e)}, 200, headers)
    return ({"result":data}, 200, headers)

@app.route('/addEncryptedDocument', methods=['POST','OPTIONS'])
@as_json
def getConnectionNames():
    headers = handleCors(request)
    if headers:
        return headers
        # Set CORS headers for the main request
    headers = ALLOW_ORIGIN_HEADERS
        
    log.debug("data:"+ str(request.data))
    try:
        req = request.get_json(force=True)
        log.debug( str(req) )
        data = datamesh_base.addEncryptedDocument(req)
        
    except Exception as e:
        log.error("**** processRequest Exception:" + str(e))
        return ({"error":str(e)}, 400, headers)
    except:
        msg = "**** something went wrong:"
        log.error( msg)
        return ({"error":str(msg)}, 400, msg)  
    return (data, 200, headers)


@app.route('/getFielsForQuery', methods=['POST','OPTIONS'])
@as_json
def getFielsForQuery():
    headers = handleCors(request)
    if headers:
        return headers
        # Set CORS headers for the main request
    headers = ALLOW_ORIGIN_HEADERS
        
    log.debug("data:"+ str(request.data))
    try:
        req = request.get_json(force=True)
        log.debug( str(req) )
        data = datamesh_base.getFielsForQuery(req)
        
    except Exception as e:
        log.error("**** processRequest Exception:" + str(e))
        return ({"error":str(e)}, 400, headers)
    except:
        msg = "**** something went wrong:"
        log.error( msg)
        return ({"error":str(msg)}, 400, msg)  
    return (data, 200, headers)

@app.route('/executeJoin', methods=['POST','OPTIONS'])
@as_json
def executeJoin():
    headers = handleCors(request)
    if headers:
        return headers
        # Set CORS headers for the main request
    headers = ALLOW_ORIGIN_HEADERS
        
    log.debug("data:"+ str(request.data))
    try:
        req = request.get_json(force=True)
        log.debug( str(req) )
        data = datamesh_base.executeJoin(req)
        
    except Exception as e:
        log.error("**** processRequest Exception:" + str(e))
        return ({"error":str(e)}, 400, headers)
    return (data, 200, headers)


@app.route('/executeChildJoin', methods=['POST','OPTIONS'])
@as_json
def executeChildJoin():
    headers = handleCors(request)
    if headers:
        return headers
        # Set CORS headers for the main request
    headers = ALLOW_ORIGIN_HEADERS
        
    log.debug("data:"+ str(request.data))
    try:
        req = request.get_json(force=True)
        log.debug( str(req) )
        data = datamesh_base.executeChildJoin(req)
        
    except Exception as e:
        log.error("**** processRequest Exception:" + str(e))
        return ({"error":str(e)}, 400, headers)
    return (data, 200, headers)

@app.route('/executeSql', methods=['POST','OPTIONS'])
@as_json
def executeSql():
    headers = handleCors(request)
    if headers:
        return headers
        # Set CORS headers for the main request
    headers = ALLOW_ORIGIN_HEADERS
    log.debug("*** runQuery Start data:"+ str(request.data))
    try:
        req = request.get_json(force=True)
        log.debug( str(req) )
        data = snowflake_odbc.executeSql(req)
        log.debug("*** End runQuery:" + str(data))
        
    except Exception as e:
        log.error("**** processRequest Exception:" + str(e))
        return ({"error":str(e)}, 400, headers)
    return (data, 200, headers)     

if __name__ == '__main__':
    app.run()
