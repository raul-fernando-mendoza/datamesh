import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { EXAMPLE_DATA, NodeTableDataSource, NodeTableRow } from '../node-table/node-table-datasource';
import { db } from '../../environments/environment'
import { Observable } from 'rxjs';

import { collection, doc, deleteDoc , onSnapshot} from "firebase/firestore"; 
import { DatasetCreateComponent } from '../dataset-create/dataset-create.component';
import { MatDialog } from '@angular/material/dialog';
import { Dataset } from '../datatypes/datatypes.module';

@Component({
  selector: 'app-dataset-list',
  templateUrl: './dataset-list.component.html',
  styleUrls: ['./dataset-list.component.css']
})
export class DatasetListComponent implements AfterViewInit, OnInit, OnDestroy{

  @ViewChild(MatPaginator) paginator!: MatPaginator ;
  @ViewChild(MatSort) sort!: MatSort ;
  @ViewChild(MatTable) table!: MatTable<Dataset> ; 

  collectionName = "Dataset"
 
  constructor(public dialog: MatDialog) {

       
  }
  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
  }

  dataSource: Dataset[] = [] 
  
  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['name','actions'];

  submmiting=false

  unsubscribe:any=null


  ngOnInit(): void {
 
  }
  ngAfterViewInit(): void {
    this.updateList()
  }

  onAddQry(){
    this.editQry(null)
  }

  editQry(dataset:Dataset|null){
    const dialogRef = this.dialog.open(DatasetCreateComponent, {
      height: '80%',
      width: '80%',
      data: dataset
    });
  
    dialogRef.afterClosed().subscribe( (data:any) => {
      console.log('The dialog was closed');
      if( data != undefined && data != ''){
        console.log(data)
        //this.router.navigate(['revision-edit',{ revisionId:data }])
      }
      else{
        console.debug("none")
      }
    });    
    
  }

  updateList(){

    this.unsubscribe = onSnapshot(collection(db,this.collectionName),
          (set) =>{
            this.dataSource.length = 0
            set.docs.map( doc =>{
              var dataset=doc.data() as Dataset
              this.dataSource.push( dataset )
            })
            this.dataSource.sort( (a,b)=>( (a as Dataset).label! > (b as Dataset).label! ) ? 1:-1)
            this.sort.active = 'title'
            this.sort.direction = 'asc'     
            this.table.dataSource = this.dataSource;              
            this.table.renderRows()
          },
          (reason:any) =>{
            alert("ERROR update list:" + reason)
          }  
    )
  }  
  onRemove(id:string){
    deleteDoc( doc( db, this.collectionName, id )).then( () =>{
      console.log("remove successful")
    },
    reason =>{
      alert("ERROR removing:" + reason)
    })
  }  

  onEdit(obj:Dataset){
    this.editQry(obj)
  }
}
