#!/bin/bash
echo "starting..." >> startup.txt

/etc/init.d/ssh start

export PATH=$SPARK_HOME/bin:$HADOOP_HOME/bin:$PATH

sudo -E -H -u hadoop bash -c 'ssh-keygen -t rsa -P "" -f ~/.ssh/id_rsa'

hostname >> startup.txt
echo "ending startup..." >> startup.txt
#this should be the last line
/bin/bash

