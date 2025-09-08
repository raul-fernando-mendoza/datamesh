import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationComponent } from './navigation/navigation.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [
        CommonModule,
        NavigationComponent
    ]
})
export class AppComponent {
  title = 'datamesh-webapp';
}
