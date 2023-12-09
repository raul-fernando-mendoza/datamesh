import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';



@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class DatatypesModule { }

export class DatasetGroup{
  id:string = ""
  label:string = ""
  createon? = new Date();
  updateon? = new Date();  
}


export class Port{
  name:string = ""
  type:string = ""
}

export class SnowFlakeDataset{
  id:string = ""
  type:string = "SnowFlakeDataset"
  datasetGroupId:string = ""
  label:string = ""
  sql:string = ""
  connectionName:string = ""
  ports:Port[] = []
}
export class FileDataset{
  id:string = ""
  type:string = "FileDataset"
  label:string = ""
  groupId:string = ""
  connectionName:string = ""  
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
  type:string,
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

export class SqlJupiter{
  id!:string
  className!:string
  sql:string = ""
  result:any|null
  connectionName:string|null = null
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

