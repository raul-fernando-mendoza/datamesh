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
      /*
      Promise.all( allPromises ).then( () =>{
        this.isLoading = false

        //if there is a leftNode add the joins
        this.joinsFA.clear()
        if( this.data.leftNode ){          
          this.data.rightNode.joinCriteria.forEach( j =>{
            let newJoinFG = this.fb.group({
              columnName: [j.leftValue],
              comparator: [j.comparator],
              exp:[j.rightValue]
            })
            this.joinsFA.push( newJoinFG)
          })     
        }
/*
        this.data.rightNode.children?.forEach( child =>{
          let prefix = child.name
          child.selectedColumns.forEach( selectedColumn =>{
            console.log("")  
          })
        })

        //load the childs selected columns
        this.childColumnsSelectedFA.length = 0
        /*
        //iterate over each children       
        for( let i =0; this.data.rightNode.children && i < this.data.rightNode.children.length; i++){
          // first initialize the FA
          this.childColumnsSelectedFA[i] = []
          //get the current child
          let child = this.data.rightNode.children[i]
          
          //iterate over the selected columns of the child
          child.selectedColumns.forEach( c =>{
            //now search if the child columns is in the selected expresion of the parent
            let selected = true
            let alias = ""

            //find out if the column in the child has been marked as selected
            if( i in this.data.rightNode.selectedChildColumns ){
                let arr: SelectedColumn[] = this.data.rightNode.selectedChildColumns[i]
                let selectedColumn = arr.find( s => s.exp == (c.alias?c.alias:c.exp) )
                if( selectedColumn ){
                  selected = selectedColumn.isSelected
                  alias = selectedColumn.alias
                }
            }
            let g = this.fb.group({
              columnName: [(c.alias?c.alias:c.exp)],
              selected: [selected],
              alias:[alias]
            })
            this.childColumnsSelectedFA[i].push(g)
          })             
  
  

        }

        //load the filters
        this.filtersFA.clear()
        
        this.data.rightNode.filters.forEach( f =>{
          let newFilterFG = this.fb.group({
            columnName: [f.leftValue],
            comparator: [f.comparator],
            exp:[f.rightValue]
          })
          this.filtersFA.push( newFilterFG)
        })  


        
      }
      ,error=>{
        this.isLoading = false
        alert("error retriving columns")
      })
*/      
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

    /*
    onDelete(i:number){
      this.filtersFA.controls.splice(i,1)
    }
    
    filter(i:number): void {
      let formFG = this.filtersFA.controls[i]
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredOptions = this.data.rightNode.columns.filter(o => o.columnName.toLowerCase().includes(filterValue.toLowerCase()));
    }
*/
    filter(i:number): void {
      let formFG = this.groupBysFA.controls[i]
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredOptions = this.columns.filter((o => o.name.toLowerCase().includes(filterValue.toLowerCase())))
    }   
    
    /*  

    onAddFilter(){
      let newFilter = this.fb.group({
        columnName: [''],
        comparator: [ComparatorOption.equal],
        exp:['']
      })  
      
      this.filtersFA.controls.push( newFilter )
    }
    onDeleteFilter(i:number){
      this.filtersFA.controls.splice(i,1)
    }    
    getSampleData(tableName:string):Promise<SqlResultInFirebase>{
      return new Promise(( resolve, reject ) => {
        
        let sql = "select * from " + tableName + " limit 10"
        let connectionId = this.data.rightNode.connectionId

        var req = {
          connectionId:connectionId,
          sql:sql
        }
        this.isLoading = true
        this.urlSrv.post("executeSql",req).subscribe({ 
          'next':(result:any)=>{
            this.isLoading = false
            console.log( result )
            resolve( result )
          },
          'error':(reason)=>{   
            this.isLoading = false     
            reject( reason.error.error )
          }
        })         
      })  
    }
    refreshColumnsAndSampleData(){
      
      let rightPromise = this.dao.getTableColumns(this.data.rightNode.connectionId, this.data.rightNode.tableName ).then( 
        right =>{
          console.debug( right )
          this.data.rightNode.columns.length = 0
          this.columnsFA.clear()
          right.forEach( c => this.data.rightNode.columns.push(c)) 

          //now recreate the columns form
          
          
          this.data.rightNode.columns.forEach( c =>{
            let selected = false
            let alias = ""
            let selectedColumn = this.data.rightNode.selectedColumns.find( s => s.exp == c.columnName)
            if( selectedColumn && selectedColumn.isSelected ){
              selected = true
              alias = selectedColumn.alias
            }
            let g = this.fb.group({
              columnName: [c.columnName],
              selected: [selected],
              alias:[alias]
            })
            this.columnsFA.push(g)
          })            
        },
        error=>{
          alert("error retriving columns")
        })
        

      let tableName = this.data.rightNode.tableName
      let sampleData = this.getSampleData(tableName).then( result =>{
        let sqlResult:SqlResultInFirebase = {
          metadata:result.metadata,
          resultSet:[]
        }
        for(let i=0; i<result.resultSet.length; i++){ 
          let row = result.resultSet[i]             
          let data:{[key: string]:any}={}
          for( let c=0; c<row.length; c++){
            data["k_" + c] = row[c]
          }
          sqlResult.resultSet.push(data)
        }
        this.data.rightNode.sampleData = sqlResult
      })
      
    }
*/
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
  
  