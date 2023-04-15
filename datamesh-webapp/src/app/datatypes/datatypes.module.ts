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
  ports:Port[] = []
}
export class FileDataset{
  id:string = ""
  type:string = "FileDataset"
  label:string = ""
  groupId:string = ""
  fileName:string = ""
  ports:Port[] = []
}

export type Dataset = FileDataset|SnowFlakeDataset

export class ComparisonRow{
  sourceId:number|null = null
  name:string = ""
  datatype:string = ""
  alias:string | null = null
  selected:boolean = false
}
export class Source{
  dataSet:SnowFlakeDataset | FileDataset | null = null
  comparisonRows:ComparisonRow[] = []
}

export class ComparisonGroup{
  id:string = ""
  label:string = ""
}

export class Comparison{
  id:string = ""
  label:string = ""
  sources:Source[] = []
  parent:Source | null = null
  filter:string | null = null
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

