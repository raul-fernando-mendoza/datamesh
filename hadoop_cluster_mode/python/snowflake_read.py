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
import json
from snowflake.snowpark import Session

url = 'https://storage.cloud.google.com/datamesh-7b8b8.appspot.com/Book1.csv'

if __name__ == "__main__":

    credentials_snowflake = {}

    with open('./secrets/snowflake-credentials.json') as f:
        credentials_snowflake = json.load(f)
        print(credentials_snowflake)

    sess = Session.builder.configs(credentials_snowflake).create()

    sf_df = sess.sql("select current_warehouse() warehouse, current_database() database, current_schema() schema").collect()
    print(
        "warehouse",sf_df[0]['WAREHOUSE'],
        "database",sf_df[0]['DATABASE'],
        "schema",sf_df[0]['SCHEMA']
    )


    sf_df_customer = sess.sql("select * from SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER").collect()

    key = {}

    with open('./secrets/cheneque-dev-1-5b1b89a45607.json') as f:
        key = json.load(f)
        print(key)
        

    spark = SparkSession\
        .builder\
        .appName("s_df")\
        .config("fs.gs.project.id", key["project_id"])\
        .config("fs.gs.system.bucket", key["project_id"] + ".appspot.com")\
        .config("fs.gs.auth.service.account.private.key.id", key["private_key_id"])\
        .config("fs.gs.auth.service.account.private.key", key["private_key"])\
        .config("fs.gs.auth.service.account.email", key["client_email"])\
        .getOrCreate()
    
    s_df = spark.createDataFrame(sf_df_customer)

    s_df.write.mode("overwrite").save("gs://" + key["project_id"] + ".appspot.com/customer1/TPCH_SF1_CUSTOMER",format("csv"), header=True) 

    spark.stop()
