#!/bin/bash
/home/hadoop/opt/spark/bin/spark-submit --deploy-mode cluster \
        --num-executors 2 \
        --class org.apache.spark.examples.SparkPi \
        /home/hadoop/opt/spark/examples/jars/spark-examples_2.12-3.5.3.jar 100