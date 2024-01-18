import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import {CurrencyPipe} from '@angular/common';
import {MatTableModule} from '@angular/material/table';

interface Transaction {
  item: string;
  cost: number;
}

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
  standalone: true,
  imports:[
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    CurrencyPipe,
    MatTableModule
  ]
})
export class WelcomeComponent {

}
