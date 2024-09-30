all:
	make clean
	make startup
	make keys
	make format
	make start-all
	make run-python
	make stop-all

startup: 
	docker-compose up --build -d

keys:
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash './hadoop-format.sh'"
	./keys_get.sh || true

format:
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash './hadoop-format.sh'"

start-all:
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash './hadoop-start-all.sh'"



run-mapreduce:
	docker exec -it namenode /bin/bash -c " sudo -E -H -u hadoop bash -c './mapreduce-sample-pi.sh'"

run-spark:
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash -c './spark-java-pi.sh'"

run-python:
	docker exec -it namenode /bin/bash -c "sudo -H -u hadoop bash -c ' \
	export HADOOP_HOME=/home/hadoop/opt/hadoop && \
	export HADOOP_CONF_DIR=/home/hadoop/opt/hadoop/etc/hadoop && \
	export SPARK_HOME=/home/hadoop/opt/spark && \
	export LD_LIBRARY_PATH=/home/hadoop/hadoop/lib/native && \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/opt/spark/examples/src/main/python/pi.py \
  		1000 \
	'"	

stop:
	docker exec -it namenode /bin/bash -c "sudo -H -u hadoop bash -c '/hadoop/stop-all.sh'"	

.PHONY: clean
clean:
	rm -f ./public_keys_all/authorized_keys
	rm -f ./public_keys/*.pub
	docker stop worker1 worker2 namenode || true 
	docker rm -f worker1 worker2 namenode || true 

