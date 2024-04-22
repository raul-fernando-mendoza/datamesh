####deploye instructions
#create the requirements.txt 
python -m pip freeze > requirements.txt 

#create the virtual environment
python3 -m venv .venv

#activate virtual environment
. .venv/bin/activate

#update pip 
python3 -m pip install --upgrade pip

#install requirements
python3 -m pip install -r requirements.txt

#Install Flask: from datamesh_flask folder run
python -m pip install Flask
python -m pip install Flask-JSON

#run gunicorn: from datamesh_backend folder run
gunicorn -w 4 'datamesh_main:app'

#run with flaks: from datamesh_backend folder run
flask --app datamesh_main run

#run in a remote server
flask --app datamesh_main run --debug --host=192.168.1.14 

#run the service
python3 datamesh_persistent.py





curl -UseBasicParsing http://127.0.0.1:5000/get_time

curl.exe http://localhost:5000/getFielsForQuery -H "Content-type:application/json" -X POST -d "@.\\data.json"

curl.exe http://localhost:5000/getFielsForQuery -H "Content-type:application/json" -X POST -d @data.json

curl.exe http://localhost:5000/getFielsForQuery -H "Content-type:application/json" -X POST -d "@.\\getFielsForQuery_test.json"

curl.exe http://localhost:5000/executeSql -H "Content-type:application/json" -X POST -d "@.\\sql_data.json"


//to run test 
from main directory execute the following to create the package:
python -m pip install -e .
//open the test and execute.

//
sudo ufw allow 5000

//login using keys
to generate the private key
openssl genrsa 2048 | openssl pkcs8 -topk8 -v2 des3 -inform PEM -out rsa_key.p8
to generate a public key
openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub





