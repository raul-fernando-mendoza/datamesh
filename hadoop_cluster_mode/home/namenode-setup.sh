sudo -H -u hadoop bash -c ' \
export HADOOP_HOME=/home/hadoop/opt/hadoop && \
export HADOOP_CONF_DIR=/home/hadoop/opt/hadoop/etc/hadoop && \
export SPARK_HOME=/home/hadoop/opt/spark && \
export LD_LIBRARY_PATH=/home/hadoop/hadoop/lib/native:$LD_LIBRARY_PATH && \
export PATH=/home/hadoop/opt/spark/bin:$PATH && \
$HADOOP_HOME/bin/hdfs namenode -format && \
$HADOOP_HOME/sbin/start-all.sh
'
