currentdir = $(shell dirname "$$PWD")
clustername = $(shell basename ${currentdir})
namenode=$(addprefix ${clustername},_namenode)
worker1=$(addprefix ${clustername},_worker1)
worker2=$(addprefix ${clustername},_worker2)

hadoop_home=/mnt/software/hadoop-3.4.0
spark_home=/mnt/software/spark-3.5.3-bin-hadoop3

all:
	make clean
	make build
	make keys
	make format
	make start-all

build: 
	clustername=${clustername} docker-compose --project-name ${clustername} up --build -d

start: 
	docker-compose start 
	make start-all

stop: 
	make stop-all
	docker-compose stop 

keys:
	./keys_get.sh ${clustername} || true

format:
	docker exec -it $(namenode) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		${hadoop_home}/bin/hdfs namenode -format \
	'"		

start-all:
	docker exec -it $(namenode) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		${hadoop_home}/sbin/start-all.sh \
	'"

stop-all:
	docker exec -it $(namenode) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		${hadoop_home}/sbin/stop-all.sh \
	'"

run-mapreduce:
	docker exec -it $(namenode) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
	cd ${hadoop_home} && ./bin/yarn jar share/hadoop/mapreduce/hadoop-mapreduce-examples-3.4.0.jar pi 10 15 \
	'"	

run-spark:
	docker exec -it $(namenode) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
	cd ${hadoop_home} && ./bin/yarn jar share/hadoop/mapreduce/hadoop-mapreduce-examples-3.4.0.jar pi 10 15 \
	'"	

run-python:
	docker exec -it $(namenode) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		${spark_home}/bin/spark-submit \
  		--master yarn \
  		${spark_home}/examples/src/main/python/pi.py \
  		10 \
	'"	

run-python-pandas-read-gs:
	docker cp ./python/pandas_read_gs.py $(namenode):/home/hadoop/
	docker exec -it $(namenode) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		${spark_home}/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/pandas_read_gs.py \
	'"		

run-python-read-hdfs:
	docker cp ./python/read_hdfs.py $(namenode):/home/hadoop/
	docker exec -it $(namenode) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		${spark_home}/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/read_hdfs.py \
	'"	

run-python-gs-write:
	docker cp ./python/gs_write.py $(namenode):/home/hadoop/
	docker exec -it $(namenode) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		${spark_home}/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/gs_write.py \
	'"			

run-python-gs-read:
	docker cp ./python/gs_read.py $(namenode):/home/hadoop/
	docker exec -it $(namenode) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		${spark_home}/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/gs_read.py \
	'"	

prune:
	make clean
	docker rm $(docker ps -a -q)
	docker rmi $(docker images -q)
	docker system prune -a

.PHONY: clean
clean:
	rm -f ./public_keys_all/authorized_keys
	rm -f ./public_keys/*.pub
	docker stop $(namenode) $(worker1) $(worker2) || true 
	docker rm -f $(namenode) $(worker1) $(worker2) || true 

