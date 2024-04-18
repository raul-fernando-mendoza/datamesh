create the requirements.txt 
python -m pip freeze > requirements.txt

from datamesh_flask folder run
python -m pip install Flask
python -m pip install Flask-JSON

from datamesh_backend folder run
flask --app datamesh_main run --debug --host=192.168.1.14 

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





