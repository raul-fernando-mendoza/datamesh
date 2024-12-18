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
    
    rightColumnNames:Array<string> = []

    filterFG = this.fb.group({
      columnName: [''],
      comparator: [ComparatorOption.equal],
      exp:['']
    })
    myControl = new FormControl('');
    filteredOptions: string[] = [];

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
        })
        allPromises.push( leftPromise )
      }
      let rightPromise = this.dao.getTableColumns(this.data.rightNode.connectionId, this.data.rightNode.tableName ).then( right =>{
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
            this.rightColumns.forEach( c =>{
              let f = new FormControl(false)
              this.filteredFA.push(f)
            })  
            this.rightColumns.forEach( c =>{
              this.rightColumnNames.push( c.columnName )
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
    
    filter(): void {
      const filterValue = this.input.nativeElement.value.toLowerCase();
      this.filteredOptions = this.rightColumnNames.filter(o => o.toLowerCase().includes(filterValue));
    }

    onAddFilter(){
      let columnName = this.filterFG.controls.columnName.value 
      let comparator = this.filterFG.controls.comparator.value
      let exp = this.filterFG.controls.exp.value
      if( columnName && comparator && exp ){
        let newCondition:JoinCondition = {
          leftValue: columnName,
          comparator: comparator,
          rightValue: exp
        } 
        this.data.rightNode.filters.push(newCondition)
        this.filterFG.controls.columnName.setValue(null)
        this.filterFG.controls.comparator.setValue(null)
        this.filterFG.controls.exp.setValue(null)
      } 
    }
    onDeleteFilter(i:number){
      this.data.rightNode.filters.splice(i,1)
    }    
  }
  