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


export PATH=/home/hadoop/opt/hadoop/bin:/home/hadoop/opt/hadoop/sbin:$PATH

#listar un archivo
hdfs dfs -ls  <path>

cd opt/hadoop/bin

./hdfs dfs -mkdir /user/customer1

#using hadoop 
./hdfs dfs -copyFromLocal ~/book1.csv /user/customer1/

docker cp ./spark-conf/* namenode:/home/hadoop/opt/spark/conf

docker cp ./etc/core-site.xml namenode:/home/hadoop/opt/hadoop/etc/hadoop
docker cp ./etc/core-site.xml worker1:/home/hadoop/opt/hadoop/etc/hadoop
docker cp ./etc/core-site.xml worker2:/home/hadoop/opt/hadoop/etc/hadoop

#to see the status of the hadoop
jps 
8352 SecondaryNameNode
8567 ResourceManager
8139 NameNode


#where the log are 
~/opt/hadoop/logs