python -m pip install Flask
python -m pip install Flask-JSON
flask --app datamesh_qry run --debug

curl -UseBasicParsing http://127.0.0.1:5000/get_time

curl.exe http://localhost:5000/getFielsForQuery -H "Content-type:application/json" -X POST -d "@.\\data.json"

curl.exe http://localhost:5000/getFielsForQuery -H "Content-type:application/json" -X POST -d @data.json

curl.exe http://localhost:5000/getFielsForQuery -H "Content-type:application/json" -X POST -d "@.\\getFielsForQuery_test.json"