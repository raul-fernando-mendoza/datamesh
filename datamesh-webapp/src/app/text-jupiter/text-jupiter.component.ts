import { Component, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TextJupiter } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import { UrlService } from '../url.service';

@Component({
  selector: 'app-text-jupiter',
  templateUrl: './text-jupiter.component.html',
  styleUrls: ['./text-jupiter.component.css']
})
export class TextJupiterComponent { 
  @Input() parentCollection!:string
  @Input() collection!:string
  @Input() id!:string

  unsubscribe:any 
  textJupiter:TextJupiter|null = null 
 
  rows=1

  submitting = false
  FG = this.fb.group({
    txt:[''],
  })

  constructor(
    public firebaseService:FirebaseService,
    private fb:FormBuilder,
    private urlService:UrlService
  ) {

  }
  ngAfterViewInit(): void {
    console.log( this.parentCollection )
    console.log( this.collection )
    console.log( this.id )
    this.update()
  }  
  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
  }    
  update(){
    if( this.unsubscribe ){
      this.unsubscribe()
    }
    this.unsubscribe = this.firebaseService.onsnapShot( this.parentCollection + "/" + this.collection , this.id, 
    {
      "next":( (doc) =>{
        this.textJupiter = doc.data() as TextJupiter
        this.rows = this.textJupiter.txt.split('\n').length
        this.FG = this.fb.group({
          txt:[this.textJupiter.txt]
        })
      }),
      "error":( (reason)=>{
        alert("Error:" + reason)
      })
    })
  }
  public onBlur(propertyName:string, event:any): void {
    var values = {}
    var txt:string|null = this.FG.controls.txt.value
    if( this.textJupiter && txt){
      let obj = {
        txt:txt
      }
      this.firebaseService.updateDoc( this.parentCollection + "/" + this.collection , this.id, obj).then( ()=>{
        console.log("save txt")
      },
      reason =>{
        alert("ERROR saving txt:" + reason)
      })

    }        
  }  
}
