sudo -H -u hadoop bash -c ' \
export HADOOP_HOME=/home/hadoop/opt/hadoop && \
$HADOOP_HOME/bin/hdfs namenode -format && \
$HADOOP_HOME/sbin/start-all.sh && \
cd $HADOOP_HOME && \
./bin/yarn jar share/hadoop/mapreduce/hadoop-mapreduce-examples-3.4.0.jar pi 10 15 && \
$HADOOP_HOME/sbin/stop-all.sh
'
