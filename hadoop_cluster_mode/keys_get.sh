#!/bin/bash

while : ; do
    docker cp namenode:/home/hadoop/.ssh/id_rsa.pub ./public_keys/id_rsa_namenode.pub
    [[ $? != 0 ]] || break
    sleep 10s
done

while : ; do
    docker cp worker1:/home/hadoop/.ssh/id_rsa.pub ./public_keys/id_rsa_worker1.pub
    [[ $? != 0 ]] || break
    sleep 10s
done

while : ; do
    docker cp worker2:/home/hadoop/.ssh/id_rsa.pub ./public_keys/id_rsa_worker2.pub
    [[ $? != 0 ]] || break
    sleep 10s
done


cat ./public_keys/id_rsa_namenode.pub > ./public_keys_all/authorized_keys
cat ./public_keys/id_rsa_worker1.pub >> ./public_keys_all/authorized_keys
cat ./public_keys/id_rsa_worker2.pub >> ./public_keys_all/authorized_keys

docker cp ./public_keys_all/authorized_keys namenode:/home/hadoop/.ssh/
docker cp ./public_keys_all/authorized_keys worker1:/home/hadoop/.ssh/
docker cp ./public_keys_all/authorized_keys worker2:/home/hadoop/.ssh/

