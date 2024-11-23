import {  ChangeDetectionStrategy, Component,  Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormArray, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SnowFlakeColumn, ComparatorOption, JoinCondition } from 'app/datatypes/datatypes.module';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioChange, MatRadioModule} from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';


export interface DataName {
  label:string
  leftTableName:string,
  leftColumns:Array<SnowFlakeColumn>,
  rightTableName:string,
  rightColumns:Array<SnowFlakeColumn>,
  joinConditions:JoinCondition[]
}

interface SnowflakeColumnPair{
  left: SnowFlakeColumn | null,
  isLeftSelected:boolean,
  right: SnowFlakeColumn | null
  isRightSelected:boolean
}

interface Key{
  columnName: string,
  isSelected:boolean,
}




@Component({
    selector: 'join-dlg',
    templateUrl: 'join-dlg.html',
    styleUrl: 'join-dlg.css',
    standalone: true,
    imports:[ 
      CommonModule,
      MatButtonModule,
      MatIconModule,
      FormsModule, 
      MatFormFieldModule,
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,    
      MatDialogModule,
      MatCheckboxModule,
      MatSelectModule,
      MatGridListModule,
      MatRadioModule
      
    ]
  })
  export class JoinDialog implements OnInit{ 

    allPorts:SnowflakeColumnPair[] = []

    leftKeys:Key[] = []
    rightKeys:Key[] = []

    comparisonOptions:Array<ComparatorOption> = [  ComparatorOption.equal,
      ComparatorOption.gt,
      ComparatorOption.gte,
      ComparatorOption.lt ,
      ComparatorOption.lte]

 
    leftForm = new FormControl<string>('');
    comparatorForm = new FormControl<ComparatorOption>(ComparatorOption.equal);
    rightForm = new FormControl<string>('');
    strForm = new FormControl<string>('');

    constructor(
      public dialogRef: MatDialogRef<JoinDialog>,
      @Inject(MAT_DIALOG_DATA) public data:DataName) {}

    ngOnInit(): void {
      let maxcolumns = this.data.leftColumns.length > this.data.rightColumns.length ? this.data.leftColumns.length : this.data.rightColumns.length
      let lCols = this.data.leftColumns
      let rCols = this.data.rightColumns

      this.data.leftColumns.map( n =>{
        var key:Key = {
          columnName: n.columnName,
          isSelected: false
        }
        this.leftKeys.push(key)
      })
      this.data.rightColumns.map( n =>{
        var key:Key = {
          columnName: n.columnName,
          isSelected: false
        }
        this.rightKeys.push(key)
      })
      for( let i=0; i<maxcolumns; i++){
        var p:SnowflakeColumnPair = {
          left:null,
          isLeftSelected:false,
          right:null,
          isRightSelected:false
        }
        if( i < lCols.length){
          p.left = lCols[i]
        }
        if( i< rCols.length ){
          p.right = rCols[i]
        }
        this.allPorts.push( p )
      }
    }

    clearSelection(){
      this.leftForm.setValue("")
      this.rightForm.setValue("")
      this.comparatorForm.setValue(ComparatorOption.equal)
    }

    addJoin(){

      let left = this.leftForm.value
      let comparator = this.comparatorForm.value
      
      let manual = this.strForm.value
      let right = manual ?  manual : this.rightForm.value

      if( left && comparator && right) {
        let newJoinCondition:JoinCondition = {
          leftValue: left,
          comparator: comparator,
          rightValue: right
        }
        this.data.joinConditions.push( newJoinCondition )
        this.clearSelection()
      }

    }
    onAddJoin(){
      this.addJoin()
    }
    onDelete(i:number){
      this.data.joinConditions.splice(i,1)
    }
  }
  