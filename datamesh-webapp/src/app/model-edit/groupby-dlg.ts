import {  Component,  ElementRef,  Inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { JoinNode, SqlResultInFirebase, SnowFlakeNativeColumn, JoinNodeObj, FunctionOption, JoinNodeActionData, GroupByTransformation, ActionOption, TransformationType, SqlColumnGeneric } from 'app/datatypes/datatypes.module';
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
      FunctionOption.sum,
      FunctionOption.max,
      FunctionOption.min,
      FunctionOption.avg      
    ]

    groupBysFA = this.fb.array([
      this.fb.group({
        columnName: [''],
        groupBy: [FunctionOption.sum],
        alias:['']
      })
    ])   

    grpFA = this.fb.group({
        columnName: ['']
    })


    columns!:SqlColumnGeneric[]

    filteredOptions: SqlColumnGeneric[] = [];
    filteredGrpOptions: SqlColumnGeneric[] = [];

    result:SqlResultInFirebase | null= null

    groupByColumns = signal<Array<string>>([])

    constructor(
      public dialogRef: MatDialogRef<GroupByDialog>,
      private fb:FormBuilder,
      private dao:DaoService,
      private urlSrv:UrlService,
      private firebaseService:FirebaseService,
      @Inject(MAT_DIALOG_DATA) public data:JoinNodeActionData) {}

    ngOnInit(): void {

      let leftNode = this.data.node

      this.columns = leftNode.transformations[leftNode.transformations.length-1].sampleData!.columns

      if( this.data.action == ActionOption.edit ){ 
        this.groupBysFA.clear()    
        let t = this.data.node.transformations[this.data.currentTransactionIndex] as GroupByTransformation    
        t.functions.forEach( j =>{
          let newFG = this.fb.group({
            columnName: [j.columnName],
            groupBy: [j.functionOption],
            alias:[j.alias]
          })
          this.groupBysFA.push( newFG)
        })     
      } 
      else if( this.data.action == ActionOption.add ){
        //don nothing
      }     
    }

    onAddFunction(){
      let newFG = this.fb.group({
        columnName: [''],
        groupBy: [FunctionOption.sum],
        alias:['']
      })
      this.groupBysFA.push( newFG)
    }
    onDeleteGroupBy(i:number){
      this.groupBysFA.controls.splice(i,1)
    }    

    filter(i:number): void {
      let formFG = this.groupBysFA.controls[i]
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredOptions = this.columns.filter((o => o.columnName.toLowerCase().includes(filterValue.toLowerCase())))
    }   

    filterGrp(): void {
      let formFG = this.grpFA
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredGrpOptions = this.columns.filter((o => o.columnName.toLowerCase().includes(filterValue.toLowerCase())))
    }     
    
    onSubmit(){  
      let GroupByTransformation:GroupByTransformation[] = []

      let funcs: Array<{
        columnName:string
        functionOption:FunctionOption
        alias:string
      }> = []
      this.groupBysFA.controls.forEach( fg =>{
        let columnName = fg.controls.columnName.value 
        let functionOption:FunctionOption = fg.controls.groupBy.value ? fg.controls.groupBy.value : FunctionOption.max
        let alias = fg.controls.alias.value

        let fun = {
          columnName:columnName ? columnName : "",
          functionOption:functionOption,
          alias:alias ? alias:""
        }
        funcs.push(fun)
      })

      let groupByTransformation:GroupByTransformation = {
        type: TransformationType.groupBy,
        id: uuid.v4(),
        functions: funcs,
        groupByColumns: this.groupByColumns()
      } 


      let newJoinNode:JoinNode = {
        transformations: [...this.data.node.transformations, groupByTransformation]
      }
      
      this.firebaseService.updateDoc( this.data.collectionPath , this.data.node.id , newJoinNode).then( ()=>{
        console.log("update joinnode add groupBy")
      },
      reason=>{
        alert("error saving join" + reason.error)
      })
    }

    onAddGroupBy(){
      let columnName = this.grpFA.controls.columnName.value!
      let currentSelection = this.groupByColumns()
      this.groupByColumns.set( [ ...currentSelection , columnName])
    }
    onRemoveGroupBy(i:number){
      let currentSelection = this.groupByColumns()
      currentSelection.splice(i,1)
      this.groupByColumns.set( [ ...currentSelection ])
    }
  }
  
  