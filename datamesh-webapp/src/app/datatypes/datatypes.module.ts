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

export interface DatasetGroup{
  id:string
  label:string
}

export interface Port{
  name:string
  datatype:string
}

export interface SnowFlakeDataset{
  id:string
  type: "SnowFlakeDataset"
  datasetGroupId:string
  label:string
  sql:string
  ports:Port[]
}
export interface FileDataset{
  id:string
  type: "FileDataset"
  label:string
  datasetGroupId:string
  fileName:string
  ports:Port[]
}

export type Dataset = FileDataset|SnowFlakeDataset

export interface ComparisonRow{
  sourceId:number
  name:string
  datatype:string
  alias:string | null 
  selected:boolean | null
}
export interface Source{
  dataSet:SnowFlakeDataset | FileDataset
  comparisonRows:ComparisonRow[]
}
export interface Comparison{
  id:string 
  label:string
  sources:Source[]
  parent:Source
  filter:string
}

export enum JoinType { "inner_join" , "left_join" , "outer_join" }
export enum Operator { "=", ">" , ">=" , "<", "<=", "between" }

export interface PortListRequest{
  fields:Port[] 
}

export interface ChiildJoinRequest{
  parentData: { [key: string]: any } ,
  leftQry:string,
  rightQry:string,
  leftColumns:Port[],
  rightColumns:Port[],
}

