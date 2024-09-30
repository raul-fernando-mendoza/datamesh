#!/bin/bash
$SPARK_HOME/bin/spark-submit \
    --master yarn \
    /home/hadoop/opt/spark/examples/src/main/python/pi.py \
    1000