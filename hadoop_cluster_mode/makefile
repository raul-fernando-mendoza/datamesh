startup: 
	docker-compose up --build -d
	./keys_get.sh
	docker exec -it namenode /bin/bash -c ./namenode-setup.sh

.PHONY: clean
clean:
	rm -f ./public_keys_all/authorized_keys
	rm -f ./public_keys/*.pub
	docker stop worker1 worker2 namenode || true 
	docker rm -f worker1 worker2 namenode || true 

