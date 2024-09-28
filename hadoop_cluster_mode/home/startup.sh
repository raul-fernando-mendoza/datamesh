#!/bin/bash
echo "ran ssh" >> ran.txt
/etc/init.d/ssh start
sudo -H -u hadoop bash -c ' \
ssh-keygen -t rsa -P "" -f ~/.ssh/id_rsa && \
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys && \
chmod 0600 ~/.ssh/authorized_keys && \
ssh-keyscan namenode >> ~/.ssh/known_hosts && \
ssh-keyscan worker1 >> ~/.ssh/known_hosts && \
ssh-keyscan worker2 >> ~/.ssh/known_hosts \
'

#this should be the last line
/bin/bash

