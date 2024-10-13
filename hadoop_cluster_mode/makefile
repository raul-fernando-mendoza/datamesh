currentdir = $(shell dirname "$$PWD")
clustername = $(shell basename ${currentdir}) 
namenode=$(clustername)_namenode
all:
	make clean
	make build
	make keys
	make format
	make start-all

env: 
	echo clustername=${clustername} > .env

build: 
	echo clustername=${clustername} > .env
	docker-compose -p ${clustername} up --build -d

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
		/home/hadoop/opt/hadoop/bin/hdfs namenode -format \
	'"		

start-all:
	docker exec -it $(namenode) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
	/home/hadoop/opt/hadoop/sbin/start-all.sh \
	'"

stop-all:
	docker exec -it $(clustername)_namenode /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
	/home/hadoop/opt/hadoop/sbin/stop-all.sh \
	'"

run-mapreduce:
	docker exec -it $(clustername) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
	cd /home/hadoop/opt/hadoop && ./bin/yarn jar share/hadoop/mapreduce/hadoop-mapreduce-examples-3.4.0.jar pi 10 15 \
	'"	

run-spark:
	docker exec -it $(clustername) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
	cd /home/hadoop/opt/hadoop && ./bin/yarn jar share/hadoop/mapreduce/hadoop-mapreduce-examples-3.4.0.jar pi 10 15 \
	'"	

run-python:
	docker exec -it $(clustername) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/opt/spark/examples/src/main/python/pi.py \
  		10 \
	'"	

run-python-pandas-read-gs:
	docker cp ./python/pandas_read_gs.py $(clustername):/home/hadoop/
	docker exec -it $(clustername) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/pandas_read_gs.py \
	'"		

run-python-read-hdfs:
	docker cp ./python/read_hdfs.py $(clustername):/home/hadoop/
	docker exec -it $(clustername) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/read_hdfs.py \
	'"	

run-python-gs-write:
	docker cp ./python/gs_write.py $(clustername):/home/hadoop/
	docker exec -it $(clustername) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/gs_write.py \
	'"			

run-python-gs-read:
	docker cp ./python/gs_read.py $(clustername):/home/hadoop/
	docker exec -it $(clustername) /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
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
	docker stop $(clustername)_worker1 $(clustername)_worker2 $(clustername)_namenode || true 
	docker rm -f $(clustername)_worker1 $(clustername)_worker2 $(clustername)_namenode || true 

