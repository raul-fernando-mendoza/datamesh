import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';
import { Timestamp } from 'firebase/firestore';






export class DatasetGroup{
  id:string = ""
  label:string = ""
  description:string = ""
  createon? = new Date();
  updateon? = new Date();  
}


export class Port{
  name:string = ""
  datatype:string = ""
}

export class SnowFlakeDataset{
  id:string = ""
  type:string = "SnowFlakeDataset"
  datasetGroupId:string = ""
  label:string = ""
  sql:string = ""
  connectionId:string = ""
  ports:Port[] = []
}
export class FileDataset{
  id:string = ""
  type:string = "FileDataset"
  label:string = ""
  groupId:string = ""
  connectionId:string = ""  
  fileName:string = ""
  ports:Port[] = []
}

export type Dataset = SnowFlakeDataset | FileDataset

export class ComparisonGroup{
  id:string = ""
  label:string = ""
}

export interface ComparisonPort{
  name:string,
  datatype:string,
  alias:string,
  isSelected:boolean
}

export interface KeyLeftRight {
  leftPortName:string
  leftPortType:string
  leftPortAlias:string
  rightPortName:string
  rightPortType:string
  rightPortAlias:string
  isSelected:boolean
}
export interface KeyParentLeft{
  parentPortName:string | null 
  parentPortType:string | null
  parentPortAlias:string | null
  leftPortName:string
  leftPortType:string
  leftPortAlias:string
  isSelected:boolean
}
export interface KeyParentRight{
  parentPortName:string | null 
  parentPortType:string | null
  parentPortAlias:string | null
  rightPortName:string
  rightPortType:string
  rightPortAlias:string
  isSelected:boolean
}

export class Comparison{
  id!:string 
  label!:string 
  groupId!:string 
  parentDatasetId:string | null = null
  parentPorts:ComparisonPort[] = []
  leftDatasetId:string | null = null
  leftPorts:ComparisonPort[] = []
  rightDatasetId:string | null = null
  rightPorts:ComparisonPort[] = []
  filter:string | null = null

  keyParentLeft:KeyParentLeft[] = []
  keyParenRight:KeyParentRight[] = []
  keyLeftRight:KeyLeftRight[] = []

  records:any
  schema:any
}

export enum JoinType { "inner_join" , "left_join" , "outer_join" }
export enum Operator { "=", ">" , ">=" , "<", "<=", "between" }

export interface PortListResponse{
  fields:Port[] 
}

export interface ChiildJoinRequest{
  parentData: { [key: string]: any } ,
  leftQry:string,
  rightQry:string,
  leftColumns:Port[],
  rightColumns:Port[],
}


export class SqlJupiterCollection{
  static readonly collectionName:string = "SqlJupiterCollection"
}

export interface SqlJupiter{
  className?:string
  sql?:string 
  connectionId?:string|null

  request_id?:  string | null
  request_status?:""|"requested"|"assigned"|"aborted"|"completed"|"error"
  request_start_time?: Timestamp | null
  request_completion_time?: Timestamp | null
  request_error_message?:string 

}

export class SqlJupiterObj implements SqlJupiter{
  sql!:string 
  connectionId!:string|null
  request_id:string|null = null
  request_status:""|"requested"|"assigned"|"aborted"|"completed"|"error"=""
  request_start_time: Timestamp | null = null
  request_completion_time: Timestamp | null = null
  request_error_message:string = "" 
}

export class SqlResultCollection{
  static readonly collectionName:string = "SqlResult"
}
export interface SqlResult{
  result_status?: null | "inprogress" | "aborted" | "completed" | "error" 
  result_start_time?: Timestamp | null
  result_completion_time?: Timestamp | null
  result_error_message?:string 
  result_metadata?: [{ [key: string]: any }] 
  result_set?: [{ [key: string]: any }] 
}
export class SqlResultObj implements SqlResult{
  
  result_status: null | "inprogress" | "aborted" | "completed" | "error" = "inprogress" 
  result_start_time: Timestamp | null = null
  result_completion_time?: Timestamp | null = null
  result_error_message:string = "" 
  result_metadata?: [{ [key: string]: any }] 
  result_set?: [{ [key: string]: any }]  
}

export class TextJupiter{
  id!:string
  className!:string
  txt:string = ""
}

export class JupiterDoc{
  id:string=""
  label:string=""
  groupId:string=""
  itemList:Array<{className:string, id:string}> = []
}

export interface Connection{
  id?:string
  label?:string
  description?:string
  credentials?:string
  owner?:string,
  group?:string,
  groupId?:string
}
export class ConnectionGroupCollection{
  static collectionName = "ConnectionGroup"
}
export class ConnectionCollection{
  static collectionName = "Connection"
}

export class Column{
  display_size:number | null = null
  internal_size:number | null = null
  is_nullable!:boolean 
  name!:string 
  precision:string | null = null
  scale:string | null = null
  type_code!:number
}
