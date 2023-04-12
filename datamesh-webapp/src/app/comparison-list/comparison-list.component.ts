import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { EXAMPLE_DATA, NodeTableDataSource, NodeTableRow } from '../node-table/node-table-datasource';
import { db } from '../../environments/environment'
import { Observable } from 'rxjs';

import { collection, deleteDoc , doc, onSnapshot} from "firebase/firestore"; 
import { DatasetCreateComponent } from '../dataset-create/dataset-create.component';
import { MatDialog } from '@angular/material/dialog';
import { Comparison, Dataset } from '../datatypes/datatypes.module';

import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-joins-list',
  templateUrl: './comparison-list.component.html',
  styleUrls: ['./comparison-list.component.css']
})
export class ComparisonListComponent implements AfterViewInit, OnInit, OnDestroy{

  @ViewChild(MatPaginator) paginator!: MatPaginator ;
  @ViewChild(MatSort) sort!: MatSort ;
  @ViewChild(MatTable) table!: MatTable<Comparison> ; 

  collectionName = "Comparison"

  unsubscribe:any = null

  constructor(
    public dialog: MatDialog,
    private router:Router,
    private route:ActivatedRoute) {

      if( this.route.snapshot.paramMap.get('id') != 'null'){ 
         
      }     
  }

  dataSource: Comparison[] = []; 
  
  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['name',"actions"];

  submmiting=false

  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }    
  }
  ngOnInit(): void {
 
  }
  ngAfterViewInit(): void {
    this.updateList()
  }

  

  onAdd(){
    this.router.navigate(["Comparison-edit"])  
  }

  updateList(){

    this.unsubscribe = onSnapshot(collection(db,"Comparison"),
          (set) =>{
            this.dataSource.length = 0
            set.docs.map( doc =>{
              var comparison=doc.data() as Comparison
              this.dataSource.push( comparison )
            })
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

  onEdit(comparison:Comparison){
    this.router.navigate(['Comparison-edit',{ id:comparison.id }])
  }

  onRemove(id:string){
    deleteDoc( doc( db, this.collectionName, id )).then( () =>{
      console.log("remove successful")
    },
    reason =>{
      alert("ERROR removing:" + reason)
    })
  }

}
