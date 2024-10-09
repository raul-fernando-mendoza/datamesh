all:
	make clean
	make startup
	make keys
	make format
	make start-all
	make run-python
	

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
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/opt/spark/examples/src/main/python/pi.py \
  		10 \
	'"	

run-python-read-gs:
	docker cp ./python/read_gs.py namenode:/home/hadoop/
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/read_gs.py \
	'"		

run-python-read-hdfs:
	docker cp ./python/read_hdfs.py namenode:/home/hadoop/
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/read_hdfs.py \
	'"	

run-python-write-gs:
	docker cp ./python/write_gs.py namenode:/home/hadoop/
	docker exec -it namenode /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
		/home/hadoop/opt/spark/bin/spark-submit \
  		--master yarn \
  		/home/hadoop/write_gs.py \
	'"			

stop:
	docker exec -it namenode /bin/bash -c "sudo -H -u hadoop bash -c '/hadoop/stop-all.sh'"	

.PHONY: clean
clean:
	rm -f ./public_keys_all/authorized_keys
	rm -f ./public_keys/*.pub
	docker stop worker1 worker2 namenode || true 
	docker rm -f worker1 worker2 namenode || true 

