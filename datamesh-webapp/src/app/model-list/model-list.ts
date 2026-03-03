import { Component,  OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { Model, ModelFolder, ModelFolderCollection, ModelObj, getCurrentTimeStamp } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';
import * as uuid from 'uuid';

@Component({
  selector: 'app-model-list',
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    RouterModule],
  templateUrl: './model-list.html',
  styleUrl: './model-list.css'
})
export class ModelList  implements OnInit, OnDestroy{
  collection = ModelObj.collectionName
  folderCollection = ModelFolderCollection.collectionName
  models = signal<Array<Model>|null>(null)
  folders = signal<Array<ModelFolder>|null>(null)
  unsubscribe:any
  folderUnsubscribe:any

  constructor(private firestore:FirebaseService,
    private authService: AuthService ){
  }

  ngOnInit(): void {
    const userid = this.authService.getUserUid()!;

    this.unsubscribe = this.firestore.onsnapShotQuery( this.collection, [{fieldPath:"owner",opStr:"==",value:userid}],{
      next: (snapshot) =>{
        const models:Array<Model> = []
        snapshot.docs.forEach( doc =>{
          const m = doc.data() as Model
          m.id = doc.id
          models.push( m )
        })
        this.models.set(models)
      },
      error: (reason) =>{ alert("Error retrieving models:" + reason) },
      complete: () =>{}
    })

    this.folderUnsubscribe = this.firestore.onsnapShotQuery( this.folderCollection, [{fieldPath:"owner",opStr:"==",value:userid}],{
      next: (snapshot) =>{
        const folders:Array<ModelFolder> = []
        snapshot.docs.forEach( doc =>{
          const f = doc.data() as ModelFolder
          f.id = doc.id
          folders.push( f )
        })
        this.folders.set(folders)
      },
      error: (reason) =>{ alert("Error retrieving folders:" + reason) },
      complete: () =>{}
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe?.()
    this.folderUnsubscribe?.()
  }

  defaultModels(): Model[] {
    return (this.models() ?? []).filter(m => !m.folderId)
  }

  modelsInFolder(folderId:string): Model[] {
    return (this.models() ?? []).filter(m => m.folderId === folderId)
  }

  addFolder() {
    const label = prompt('Folder name:')
    if (!label?.trim()) return
    const folder:ModelFolder = {
      id: uuid.v4(),
      label: label.trim(),
      owner: this.authService.getUserUid()!,
      deleted: false,
      createon: getCurrentTimeStamp(),
      updateon: getCurrentTimeStamp()
    }
    this.firestore.setDoc(this.folderCollection, folder.id!, folder)
  }

  deleteFolder(folder:ModelFolder) {
    if (confirm(`Delete folder "${folder.label}"?`)) {
      this.firestore.deleteDoc(this.folderCollection, folder.id!)
    }
  }
}
