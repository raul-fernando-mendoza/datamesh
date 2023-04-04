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

export interface Field{
  label:string
  type:string
}

export interface Dataset{
  id:string
  label:string|null
  sql:string|null
}

export interface Port{
  name:string
  datatype:string
  alias:string
  selected:boolean
}

export interface ConditionJoin{
  leftExpresion:string
  rightExpresion:string
  selected:boolean
}
export interface Comparison{
  id:string 
  label:string
  leftDatasetId:string
  rightDatasetId:string
  leftPorts:Port[]
  rightPorts:Port[]
  joinConditions:ConditionJoin[]
}

export enum JoinType { "inner_join" , "left_join" , "outer_join" }
export enum Operator { "=", ">" , ">=" , "<", "<=", "between" }

export interface Condition{
  left:string
  right:string
  operator:Operator
}

export interface Child{
  id:string 
  label:string
  leftDatasetId:string
  rightDatasetId:string
  leftPorts:Port[]
  rightPorts:Port[]
  joinConditions:ConditionJoin[]  
}

export interface PortListRequest{
  fields:Port[] 
}

export interface ChiildJoinRequest{
  parentData: { [key: string]: any } ,
  leftQry:string,
  rightQry:string,
  leftColumns:Port[],
  rightColumns:Port[],
  joinColumns:string[]
}

