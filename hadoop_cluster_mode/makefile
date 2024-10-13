all:
	make clean
	make startup
	make keys
	make format
	make start-all
	

startup: 
	docker-compose up --build -d

keys:
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash './hadoop-format.sh'"
	./keys_get.sh || true

format:
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash './hadoop-format.sh'"

start-all:
	docker exec -it namenode /bin/bash -c " \
	sudo -H -u hadoop bash -c '/home/hadoop/opt/hadoop/sbin/start-all.sh' \
	"	

run-mapreduce:
	docker exec -it namenode /bin/bash -c " sudo -E -H -u hadoop bash -c './mapreduce-sample-pi.sh'"

run-spark:
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash -c './spark-java-pi.sh'"

run-python:
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/opt/spark/examples/src/main/python/pi.py \
  		10 \
	'"	

run-python-pandas-read-gs:
	docker cp ./python/pandas_read_gs.py namenode:/home/hadoop/
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/pandas_read_gs.py \
	'"		

run-python-read-hdfs:
	docker cp ./python/read_hdfs.py namenode:/home/hadoop/
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/read_hdfs.py \
	'"	

run-python-gs-write:
	docker cp ./python/gs_write.py namenode:/home/hadoop/
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/gs_write.py \
	'"			
run-python-gs-read:
	docker cp ./python/gs_read.py namenode:/home/hadoop/
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/gs_read.py \
	'"	

stop-all:
	docker exec -it namenode /bin/bash -c " \
	sudo -H -u hadoop bash -c '/home/hadoop/opt/hadoop/sbin/stop-all.sh' \
	"	

prune:
	make clean
	docker rm $(docker ps -a -q)
	docker rmi $(docker images -q)
	docker system prune -a

.PHONY: clean
clean:
	rm -f ./public_keys_all/authorized_keys
	rm -f ./public_keys/*.pub
	docker stop worker1 worker2 namenode || true 
	docker rm -f worker1 worker2 namenode || true 

