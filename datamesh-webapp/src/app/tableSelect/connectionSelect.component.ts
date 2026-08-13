import {Component, inject, OnInit, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule } from '@angular/material/list';
import { ConnectionsService } from 'app/connections.service';
import { Connection } from 'app/datatypes/datatypes.module';
import { SchemaSelectComponent } from './schema-select/schema-select';




/**
 * @title Tree with nested nodes using childAccessor
 */
@Component({
  selector: 'connection-select',
  templateUrl: './connectionSelect.component.html',
  styleUrl: './connectionSelect.component.css',
  imports: [
    MatButtonModule, 
    MatIconModule,
    MatListModule,
    SchemaSelectComponent
  ],
})
export class ConnectionSelectComponent implements OnInit {

  connectionService = inject(ConnectionsService)
  connectionSig = signal<undefined|Connection[]>(undefined)
  connectionSelectedSig = signal<undefined|Connection>(undefined)
  
  constructor(){
    
  }
  ngOnInit(): void {
    this.connectionService.getConnections().then( 
      data =>{
        this.connectionSig.set( data )
      }
    )
  }
  onConnectionSelect( conn:Connection){
    this.connectionSelectedSig.set(conn)
  }

  onConnectionDeselect(){
    this.connectionSelectedSig.set(undefined)
  }



  

}

