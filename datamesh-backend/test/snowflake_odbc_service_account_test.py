import unittest
import json
import logging
import snowflake.connector

import datamesh_flask.snowflake_odbc as snowflake_odbc
    

class TestFireStore(unittest.TestCase):
    
     

    

    def test01_testdatabase(self):
        print("hello")
        
              
        conn = snowflake.connector.connect(
            type= "snowflake",
            account= "twentyfourhourfit.east-us-2.azure",
            user= "DA_DBT_PRD_SVC_KEY",
            role= "TRANSFORMER_PRD_ADMIN",
            private_key="-----BEGIN ENCRYPTED PRIVATE KEY-----\nMIIFHDBOBgkqhkiG9w0BBQ0wQTApBgkqhkiG9w0BBQwwHAQIdJQ8XG8SN2cCAggA\nMAwGCCqGSIb3DQIJBQAwFAYIKoZIhvcNAwcECKr1lbtSLUZOBIIEyK8mRuDD8LoK\nmek6n3hPDv4StDAayO5iBEDRi2xHvl2okaSt+/1GzlZVI1mHi3LRE02/lpy4V6qp\n1f0y/7cS5I7mIRHST6hGIRUn3uEh/Ao80svGpgfq1WmgrGPRpNMSpSlFNvOjBJs6\nz9DRoM43kN6JyI9ZUXH7CjX9K2NMfB8u15d6RPYr7xXL55r0pCYfdNVo6NIFbO1O\nK28RzsdtMOr6sutkc2QGb+izAE0JsvmxJ2f/58aLtyAV8UyrO5OnQzvenlWWRLCi\nFzl9bn7sOR2xDnyqCVufWQR3OXgs5P7XqJDAtILTCIjvwI0u9OGEiQlbLLdbeHu/\n1w50ZZzmhlTHyiGsB9hBLS0g7ep+OlrbXJbHAOYy9LzGNkPJnq7Tirn4t68TZC5K\n1XE6ZzE54gTrSRVhraEevloAQvbVIMRR93qTnDaEv6YeBokt0ovOlopTJDce4uyy\n1uXkM5etKCpSSjWaKGgoL99LYBtqvgm8x992ibZz3rRrUdlOacKqumZK9ubcGN/L\nWGNAUDCK8of2gd34Nigznaj9D0zUlgjCwBIaQ35pWdXlmywRTbHDf2jDN/H7Sx5b\nByMRvOViidO5Ku2ym0/5Q3/CLV68bezE5Ch5HaNRx9zaQnYDL755tMPhpT8f1mjE\ne4hF1EEB23Aii74XljnGz/90GLuCCWcW6tVzkba7SK6NK7uuQgETOsloE0pcDIUz\nMYghJtQ/HL8xqF8pKGt0XJdy8CCuLWh0OsagMpyRCoGiNxYObY8CSFOb04ss+iBe\n1rUXGC59tsWTjoanJ57r0Ud1z9GlYJVuJUnyTAXqzd+mV3i6CKOwLe81QbCyUn2t\nQCvGhPTo8VQgWNkka7SgQ/WSmamWbukdVL1vMNLy7ugs3Lt4EHGbo4Gvmi9yURl2\nbjB6tjFAKvrWtIKqX2muBwXD8mu7wxWGkx6X+FAfmwNRrdF1AShvZnvuvvodnvht\nvLDT5AvNEjjZk9nioTAWVbbv9zP400iqd5uZac+dzcnUU+4OZn8K3dKL56rntmnX\nJSvV5Iv4mOoDfKpVQT9Vbp0/i8vZZHGpEjsC4ziFgk0bqed0ozKbQ8KJ1H+v7KSo\nISJOLJgDaAYnBQttg8eNtNSK0bJpFxdHgY/8F3d9efXVISpKJgduIfWQ8Cu7rSJN\nhM+TIZMt2+izCmzBu9q6yg5mwLcxz4zy8lsVPMHfANbRtZ0SA9ZHIyz4+2Y41/dL\nbzNx6+/VKdN/D0Oe8KklAZ3FozRJ/jRQ5J+lnlgN41rKu+tYTpA4/fGi8PrQAP0j\nrma3z5PiCvGDwZ5t1NHoFyLUBNZqF3lMLq8u7onSCay66i+MFvuVzgo/xUrPaVdS\n4CZO2gkshxceCcV/SLjqw1G1EmRXAMkjAq1KZfwT3esNOeUFq7fklkeajH3tJ629\nJ0C/ZiUrgXnkqaf4+MYk804tIrhgUwYvLJl9YV8sx65hnCmZBlIzAHhKYKzr3WDz\nmfd/1UL5ChkI08a37ighkQgantR7ZhM4FOXZvtYDZ3Wub5sY2N4uqh9CxsndHkgr\nQt5QvlRRVe13Hs3VZfBdzgeDfOVz91riogNyIjV+d7+KP+NYDkBDnwTUC/DrvtDG\n4+Iv0hkkj8niCPb1y6LWwA==\n-----END ENCRYPTED PRIVATE KEY-----\n"
            private_key_passphrase= "dbLz7RJy7PArqM"
            database= "PLANNING_PRD",
            warehouse= "TRANSFORMING_WH_PRD",
            schema= "DA_FIN",
            threads= "1",
            client_session_keep_alive= "False",
            query_tag= "daily" 
        )
   
        print("using session:" + str(conn)) 
        
        sql = "select * from dual"    
        return snowflake_odbc.executeSql(conn, sql)
            
        conn.close()
        
if __name__ == '__main__': 
    unittest.main()        