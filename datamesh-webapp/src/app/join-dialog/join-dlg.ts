import {  ChangeDetectionStrategy, Component,  Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormArray, FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SnowFlakeColumn, ComparatorOption, JoinCondition, JoinNode, JoinData } from 'app/datatypes/datatypes.module';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatRadioModule} from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { DaoService } from 'app/dao.service';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


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
      MatRadioModule,
      MatTabsModule,
      MatProgressSpinnerModule
    ]
  })
  export class JoinDialog implements OnInit{ 
    comparisonOptions:Array<ComparatorOption> = [  ComparatorOption.equal,
      ComparatorOption.gt,
      ComparatorOption.gte,
      ComparatorOption.lt ,
      ComparatorOption.lte]

 
    leftForm = new FormControl<string>('');
    comparatorForm = new FormControl<ComparatorOption>(ComparatorOption.equal);
    rightForm = new FormControl<string>('');
    strForm = new FormControl<string>('');

    selectedFieldFA = this.fb.array([])   

    isLoading = false

    leftColumns:Array<SnowFlakeColumn> = []
    rightColumns:Array<SnowFlakeColumn> = []    

    constructor(
      public dialogRef: MatDialogRef<JoinDialog>,
      private fb:FormBuilder,
      private dao:DaoService,
      @Inject(MAT_DIALOG_DATA) public data:JoinData) {}

    ngOnInit(): void {
      this.isLoading = true
      this.dao.getTableColumns(this.data.rightNode.connectionId, this.data.rightNode.tableName ).then( right =>{
            console.debug( right )
            right.forEach( c => this.rightColumns.push(c))
            this.rightColumns.forEach( c =>{
              let selected = false
              if( this.data.rightNode.selectedColumns.find( s => s == c.columnName) ){
                selected = true
              }
              let f = new FormControl(selected)
              this.selectedFieldFA.push(f)
            })             
      }).then( ()=>{
        if( this.data.leftNode ){
          this.dao.getTableColumns(this.data.leftNode.connectionId, this.data.leftNode.tableName ).then( left =>{
            this.isLoading = false
            left.forEach( c => this.leftColumns.push(c))
          }
          ,error=>{
            this.isLoading = false
            alert("error retriving columns")
          })
        }
        else{
          this.isLoading = false
        }
      })
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
        this.data.rightNode.joinCriteria.push( newJoinCondition )
        this.clearSelection()
      }

    }
    onAddJoin(){
      this.addJoin()
    }
    onDelete(i:number){
      this.data.rightNode.joinCriteria.splice(i,1)
    }
    onLeftSelectedField(index:number, value:boolean){
      console.log("selected"+ this.selectedFieldFA.at(index).value)
      this.data.rightNode.selectedColumns.length = 0
      for( let i =0; i< this.selectedFieldFA.controls.length; i++){
        if( this.selectedFieldFA.at(i).value ){
          let column = this.rightColumns[i]
          this.data.rightNode.selectedColumns.push(column.columnName)
        }
      }
      
    }    
  }
  