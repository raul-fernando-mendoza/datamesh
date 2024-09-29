startup: 
	docker-compose up --build -d
	./keys_get.sh || true
	docker exec -it namenode /bin/bash -c ./namenode-setup.sh

all:
	make clean
	make startup
	make run
	make stop

run:
	docker exec -it namenode /bin/bash -c " \ 
		cd /home/hadoop/opt/hadoop/ && ./bin/yarn jar share/hadoop/mapreduce/hadoop-mapreduce-examples-3.4.0.jar pi 10 15 \
		"

run-spark:
	docker exec -it namenode /bin/bash -c "sudo -H -u hadoop bash -c ' \
	export HADOOP_HOME=/home/hadoop/opt/hadoop && \
	export HADOOP_CONF_DIR=/home/hadoop/opt/hadoop/etc/hadoop && \
	export SPARK_HOME=/home/hadoop/opt/spark && \
	export LD_LIBRARY_PATH=/home/hadoop/hadoop/lib/native && \
		/home/hadoop/opt/spark/bin/spark-submit --deploy-mode cluster \
               --class org.apache.spark.examples.SparkPi \
               /home/hadoop/opt/spark/examples/jars/spark-examples_2.12-3.5.3.jar 10 \
	'"

stop:
	docker exec -it namenode /bin/bash -c "sudo -H -u hadoop bash -c '/home/hadoop/opt/hadoop/sbin/stop-all.sh'"	

.PHONY: clean
clean:
	rm -f ./public_keys_all/authorized_keys
	rm -f ./public_keys/*.pub
	docker stop worker1 worker2 namenode || true 
	docker rm -f worker1 worker2 namenode || true 

