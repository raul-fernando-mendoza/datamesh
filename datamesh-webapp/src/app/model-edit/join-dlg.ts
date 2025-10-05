import {  Component,  ElementRef,  Inject, OnInit, signal, SimpleChange, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {  FormBuilder,  FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ComparatorOption, JoinCondition, JoinNode, JoinData, SqlResultInFirebase, SnowFlakeNativeColumn, JoinNodeObj, SqlColumnGeneric } from 'app/datatypes/datatypes.module';
import { MatCheckboxModule} from '@angular/material/checkbox';
import { MatRadioModule} from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { DaoService } from 'app/dao.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule} from '@angular/material/expansion';
import { UrlService } from 'app/url.service';
import { DataGridComponent } from 'app/data-grid/data-grid.component';
import { MatListModule } from '@angular/material/list';
import * as uuid from 'uuid';
import { FirebaseService } from 'app/firebase.service';

@Component({
    selector: 'join-dlg',
    templateUrl: 'join-dlg.html',
    styleUrl: 'join-dlg.css',
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

    leftColumns!:SqlColumnGeneric[]
    rightColumns!:SqlColumnGeneric[]

    filteredOptions: SqlColumnGeneric[] = [];
    filteredLeftOptions: SqlColumnGeneric[] = [];

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

    
    isEditinPostTransformation = signal("")

    postTransformationForm = this.fb.group({
      label: ['']
    })

    constructor(
      public dialogRef: MatDialogRef<JoinDialog>,
      private fb:FormBuilder,
      private dao:DaoService,
      private urlSrv:UrlService,
      private firebaseService:FirebaseService,
      @Inject(MAT_DIALOG_DATA) public data:JoinData) {}

    ngOnInit(): void {
     
   

      let allPromises:Array<Promise<void>> = []

      let leftNode = this.data.leftNode
      let rightNode = this.data.rightNode

      this.leftColumns = leftNode.transformations[leftNode.transformations.length-1].sampleData!.columns
      this.rightColumns = rightNode.transformations[leftNode.transformations.length-1].sampleData!.columns

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


    filterLeft(i:number): void {
      let formFG = this.joinsFA.controls[i]
      const filterValue = formFG.controls.columnName.value ? formFG.controls.columnName.value : ""
      this.filteredLeftOptions = this.leftColumns.filter((o => o.columnName.toLowerCase().includes(filterValue.toLowerCase())))
    }   
    
    filterJoinExp(i:number): void {
      let formFG = this.joinsFA.controls[i]
      const filterValue = formFG.controls.exp.value ? formFG.controls.exp.value : ""
      this.filteredOptions = this.rightColumns.filter((o => o.columnName.toLowerCase().includes(filterValue.toLowerCase())))
    }   
    onSubmit(){  
      let joinCriteria:JoinCondition[] = []
      this.joinsFA.controls.forEach( joinFG =>{
        let columnName = joinFG.controls.columnName.value 
        let comparator:ComparatorOption = joinFG.controls.comparator.value ? joinFG.controls.comparator.value : ComparatorOption.equal
        let exp = joinFG.controls.exp.value
        let joinCondition:JoinCondition = {
          id:uuid.v4(),
          leftValue: columnName ? columnName : "",
          comparator: comparator ,
          rightValue: exp ? exp : ""
        } 
        joinCriteria.push(joinCondition)
      })

      let newJoinNode:JoinNode = {
        joinCriteria: joinCriteria
      }
      
      this.firebaseService.updateDoc( this.data.rightCollectionPath + "/" + JoinNodeObj.className, this.data.rightNode.id , newJoinNode).then( ()=>{
        console.log("update join")
      },
      reason=>{
        alert("error saving join" + reason.error)
      })
    }

  }
  
  