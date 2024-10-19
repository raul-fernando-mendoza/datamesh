#!/bin/bash


docker exec -it $1_namenode  /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
        ssh-keyscan namenode > ~/.ssh/known_hosts && \
        ssh-keyscan worker1 >> ~/.ssh/known_hosts && \
        ssh-keyscan worker2 >> ~/.ssh/known_hosts \
    '"
docker exec -it $1_worker1  /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
        ssh-keyscan namenode > ~/.ssh/known_hosts && \
        ssh-keyscan worker1 >> ~/.ssh/known_hosts && \
        ssh-keyscan worker2 >> ~/.ssh/known_hosts\
    '"
docker exec -it $1_worker2  /bin/bash -c "sudo -E -H -u hadoop bash -c ' \
        ssh-keyscan namenode > ~/.ssh/known_hosts && \
        ssh-keyscan worker1 >> ~/.ssh/known_hosts && \
        ssh-keyscan worker2 >> ~/.ssh/known_hosts \
    '"
while : ; do
    docker cp $1_namenode:/home/hadoop/.ssh/id_rsa.pub ./public_keys/id_rsa_namenode.pub
    [[ $? != 0 ]] || break
    sleep 10s
done

while : ; do
    docker cp $1_worker1:/home/hadoop/.ssh/id_rsa.pub ./public_keys/id_rsa_worker1.pub
    [[ $? != 0 ]] || break
    sleep 10s
done

while : ; do
    docker cp $1_worker2:/home/hadoop/.ssh/id_rsa.pub ./public_keys/id_rsa_worker2.pub
    [[ $? != 0 ]] || break
    sleep 10s
done


cat ./public_keys/id_rsa_namenode.pub > ./public_keys_all/authorized_keys
cat ./public_keys/id_rsa_worker1.pub >> ./public_keys_all/authorized_keys
cat ./public_keys/id_rsa_worker2.pub >> ./public_keys_all/authorized_keys

docker cp ./public_keys_all/authorized_keys $1_namenode:/home/hadoop/.ssh/
docker cp ./public_keys_all/authorized_keys $1_worker1:/home/hadoop/.ssh/
docker cp ./public_keys_all/authorized_keys $1_worker2:/home/hadoop/.ssh/
