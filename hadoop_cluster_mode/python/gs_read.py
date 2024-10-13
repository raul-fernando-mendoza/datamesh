#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

from datetime import datetime, date
import pandas as pd
from pyspark.sql import Row
import csv
from pyspark.sql import SparkSession
from google.cloud import storage


url = 'https://storage.cloud.google.com/datamesh-7b8b8.appspot.com/Book1.csv'

if __name__ == "__main__":
    """
        Usage: pi [partitions]
    """
    spark = SparkSession\
        .builder\
        .appName("s_df")\
        .getOrCreate()

    s_df = spark.read.csv('gs://datamesh-7b8b8.appspot.com/customer1/Book2.csv', header=True)

    s_df.show()

    spark.stop()