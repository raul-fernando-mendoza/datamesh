import { NgModule, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';
import { Timestamp } from 'firebase/firestore';
import { ModelEditComponent } from 'app/model-edit/model-edit.component';
import { MatTabBodyPortal } from '@angular/material/tabs';






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
  schema:Array<Port> = []
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

export class InfoNode{
  id!:string
  name!:string
  children?:InfoNode[]
}

export interface SelectedColumn {
  exp: string
  alias: string
  isSelected:boolean
}

export interface Transformation{
  id:string
}

export class FilterTransformation implements Transformation{
  id!:string
  leftValue!:string
  comparator!:ComparatorOption
  rightValue!:string
}

export interface TransformationContainer{
  id:string
  type:'rawRead' | 'filter'
  label:string
  transformation:Transformation
  sampleData?:SqlResultInFirebase
}

export interface JoinNode{
  id?:string
  name?: string
  connectionId?:string
  tableName?:string
  joinCriteria?:JoinCondition[]
  transformations?:TransformationContainer[]
}


export class JoinNodeObj implements JoinNode{
  public static className = "JoinNode"
  id!:string
  name!: string
  connectionId!:string
  tableName!:string
  columns: SnowFlakeColumn[] = []
  joinCriteria:JoinCondition[] = []
  sampleData:SqlResultInFirebase | null = null
  transformations:TransformationContainer[] = []
}


export interface JoinData {
  leftNode:JoinNodeObj
  rightNode:JoinNodeObj
  rightCollectionPath:string
}

export interface Model{
  id?:string
  label?:string
  description?:string
  owner?:string
  updateon?:string
  createon?:string
}

function pad2(n:number) { return n < 10 ? '0' + n : n }

export function getCurrentTimeStamp(){
  let date = new Date()
  return date.getFullYear().toString() + pad2(date.getMonth() + 1) + pad2( date.getDate()) + pad2( date.getHours() ) + pad2( date.getMinutes() ) + pad2( date.getSeconds() ) 
}
export class ModelObj implements Model{
  static collectionName = "Model"
  id!:string
  label!:string
  description:string = ""
  owner!:string
  updateon:string = getCurrentTimeStamp()
  createon:string = getCurrentTimeStamp()
}

export enum TreeOption {
  Last,
  Highlighted
}

export interface SnowFlakeColumn{
  columnName:string,
  ordinalPosition:number,
  dataType:string,
  maxLength:number,
  NumericScale?:number,
  isIdentity:boolean,
  isNullabe:boolean
}

export interface SnowFlakeTable {
  connectionId:string, 
  schemaName:string,
  tableName:string
}


export enum ComparatorOption {
  equal = "=",
  gt = ">",
  gte = ">=",
  lt = "<",
  lte = "<=",
  ne = "<>"
}

export interface JoinCondition{
  id:string
  leftValue:string
  comparator:ComparatorOption
  rightValue:string
}




export class JoinNodeExecution{
  ModelId?: string 
  parameters?:any
}

export interface SnowFlakeNativeColumn{
  display_size:number | null
  internal_size:number
  is_nullable:boolean
  name:string
  precision:number
  scale:number
  type_code:number 
}

export interface SqlResultInFirebase{
  resultSet:Array<{ [key: string]: any }>
  metadata:[
    { 
      display_size:number | null
      internal_size:number
      is_nullable:boolean
      name:string
      precision:number
      scale:number
      type_code:number 
    }
  ]
}


