import {  Component,  ElementRef,  Inject, OnInit, SimpleChange, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormArray, FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SnowFlakeColumn, ComparatorOption, JoinCondition, JoinNode, JoinData, SelectedColumn, SqlResultObj, SqlResultInFirebase } from 'app/datatypes/datatypes.module';
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
      MatProgressSpinnerModule,
      MatAutocompleteModule,
      MatExpansionModule,
      DataGridComponent
    ]
  })
  export class JoinDialog implements OnInit{ 
    @ViewChild('input') input!: ElementRef<HTMLInputElement>;
    
    comparisonOptions:Array<ComparatorOption> = [  
      ComparatorOption.equal,
      ComparatorOption.gt,
      ComparatorOption.gte,
      ComparatorOption.lt ,
      ComparatorOption.lte,
      ComparatorOption.ne
    ]
 

    selectedColumnsFA = this.fb.array([
      {
        columnName: [''],
        selected: [true],
        alias:['']
      }
    ])  

    filteredFA = this.fb.array([]) 

    isLoading = false


    joinsFA = this.fb.array([
      this.fb.group({
        columnName: [''],
        comparator: [ComparatorOption.equal],
        exp:['']
      })
    ])  

    columnsFA = this.fb.array([
      this.fb.group({
        columnName: [''],
        selected: [true],
        alias:['']
      })
    ])     

    filtersFA = this.fb.array([
      this.fb.group({
        columnName: [''],
        comparator: [ComparatorOption.equal],
        exp:['']
      })
    ])   

    filteredOptions: SnowFlakeColumn[] = [];
    filteredLeftOptions: SnowFlakeColumn[] = [];

    childColumnsSelectedFA = [
      [
        this.fb.group({
          columnName: [''],
          selected: [true],
          alias:['']
        }),        
      ]
      ,
      [
        this.fb.group({
          columnName: [''],
          selected: [true],
          alias:['']
        }),        
      ]
    ]

    result:SqlResultInFirebase | null= null

    constructor(
      public dialogRef: MatDialogRef<JoinDialog>,
      private fb:FormBuilder,
      private dao:DaoService,
      private urlSrv:UrlService,
      @Inject(MAT_DIALOG_DATA) public data:JoinData) {}

    ngOnInit(): void {
     
      this.isLoading = true

      let allPromises:Array<Promise<void>> = []

      if( this.data.leftNode!= null && this.data.leftNode.columns.length == 0){
        let leftPromise   = this.dao.getTableColumns(this.data.leftNode.connectionId, this.data.leftNode.tableName ).then( left =>{
          this.isLoading = false
          this.data.leftNode.columns.length = 0

          left.forEach( c => this.data.leftNode!.columns.push(c))            

 

        })
        allPromises.push( leftPromise )
      }
      this.refreshColumnsAndSampleData()

       
      

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

        this.data.rightNode.children?.forEach( child =>{
          let prefix = child.name
          child.selectedColumns.forEach( selectedColumn =>{
            console.log("")  
          })
        })

        //load the childs selected columns
        this.childColumnsSelectedFA.length = 0
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
    }

    onAddJoin(){
      let newJoinFG = this.fb.group({
        columnName: [""],
        comparator: [ComparatorOption.equal],
        exp:[""]
      })
      this.joinsFA.push( newJoinFG)
    }
    onDeleteJoin(i:number){
      this.joinsFA.controls.splice(i,1)
    }    
    onDelete(i:number){
      this.filtersFA.controls.splice(i,1)
    }
    
    filter(i:number): void {
      let formFG = this.filtersFA.controls[i]
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredOptions = this.data.rightNode.columns.filter(o => o.columnName.toLowerCase().includes(filterValue.toLowerCase()));
    }

    filterLeft(i:number): void {
      let formFG = this.joinsFA.controls[i]
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredLeftOptions = this.data.leftNode.columns.filter(o => o.columnName.toLowerCase().includes(filterValue.toLowerCase()));
    }   
    filterJoinExp(i:number): void {
      let formFG = this.joinsFA.controls[i]
      const filterValue = formFG.controls.exp.value ? formFG.controls.exp.value : ""
      this.filteredOptions = this.data.rightNode.columns.filter(o => o.columnName.toLowerCase().includes(filterValue.toLowerCase()));
    }     

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

    onSubmit(){

      this.data.rightNode.joinCriteria.length = 0
      this.joinsFA.controls.forEach( joinFG =>{
        let columnName = joinFG.controls.columnName.value 
        let comparator:ComparatorOption = joinFG.controls.comparator.value ? joinFG.controls.comparator.value : ComparatorOption.equal
        let exp = joinFG.controls.exp.value
        let joinCondition:JoinCondition = {
          leftValue: columnName ? columnName : "",
          comparator: comparator ,
          rightValue: exp ? exp : ""
        } 
        this.data.rightNode.joinCriteria.push(joinCondition)
      })

      this.data.rightNode.selectedColumns.length = 0
      this.columnsFA.controls.forEach( columnFG =>{
        let columnName = columnFG.controls.columnName.value! 
        let selected = columnFG.controls.selected.value ? columnFG.controls.selected.value : false
        let exp = columnFG.controls.alias.value || ""
        if( selected ){
          let selectedColumn:SelectedColumn = {
            exp: columnName,
            alias: exp,
            isSelected:selected
          }
          this.data.rightNode.selectedColumns.push(selectedColumn)
        }
      }) 
      
      //save the selected child columns
      this.data.rightNode.selectedChildColumns = {}
      for(let i=0; i<this.childColumnsSelectedFA.length; i++){
        let childColumnsSelectedFA = this.childColumnsSelectedFA[i]
        this.data.rightNode.selectedChildColumns[i] = [] 
        childColumnsSelectedFA.forEach( FG =>{
          let exp:string = FG.controls.columnName.value || ""
          let selected = FG.controls.selected.value ? FG.controls.selected.value : false  
          let alias = FG.controls.alias.value || ""
          let selectedColumn:SelectedColumn = {
            exp: exp,
            alias: alias,
            isSelected: selected
          }
          this.data.rightNode.selectedChildColumns[i].push(selectedColumn)
        })
      }


      this.data.rightNode.filters.length = 0
      this.filtersFA.controls.forEach( filterFG =>{
        let columnName = filterFG.controls.columnName.value 
        let comparator:ComparatorOption = filterFG.controls.comparator.value ? filterFG.controls.comparator.value : ComparatorOption.equal
        let exp = filterFG.controls.exp.value
        let joinCondition:JoinCondition = {
          leftValue: columnName ? columnName : "",
          comparator: comparator ,
          rightValue: exp ? exp : ""
        } 
        this.data.rightNode.filters.push(joinCondition)
      })

    }

  }
  