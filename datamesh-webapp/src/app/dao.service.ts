import { Injectable } from '@angular/core';
import { ConnectionsService } from './connections.service';
import { SnowFlakeColumn } from './datatypes/datatypes.module';
import { UrlService } from './url.service';

@Injectable({
  providedIn: 'root'
})
export class DaoService {

  constructor(   
    private connectionSrv:ConnectionsService,
    private urlSrv:UrlService
    ) { }

  getTableColumns( connectionId:string, tableName:string) : Promise<Array<SnowFlakeColumn>>{
    return new Promise(( resolve, reject ) => {

      var tableSql =
      "select t.table_schema,                                                     "+
      "       t.table_name,                                                       "+
      "       c.column_name,                                                      "+
      "       c.ordinal_position,                                                 "+
      "       c.data_type,                                                        "+
      "       case                                                                "+
      "            when c.numeric_precision is not null                           "+
      "                then c.numeric_precision                                   "+
      "            when c.character_maximum_length is not null                    "+
      "                then c.character_maximum_length                            "+
      "       end as max_length,                                                  "+
      "       c.numeric_scale,                                                    "+
      "       c.is_identity,                                                      "+
      "       c.is_nullable                                                       "+
      "from information_schema.tables t                                           "+
      "inner join information_schema.columns c on                                 "+
      "         c.table_schema = t.table_schema and c.table_name = t.table_name   "+
      "where t.table_schema || '.' || c.table_name = '" + tableName + "'"+
      "order by table_schema,                                                     "+
      "       table_name,                                                         "+
      "       ordinal_position;                                                   " 
    
      var req = {
        connectionId:connectionId,
        sql:tableSql
      }
      this.urlSrv.post("executeSql",req).subscribe({ 
        'next':(result:any)=>{
          console.log( result )
          var resultSet = result.resultSet
          var columns:SnowFlakeColumn[] = []
          for( var i=0; i<resultSet.length ; i++){
            var record = resultSet[i]
            var column:SnowFlakeColumn = {
              columnName: record[2],
              ordinalPosition: record[3],
              dataType: record[4],
              maxLength: record[5],
              isIdentity: record[6],
              isNullabe: record[7]
            }
            columns.push( column )
          }
          resolve( columns )
        },
        'error':(reason)=>{        
          reject( reason.error.error )
        }
      })         
    })
  }

  getModelResult( modelId:string) : Promise<Array<{ [key: string]: any }> >{
    return new Promise(( resolve, reject ) => {

      let result:Array<{ [key: string]: any }> = []

      var req = {
        modelId:modelId,
        connectionId:"c1d0d398-f2cf-47dd-a122-9b97a3b0df3d"
      }
      this.urlSrv.post("executeModelId",req).subscribe({ 
        'next':(result:any)=>{
          console.log( result )
          resolve( result )
        },
        'error':(reason)=>{        
          reject( reason.error.error )
        }
      })         
    })
  }

}
