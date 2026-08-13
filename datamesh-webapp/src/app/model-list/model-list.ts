import { Component,  OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { model, modelFolder, modelFolderCollection, modelObject, getCurrentTimeStamp } from 'app/datatypes/datatypes.module';
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
export class modelList  implements OnInit, OnDestroy{
  collection = modelObject.collectionName
  folderCollection = modelFolderCollection.collectionName
  model = signal<Array<model>|null>(null)
  folders = signal<Array<modelFolder>|null>(null)
  unsubscribe:any
  folderUnsubscribe:any

  constructor(private firestore:FirebaseService,
    private authService: AuthService ){
  }

  ngOnInit(): void {
    const userid = this.authService.getUserUid()!;

    this.unsubscribe = this.firestore.onsnapShotQuery( this.collection, [{fieldPath:"owner",opStr:"==",value:userid}],{
      next: (snapshot) =>{
        const model:Array<model> = []
        snapshot.docs.forEach( doc =>{
          const m = doc.data() as model
          m.id = doc.id
          model.push( m )
        })
        this.model.set(model)
      },
      error: (reason) =>{ alert("Error retrieving model:" + reason) },
      complete: () =>{}
    })

    this.folderUnsubscribe = this.firestore.onsnapShotQuery( this.folderCollection, [{fieldPath:"owner",opStr:"==",value:userid}],{
      next: (snapshot) =>{
        const folders:Array<modelFolder> = []
        snapshot.docs.forEach( doc =>{
          const f = doc.data() as modelFolder
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

  modelInFolder(folderId:string): model[] {
    return (this.model() ?? []).filter(m => m.folderId === folderId)
  }

  addFolder() {
    const label = prompt('Folder name:')
    if (!label?.trim()) return
    const folder:modelFolder = {
      id: uuid.v4(),
      label: label.trim(),
      owner: this.authService.getUserUid()!,
      deleted: false,
      createon: getCurrentTimeStamp(),
      updateon: getCurrentTimeStamp()
    }
    this.firestore.setDoc(this.folderCollection, folder.id!, folder)
  }

  renameFolder(folder:modelFolder) {
    const label = prompt('Rename folder:', folder.label)
    if (!label?.trim() || label.trim() === folder.label) return
    this.firestore.updateDoc(this.folderCollection, folder.id!, { label: label.trim() })
  }

  deleteFolder(folder:modelFolder) {
    if (confirm(`Delete folder "${folder.label}"?`)) {
      this.firestore.deleteDoc(this.folderCollection, folder.id!)
    }
  }
}
