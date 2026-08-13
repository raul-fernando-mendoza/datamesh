import { Component, inject, Input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Connection } from 'app/datatypes/datatypes.module';
import { Schema, SchemaTableService, Table } from 'app/services/schema-table.service';
import { TableSelect } from '../schemaSelect/table-select/table-select';

@Component({
  selector: 'app-schema-select',
  imports: [
    MatButtonModule, 
    MatIconModule,
    MatListModule,
    TableSelect 
  ],
  templateUrl: './schema-select.html',
  styleUrl: './schema-select.css',
})
export class SchemaSelectComponent {

  @Input() connection!:Connection

  schemaService = inject(SchemaTableService)
  schemaSig = signal<undefined|Schema[]>(undefined)
  schemaSelectedSig = signal<undefined|Schema>(undefined)
  
  constructor(){
    
  }
  ngOnInit(): void {
    this.schemaService.getSchemaAndTableData(this.connection.id!).subscribe(
      data =>{
        console.log("Schema and Table Data:", data.rootLevelNodes)
        this.schemaSig.set(data.rootLevelNodes)
      }
    )
  }
  onSchemaSelect( schema:Schema){
    this.schemaSelectedSig.set(schema)
  }

  onSchemaDeselect(){
    this.schemaSelectedSig.set(undefined)
  }

}
