import logging
from datetime import datetime
from flask import Flask, request
from flask_json import FlaskJSON, JsonError, json_response, as_json
logging.basicConfig(filename='datamesh.log', format='**** -- %(asctime)-15s %(message)s', level=logging.DEBUG)
log = logging.getLogger("datamesh")
log.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
log.addHandler(ch)


app = Flask(__name__)
FlaskJSON(app)

import datamesh_flask.datamesh_base as datamesh_base
import snowflake_odbc


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
    print("getQueryFields called")
    log.error("**** receive:" + str(request))
    log.error("**** type:" + str(type(request)))
    log.error("**** method:" + str(request.method))
    log.error("**** content-type:" + str(request.content_type))
    log.error("**** mimetype:" + str(request.mimetype))    
    log.error("**** is_json:" + str(request.is_json))      
    log.error("**** get content_encoding:" + str(request.content_encoding))    
    log.error("**** get data:" + str(type(request.get_data())))
    log.error("**** decode:" + str(request.get_data().decode()))
        
    log.error("**** receive:" + str(request))
    log.error("**** type:" + str(type(request)))
    log.error("**** method:" + str(request.method))
    log.error("**** content-type:" + str(request.content_type))
    log.error("**** mimetype:" + str(request.mimetype))    
    log.error("**** is_json:" + str(request.is_json))      
    log.error("**** get content_encoding:" + str(request.content_encoding))    
    log.error("**** get data:" + str(type(request.get_data())))
    log.error("**** decode:" + str(request.get_data().decode()))

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

    # Set CORS headers for the main request
    headers = {
        'Access-Control-Allow-Origin': '*'
    }
        
    print("data:"+ str(request.data))
    try:
        req = request.get_json(force=True)
        data = datamesh_base.database()
    except Exception as e:
        log.error("**** processRequest Exception:" + str(e))
        return ({"error":str(e)}, 200, headers)
    return ({"result":data}, 200, headers)


@app.route('/getFielsForQuery', methods=['POST','OPTIONS'])
@as_json
def getFielsForQuery():
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

    # Set CORS headers for the main request
    headers = {
        'Access-Control-Allow-Origin': '*'
    } 
        
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

    # Set CORS headers for the main request
    headers = {
        'Access-Control-Allow-Origin': '*'
    } 
        
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

    # Set CORS headers for the main request
    headers = {
        'Access-Control-Allow-Origin': '*'
    } 
        
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
    headers = {
        'Access-Control-Allow-Origin': '*'
    } 
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
