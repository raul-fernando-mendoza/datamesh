
import threading
import firebase_admin
firebase_admin.initialize_app( )
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import requests

#using flask
#url = "http://localhost:5000/executeSqlByPath"
#using unicorn
url = "http://127.0.0.1:8000/executeSqlByPath"


callback_done = threading.Event()

# Create a callback on_snapshot function to capture changes
def on_snapshot(doc_snapshot, changes, read_time):
    print("something changed")
    for doc in doc_snapshot:
        print(f"Received document snapshot: {doc.reference.path}")
        data = doc.to_dict()
            #print(f"Received document: {doc.to_dict()}")
        for change in changes:
            if change.type.name == "ADDED" and data["request_status"] == "requested":
                print(f"Added: {change.document.id}")
                path=doc.reference.path
                payload = {"path":path}
                response = requests.post(url, json=payload)
                response_json = response.json()
                print(response_json)
                
                #if( response_json["status"] != "success"):
                #    doc.reference.update({"request_status": response_json["status"]})            
                
            elif change.type.name == "MODIFIED":
                print(f"Modified: {change.document.id}")
            elif change.type.name == "REMOVED":
                print(f"Removed: {change.document.id}")
    callback_done.set()
    
db = firestore.client()

#doc_ref = db.collection("SqlJupiterDoc/b8d2a095-2bda-4bef-9d56-8130280f43e1/SqlJupiter").document("d683fea3-a79f-47e8-a0a3-642f359804c6")
doc_ref = db.collection_group("SqlJupiter").where(
    filter=FieldFilter("request_status", "==", "requested")
)

# Watch the document
doc_watch = doc_ref.on_snapshot(on_snapshot)

input("Press Enter to continue...")