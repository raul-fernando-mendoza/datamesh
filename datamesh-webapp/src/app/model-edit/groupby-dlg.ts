import {  Component,  ElementRef,  Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { JoinNode, SqlResultInFirebase, SnowFlakeNativeColumn, JoinNodeObj, GroupByOption, JoinNodeActionData, GroupByTransformation, ActionOption, TransformationType } from 'app/datatypes/datatypes.module';
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
        DataGridComponent,
        MatListModule
    ]
})
  export class GroupByDialog implements OnInit{ 
    @ViewChild('input') input!: ElementRef<HTMLInputElement>;
    
    groupByOptions:Array<GroupByOption> = [  
      GroupByOption.sum,
      GroupByOption.max,
      GroupByOption.min,
      GroupByOption.avg      
    ]

    groupBysFA = this.fb.array([
      this.fb.group({
        columnName: [''],
        groupBy: [GroupByOption.sum],
        exp:['']
      })
    ])   

    columns!:SnowFlakeNativeColumn[]

    filteredOptions: SnowFlakeNativeColumn[] = [];

    result:SqlResultInFirebase | null= null

    constructor(
      public dialogRef: MatDialogRef<GroupByDialog>,
      private fb:FormBuilder,
      private dao:DaoService,
      private urlSrv:UrlService,
      private firebaseService:FirebaseService,
      @Inject(MAT_DIALOG_DATA) public data:JoinNodeActionData) {}

    ngOnInit(): void {

      let leftNode = this.data.node

      this.columns = leftNode.transformations[0].sampleData!.metadata

      if( this.data.action == ActionOption.edit ){ 
        this.groupBysFA.clear()    
        let t = this.data.node.transformations[this.data.currentTransactionIndex] as GroupByTransformation    
        t.groupBys.forEach( j =>{
          let newFG = this.fb.group({
            columnName: [j.columnName],
            groupBy: [j.groupBy],
            exp:[j.expresion]
          })
          this.groupBysFA.push( newFG)
        })     
      } 
      else if( this.data.action == ActionOption.add ){
        //don nothing
      }     
    }

    onAddGroupBy(){
      let newFG = this.fb.group({
        columnName: [''],
        groupBy: [GroupByOption.sum],
        exp:['']
      })
      this.groupBysFA.push( newFG)
    }
    onDeleteGroupBy(i:number){
      this.groupBysFA.controls.splice(i,1)
    }    

    filter(i:number): void {
      let formFG = this.groupBysFA.controls[i]
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredOptions = this.columns.filter((o => o.name.toLowerCase().includes(filterValue.toLowerCase())))
    }   
    
    onSubmit(){  
      let GroupByTransformation:GroupByTransformation[] = []

      let groupBys: Array<{
        columnName:string
        groupBy:GroupByOption
        expresion:string
      }> = []
      this.groupBysFA.controls.forEach( fg =>{
        let columnName = fg.controls.columnName.value 
        let groupByOption:GroupByOption = fg.controls.groupBy.value ? fg.controls.groupBy.value : GroupByOption.max
        let exp = fg.controls.exp.value

        let groupBy = {
          columnName:columnName ? columnName : "",
          groupBy:groupByOption,
          expresion:exp ? exp:""
        }
        groupBys.push(groupBy)
      })

      let groupByTransformation:GroupByTransformation = {
        type:TransformationType.groupBy,
        id:uuid.v4(),
        groupBys: groupBys
      } 


      let newJoinNode:JoinNode = {
        transformations: [...this.data.node.transformations, groupByTransformation]
      }
      
      this.firebaseService.updateDoc( this.data.collectionPath + "/" + JoinNodeObj.className, this.data.node.id , newJoinNode).then( ()=>{
        console.log("update joinnode add groupBy")
      },
      reason=>{
        alert("error saving join" + reason.error)
      })
    }

  }
  
  