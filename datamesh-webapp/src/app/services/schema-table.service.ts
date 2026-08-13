import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UrlService } from 'app/url.service';

export class Table {
  get name():string{
    return this.tableName
  }
  get id():string{
    return this.schemaName + "." + this.tableName
  }
  constructor(private schemaName:string, private tableName:string){}
}

export class Schema{
  get name():string{
    return this.schemaName
  }
  get id():string{
    return this.schemaName
  }
  constructor(private schemaName:string){
  }
}

export interface SchemaTableData {
  rootLevelNodes: Schema[];
  dataMap: Map<string, Table[]>;
}

@Injectable({
  providedIn: 'root'
})
export class SchemaTableService {
  private cache = new Map<string, SchemaTableData>();

  constructor(private urlSrv: UrlService) { }

  getSchemaAndTableData(connectionId: string): Observable<SchemaTableData> {
    // Return cached data if available
    if (this.cache.has(connectionId)) {
      return of(this.cache.get(connectionId)!);
    }

    // SQL query to get schemas and tables
    const schemaSql =
      "select t.table_schema,          "+
      "       t.table_name             "+
      " from information_schema.tables t"+
      " order by table_schema,          "+
      "       table_name               ";

    const req = {
      connectionId: connectionId,
      sql: schemaSql
    };

    return this.urlSrv.post("executeSql", req).pipe(
      map((result: any) => {
        const resultSet = result.resultSet;
        const rootLevelNodes: Schema[] = [];
        const dataMap = new Map<string, Table[]>();

        for (let i = 0; i < resultSet.length; i++) {
          const record = resultSet[i];
          const schemaName = record[0];
          const tableName = record[1];

          // Add schema to root nodes if not already present
          if (!rootLevelNodes.find(s => s.id === schemaName)) {
            const schemaItem = new Schema(schemaName);
            rootLevelNodes.push(schemaItem);
            dataMap.set(schemaName, []); // Initialize tables array for this schema
          }

          // Get the schema's data array (list of tables)
          const schemaData = dataMap.get(schemaName)!;
          if (!schemaData.find(item => item.id === tableName)) {
            const tableItem = new Table(schemaName + "." + tableName, tableName);
            schemaData.push(tableItem);
            dataMap.set(tableName, []); // Initialize columns array (currently empty)
          }
        }

        const data: SchemaTableData = {
          rootLevelNodes,
          dataMap
        };

        // Cache the result
        this.cache.set(connectionId, data);
        return data;
      }),
      catchError((error) => {
        console.error('Error fetching schema and table data:', error);
        // Optionally, you might want to show an error message or rethrow
        throw error;
      })
    );
  }

  // Optional: method to clear cache for a specific connection or all
  clearCache(connectionId?: string): void {
    if (connectionId) {
      this.cache.delete(connectionId);
    } else {
      this.cache.clear();
    }
  }
}