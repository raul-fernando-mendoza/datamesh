import { AfterViewInit, EventEmitter, Inject, Input, Optional, Output, ViewChild } from '@angular/core';
import { HostBinding } from '@angular/core';
import { Self } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { ControlValueAccessor, NgControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Observable, Subject } from 'rxjs';

import { basicSetup, minimalSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { Compartment, EditorState, Extension } from '@codemirror/state';
import { keymap, EditorView } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  oneDark,
  oneDarkTheme,
  oneDarkHighlightStyle,
} from '@codemirror/theme-one-dark';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
import { DOCUMENT } from '@angular/common';


@Component({
  selector: 'sql-edit',
  templateUrl: './sql-edit.component.html',
  styleUrls: ['./sql-edit.component.css'],
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: SqlEditComponent,multi:true}],
})
export class SqlEditComponent  implements AfterViewInit, ControlValueAccessor {

  @ViewChild('myeditor') myEditor: any;
  //@Input() private disabled = false;
  @Output() private valueChange = new EventEmitter();

  view!:EditorView
  myExt!:Extension
  current_text:string =""
  
  constructor(@Inject(DOCUMENT) private document: Document) { 

  }


  setup(){
    let myEditorElement = this.myEditor.nativeElement;
    var thiz = this
    this.myExt = [
      basicSetup, sql(),
      
      EditorView.updateListener.of(function(e) {
        var str = e.state.doc.toString();
        if( e.focusChanged && !e.view.hasFocus  ){
          thiz.valueChange.emit(str);
        }
        thiz._onChange(str)
    })     
    ];
    let state!: EditorState;

    try {
      state = EditorState.create({
        doc: this.current_text,
        extensions: this.myExt,
      });
    } catch (e) {
      //Please make sure install codemirror@6.0.1
      //If your command was npm install codemirror, will installed 6.65.1(whatever)
      //You will be here.
      console.error(e);
    }

    this.view = new EditorView({
      state,
      parent: myEditorElement,
    });

  }

  update(new_text:string){
    this.current_text = new_text
    if( this.myEditor ){

      let myEditorElement = this.myEditor.nativeElement;
      let state!: EditorState;

      try {
        state = EditorState.create({
          doc: new_text,
          extensions: this.myExt,
        });
        this.view.setState(
          state
        )      
      } catch (e) {
        //Please make sure install codemirror@6.0.1
        //If your command was npm install codemirror, will installed 6.65.1(whatever)
        //You will be here.
        console.error(e);
      }

    }  

  }
  ngAfterViewInit(): void {
    
    this.setup()

  }

  writeValue(obj: any): void {
    console.log("********** recibing value:" + obj)
    this.update( obj)
  }
  _onChange:any
  registerOnChange(fn: any): void {
    //console.log("registering on change:" + fn)
    this._onChange = fn
  }
  _onTouched:any
  registerOnTouched(fn: any): void {
    this._onTouched = fn
  }
  _isDisabled:boolean=false
  setDisabledState?(isDisabled: boolean): void {
    this._isDisabled = isDisabled
  }
}
