import {  Component,  ElementRef,  Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';


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
      MatAutocompleteModule
    ]
  })
  export class JoinDialog implements OnInit{ 
    @ViewChild('input') input!: ElementRef<HTMLInputElement>;
    
    comparisonOptions:Array<ComparatorOption> = [  ComparatorOption.equal,
      ComparatorOption.gt,
      ComparatorOption.gte,
      ComparatorOption.lt ,
      ComparatorOption.lte]

 
    leftForm = new FormControl<string>('');
    comparatorForm = new FormControl<ComparatorOption>(ComparatorOption.equal);
    rightForm = new FormControl<string>('');
    strForm = new FormControl<string>('');

    leftFilterFC = new FormControl<string>("")
    comparatorFilterFC = new FormControl<ComparatorOption>(ComparatorOption.equal); 
    rightFilterFC = new FormControl<string>("")

    selectedFieldFA = this.fb.array([])  
    filteredFA = this.fb.array([]) 

    isLoading = false

    leftColumns:Array<SnowFlakeColumn> = []
    rightColumns:Array<SnowFlakeColumn> = []   
    
    leftColumnNames:Array<string> = []
    rightColumnNames:Array<string> = []

    joinsFA = this.fb.array([
      this.fb.group({
        columnName: [''],
        comparator: [ComparatorOption.equal],
        exp:['']
      })
    ])  


    filtersFA = this.fb.array([
      this.fb.group({
        columnName: [''],
        comparator: [ComparatorOption.equal],
        exp:['']
      })
    ])   

    filteredOptions: string[] = [];
    filteredLeftOptions: string[] = [];

    constructor(
      public dialogRef: MatDialogRef<JoinDialog>,
      private fb:FormBuilder,
      private dao:DaoService,
      @Inject(MAT_DIALOG_DATA) public data:JoinData) {}

    ngOnInit(): void {
      this.isLoading = true

      let allPromises:Array<Promise<void>> = []

      if( this.data.leftNode ){
        let leftPromise   = this.dao.getTableColumns(this.data.leftNode.connectionId, this.data.leftNode.tableName ).then( left =>{
          this.isLoading = false
          left.forEach( c => this.leftColumns.push(c))

          this.leftColumns.forEach( c =>{
            this.leftColumnNames.push( c.columnName )
          })           

          this.joinsFA.clear()
          this.data.rightNode.joinCriteria.forEach( j =>{
            let newJoinFG = this.fb.group({
              columnName: [j.leftValue],
              comparator: [j.comparator],
              exp:[j.rightValue]
            })
            this.joinsFA.push( newJoinFG)
          })            
        })
        allPromises.push( leftPromise )
      }
      let rightPromise = this.dao.getTableColumns(this.data.rightNode.connectionId, this.data.rightNode.tableName ).then( right =>{
            console.debug( right )

            right.forEach( c => this.rightColumns.push(c))

            this.rightColumns.forEach( c =>{
              this.rightColumnNames.push( c.columnName )
            })   

            this.data.rightNode.children?.forEach( child =>{
              let prefix = child.name
              child.selectedColumns.forEach( selectedColumn =>{
                this.rightColumnNames.push( prefix + "_" + selectedColumn )           
              })
            })

            //generate a form control for each column name
            this.rightColumnNames.forEach( c =>{
              let selected = false
              if( this.data.rightNode.selectedColumns.find( s => s == c) ){
                selected = true
              }
              let f = new FormControl(selected)
              this.selectedFieldFA.push(f)
            })

            this.filtersFA.clear()
            this.data.rightNode.filters.forEach( f =>{
              let newFilterFG = this.fb.group({
                columnName: [f.leftValue],
                comparator: [f.comparator],
                exp:[f.rightValue]
              })
              this.filtersFA.push( newFilterFG)
            })  
      })
      allPromises.push( rightPromise )

      Promise.all( allPromises ).then( () =>{
        this.isLoading = false
      }
      ,error=>{
        this.isLoading = false
        alert("error retriving columns")
      })
    }
    clearSelection(){
      this.leftForm.setValue("")
      this.rightForm.setValue("")
      this.comparatorForm.setValue(ComparatorOption.equal)
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
    onLeftSelectedField(index:number, value:boolean){
      console.log("selected"+ this.selectedFieldFA.at(index).value)
      this.data.rightNode.selectedColumns.length = 0
      for( let i =0; i< this.selectedFieldFA.controls.length; i++){
        if( this.selectedFieldFA.at(i).value ){
          let column = this.rightColumnNames[i]
          this.data.rightNode.selectedColumns.push(column)
        }
      }
      
    } 
    
    filter(i:number): void {
      let formFG = this.filtersFA.controls[i]
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredOptions = this.rightColumnNames.filter(o => o.toLowerCase().includes(filterValue.toLowerCase()));
    }

    filterLeft(i:number): void {
      let formFG = this.joinsFA.controls[i]
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredLeftOptions = this.leftColumnNames.filter(o => o.toLowerCase().includes(filterValue.toLowerCase()));
    }   
    filterJoinExp(i:number): void {
      let formFG = this.joinsFA.controls[i]
      const filterValue = formFG.controls.exp.value ? formFG.controls.exp.value : ""
      this.filteredOptions = this.rightColumnNames.filter(o => o.toLowerCase().includes(filterValue.toLowerCase()));
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
  