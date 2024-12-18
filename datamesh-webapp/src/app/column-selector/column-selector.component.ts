import {Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Optional, Output, Self} from '@angular/core';
import {FormControl, FormsModule, NgControl, ReactiveFormsModule} from '@angular/forms';
import {map, Observable, startWith, Subject} from 'rxjs';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import * as uuid from 'uuid';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';

@Component({
  selector: 'app-column-selector',
  templateUrl: './column-selector.component.html',
  styleUrls: ['./column-selector.component.css'],
  standalone: true,
  imports:[
    CommonModule,  
    FormsModule,      
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AsyncPipe,          
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: UserSelectorComponent },
  ],    
})
export class UserSelectorComponent implements OnInit,OnDestroy,MatFormFieldControl<string> {
 
  @Input() options: string[] = [];
  @Output() columnNameSelected = new EventEmitter<string>()
  
  myControl = new FormControl<string>('');
  
  filteredOptions!: Observable<string[]> ;

  columnName:string|null = null

  constructor(
    @Optional() @Self() public ngControl: NgControl
  ){
    if (this.ngControl != null) {
      // Setting the value accessor directly (instead of using
      // the providers) to avoid running into a circular import.
      this.ngControl.valueAccessor = this; 
    }
  }
  ngOnDestroy(): void {
    this.columnNameSelected.complete()
    this.stateChanges.complete()
  }

  writeValue(columnName: string): void {
    console.log( "writevalue:" +columnName)
    this.myControl.setValue(columnName)     
    this.columnName= columnName
  }
  _onChange = (value:string) =>{}
  registerOnChange(fn: any): void {
    this._onChange = fn
  }
  _onTouched =() => {}
  registerOnTouched(fn: any): void {
   this._onTouched =fn
  }
  isDisabled = false
  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = false
  }

  get empty() {
    if (this.columnName && this.columnName.length > 0){
      return false
    }
    return true
  }

  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input()
  get required() {
    return this._required;
  }
  set required(req) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get disabled(): boolean { return this._disabled; }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  private _disabled = false;  

  error= null
  get errorState(): boolean {
    return ( this.error != null)

  }  

  
  stateChanges = new Subject<void>();
  id=uuid.v4();
  focused: boolean = false;
  
  controlType: string = "file-loader";
  autofilled?: boolean;
  userAriaDescribedBy?: string;

  @Input()
  get placeholder() {
    return this._placeholder;
  }
  set placeholder(plh) {
    this._placeholder = plh;
    this.stateChanges.next( )
  }
  private _placeholder: string = "select field";

  setDescribedByIds(ids: string[]): void {
    
  }
  onContainerClick(event: MouseEvent): void {
    
  }

  @Input()
  get value(): string | null {
    return this.columnName
  }
  set value(val: string | null) {
    this.columnName = val
    this.stateChanges.next( )
  }
  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map( value =>{
        const name = typeof value === 'string' ? value : "";
        return name ? this._filter(name as string) : this.options.slice();
      })
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  displayFn(value: string) {
    const name = typeof value === 'string' ? value : "";
    
    return name ;
  } 
  
  onColumnNameChange(columnName:any){
    const val:string = this.myControl.value ? this.myControl.value : ""
    if( typeof val === 'string' && val != ""){
      var valStr:string =  val

      //this.myControl.setValue(columnName)
      this.columnName = valStr
    }
    else{
      this.columnName=null
     
    }
    if( this.columnName ){
      this.columnNameSelected.emit(this.columnName)
      this.stateChanges.next( )
      this._onChange(this.columnName) 
    }
  
  }
  
  onOptionSelect(columnName:string){
    this.columnName=columnName
    this.columnNameSelected.emit(columnName)
    this.stateChanges.next(  )
    this._onChange(columnName)
  }
}
