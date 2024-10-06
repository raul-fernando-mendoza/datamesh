#to start the cluster 
make
#to run the sample
make run-python-sample

#to generate the gcloud configuration file use
gcloud auth application-default login
the json file will be at $HOME/.config/gcloud/application_default_credentials.json

#to create the requirements file
python3 -m pip freeze > requirements.txt
python3 -m pip install -r

#to test gs connectivity
~/opt/hadoop/bin/hadoop fs -ls gs://datamesh-7b8b8.appspot.com

#to debug
cat <<EOF >"/tmp/gcs-connector-logging.properties"
handlers = java.util.logging.ConsoleHandler
java.util.logging.ConsoleHandler.level = ALL
com.google.level = FINE
sun.net.www.protocol.http.HttpURLConnection.level = ALL
EOF

export HADOOP_CLIENT_OPTS="-Djava.util.logging.config.file=/tmp/gcs-connector-logging.properties"

./hadoop --loglevel debug fs -ls gs://datamesh-7b8b8.appspot.com