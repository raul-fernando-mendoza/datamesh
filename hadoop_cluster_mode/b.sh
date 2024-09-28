docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker-compose up --build -d
rm -f ./public_keys_all/*
. keys_get.sh
docker exec -it namenode /bin/bash -c ./namenode-setup.sh

