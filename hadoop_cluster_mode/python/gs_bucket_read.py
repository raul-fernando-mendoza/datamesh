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
from google.oauth2 import service_account


projectId = 'datamesh-7b8b8'
bucket = 'datamesh-7b8b8.appspot.com'
url = 'gs://datamesh-7b8b8.appspot.com/customer1/Book1.csv'
out_file = 'customer1/Book1_out.csv'

if __name__ == "__main__":
    """
        Usage: pi [partitions]
    """
    print("*** Spark session")
    spark = SparkSession\
        .builder\
        .appName("s_df")\
        .getOrCreate()
    
    print("*** Client credentials")
    credentials = service_account.Credentials.from_service_account_file('./secrets/service-account-credentials.json')

    print("*** generate ")
    storage_client = storage.Client(credentials=credentials)

    print('*** bucket')
    bucket = storage_client.get_bucket(bucket)
   
    print("*** Read csv")
    pd_df = pd.read_csv(url,storage_options={"token": "./secrets/service-account-credentials.json"})    

    print("*** create dataframe")
    s_df=spark.createDataFrame(pd_df)
    s_df.show() 

    print("*** apply filter")
    s_df = s_df.filter(s_df.COLUMN_NAME == "ACTION")
    s_df.show()

    print("*** write back")
    p_df = s_df.toPandas()

    bucket.blob(out_file).upload_from_string(p_df.to_csv(), 'text/csv')

    print("*** Stop")
    spark.stop()

    print("*** End")