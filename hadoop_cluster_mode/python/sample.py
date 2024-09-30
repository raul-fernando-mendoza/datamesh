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

from pyspark.sql import SparkSession


if __name__ == "__main__":
    """
        Usage: pi [partitions]
    """
    spark = SparkSession\
        .builder\
        .appName("s_df")\
        .getOrCreate()
    

    s_df = spark.createDataFrame([
        Row(a=1, b=2., c='string1', d=date(2000, 1, 1), e=datetime(2000, 1, 1, 12, 0)),
        Row(a=2, b=3., c='string2', d=date(2000, 2, 1), e=datetime(2000, 1, 2, 12, 0)),
        Row(a=4, b=5., c='string3', d=date(2000, 3, 1), e=datetime(2000, 1, 3, 12, 0))
    ])
    s_df.show()

    pandas_df = pd.DataFrame({
        'a': [11, 12, 13],
        'b': [12., 13., 14.],
        'c': ['string4', 'string5', 'string6'],
        'd': [date(2001, 1, 1), date(2002, 2, 1), date(2003, 3, 1)],
        'e': [datetime(2001, 1, 1, 12, 0), datetime(2002, 1, 2, 12, 0), datetime(2003, 1, 3, 12, 0)]
    })
    s_df = spark.createDataFrame(pandas_df)
    s_df.show()   

    spark.stop()