import {  Component,  ElementRef,  Inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { JoinNode, SqlResultInFirebase, SnowFlakeNativeColumn, JoinNodeObj, FunctionOption, JoinNodeActionData, GroupByTransformation, ActionOption, TransformationType, SqlColumnGeneric, SqlResultGeneric } from 'app/datatypes/datatypes.module';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatRadioModule} from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { DaoService } from 'app/dao.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {MatExpansionModule} from '@angular/material/expansion';
import { UrlService } from 'app/url.service';
import { DataGridComponent } from 'app/data-grid/data-grid.component';
import { MatListModule } from '@angular/material/list';
import * as uuid from 'uuid';
import { FirebaseService } from 'app/firebase.service';

@Component({
    selector: 'groupby-dlg',
    templateUrl: 'groupBy-dlg.html',
    styleUrl: 'groupBy-dlg.css',
    imports: [
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
        MatProgressSpinnerModule,
        MatAutocompleteModule,
        MatExpansionModule,
        MatListModule
    ]
})
  export class GroupByDialog implements OnInit{ 
    @ViewChild('input') input!: ElementRef<HTMLInputElement>;
    
    groupByOptions:Array<FunctionOption> = [ 
      FunctionOption.count,  
      FunctionOption.sum,
      FunctionOption.max,
      FunctionOption.min,
      FunctionOption.avg      
    ]

    groupByFunctions = this.fb.array([
      this.fb.group({
        groupBy: [FunctionOption.sum],
        columnName: [''],
        alias:['']
      })
    ])   

    groupByColumns = this.fb.array([
      this.fb.group({
        columnName: ['']
      })
    ])


    columns!:SqlColumnGeneric[]

    filteredOptions: SqlColumnGeneric[] = [];
    filteredGrpOptions: SqlColumnGeneric[] = [];

    result:SqlResultInFirebase | null= null

    constructor(
      public dialogRef: MatDialogRef<GroupByDialog>,
      private fb:FormBuilder,
      private dao:DaoService,
      private urlSrv:UrlService,
      private firebaseService:FirebaseService,
      @Inject(MAT_DIALOG_DATA) public data:JoinNodeActionData) {}

    ngOnInit(): void {

      let node = this.data.node

    
      let previousTransactionId = node.transformations[this.data.currentTransactionIndex-1].id

      this.firebaseService.getdoc( this.data.collectionPath + "/" + node.id + "/sampledata" , previousTransactionId).then( doc =>{
        if(doc.exists()){
          let result = doc.data() as SqlResultGeneric
          this.columns = result.columns
        }
      })      

      if( this.data.action == ActionOption.edit ){ 
        
        this.groupByFunctions.clear()
        let t = this.data.node.transformations[this.data.currentTransactionIndex] as GroupByTransformation    
        t.functions.forEach( j =>{
          let newFG = this.fb.group({
            columnName: [j.columnName],
            groupBy: [j.functionOption],
            alias:[j.alias]
          })
          this.groupByFunctions.push( newFG)
        }) 

        this.groupByColumns.clear()
        t.groupByColumns.forEach( c =>{
          let newFG = this.fb.group({
            columnName: [c]
          })
          this.groupByColumns.push( newFG)
        })    
      } 
      else if( this.data.action == ActionOption.add ){
        //do nothing
      }     
    }

    onAddFunction(){
      let newFG = this.fb.group({
        columnName: [''],
        groupBy: [FunctionOption.sum],
        alias:['']
      })
      this.groupByFunctions.push( newFG)
    }
    onDeleteGroupBy(i:number){
      this.groupByFunctions.controls.splice(i,1)
    }    

    filter(i:number): void {
      let formFG = this.groupByFunctions.controls[i]
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredOptions = this.columns.filter((o => o.columnName.toLowerCase().includes(filterValue.toLowerCase())))
    }   

    filterGrp(i:number): void {
      let formFG = this.groupByColumns.controls[i]
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredGrpOptions = this.columns.filter((o => o.columnName.toLowerCase().includes(filterValue.toLowerCase())))
    }     
    
    onSubmit(){  
      

      let funcs: Array<{
        columnName:string
        functionOption:FunctionOption
        alias:string
      }> = []
      this.groupByFunctions.controls.forEach( fg =>{
        let columnName:string = fg.controls.columnName.value ? fg.controls.columnName.value : ""
        let functionOption:FunctionOption = fg.controls.groupBy.value ? fg.controls.groupBy.value : FunctionOption.max
        let alias = fg.controls.alias.value ? fg.controls.alias.value : ""

        let fun = {
          columnName:columnName ,
          functionOption:functionOption,
          alias:alias ? alias : columnName 
        }
        funcs.push(fun)
      })

      let columns = Array<string>()
      this.groupByColumns.controls.forEach( fg =>{
        let columnName:string = fg.controls.columnName.value ? fg.controls.columnName.value : ""
        columns.push(columnName)
      })      

      let groupByTransformation:GroupByTransformation = {
        type: TransformationType.groupBy,
        id: uuid.v4(),
        functions: funcs,
        groupByColumns: columns
      } 

      let newJoinNode:JoinNode = {
        transformations: [...this.data.node.transformations]
      }      
      if( this.data.action == ActionOption.edit ){     
        newJoinNode.transformations!.splice(this.data.currentTransactionIndex,1,groupByTransformation) 
      }
      else{
        newJoinNode.transformations = [...this.data.node.transformations, groupByTransformation]
      }

      
      this.firebaseService.updateDoc( this.data.collectionPath , this.data.node.id , newJoinNode).then( ()=>{
        console.log("update joinnode add groupBy")
      },
      reason=>{
        alert("error saving join" + reason.error)
      })
    }

    onAddGroupBy(){
      let newFG = this.fb.group({
        columnName: [""],
      })
      this.groupByColumns.push( newFG)
    }
    onRemoveGroupBy(i:number){
      this.groupByColumns.controls.splice(i,1)
    }
  }
  
  