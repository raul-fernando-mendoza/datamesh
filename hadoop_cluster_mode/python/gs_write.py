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
    

    pandas_df = pd.DataFrame({
        'a': [11, 12, 13],
        'b': [12., 13., 14.],
        'c': ['string4', 'string5', 'string6'],
        'd': [date(2001, 1, 1), date(2002, 2, 1), date(2003, 3, 1)],
        'e': [datetime(2001, 1, 1, 12, 0), datetime(2002, 1, 2, 12, 0), datetime(2003, 1, 3, 12, 0)]
    })
    s_df = spark.createDataFrame(pandas_df)

    s_df.write.mode("overwrite").save('gs://datamesh-7b8b8.appspot.com/customer1/Book2.csv',format("csv"), header=True)

    spark.stop()