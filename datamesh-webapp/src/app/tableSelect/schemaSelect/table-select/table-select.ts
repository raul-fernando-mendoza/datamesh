import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, inject, Input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Connection } from 'app/datatypes/datatypes.module';
import { Schema, SchemaTableService, Table } from 'app/services/schema-table.service';


@Component({
  selector: 'app-table-select',
  imports: [
    MatButtonModule, 
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    CdkDrag, CdkDropList,    
  ],
  templateUrl: './table-select.html',
  styleUrl: './table-select.css',
})
export class TableSelect {

  @Input() connection!:Connection
  @Input() schema!:Schema

  schemaService = inject(SchemaTableService)
  tableSig = signal<undefined|Table[]>(undefined)
  tableSelectedSig = signal<undefined|Table>(undefined)
  
  constructor(){
    
  }
  ngOnInit(): void {
    this.schemaService.getSchemaAndTableData(this.connection.id!).subscribe(
      data =>{
        console.log("Schema and Table Data:", data.dataMap.get(this.schema.id))
        this.tableSig.set(data.dataMap.get(this.schema.id))
      }
    )
  }
  onTableSelect( table:Table){
    this.tableSelectedSig.set(table)
  }

  onTableDeselect(){
    this.tableSelectedSig.set(undefined)
  }

}

