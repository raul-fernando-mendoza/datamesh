python -m pip install Flask
python -m pip install Flask-JSON
flask --app datamesh_qry run --debug

curl -UseBasicParsing http://127.0.0.1:5000/get_time

curl.exe http://localhost:5000/getFielsForQuery -H "Content-type:application/json" -X POST -d "@.\\data.json"

curl.exe http://localhost:5000/getFielsForQuery -H "Content-type:application/json" -X POST -d @data.json

curl.exe http://localhost:5000/getFielsForQuery -H "Content-type:application/json" -X POST -d "@.\\getFielsForQuery_test.json"

curl.exe http://localhost:5000/executeSql -H "Content-type:application/json" -X POST -d "@.\\sql_data.json"


//login using keys
to generate the private key
openssl genrsa 2048 | openssl pkcs8 -topk8 -v2 des3 -inform PEM -out rsa_key.p8
to generate a public key
openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub



