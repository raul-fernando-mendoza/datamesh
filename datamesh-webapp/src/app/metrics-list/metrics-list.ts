import { Component,  OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { Metric, MetricFolder, MetricFolderCollection, MetricObject, getCurrentTimeStamp } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';
import * as uuid from 'uuid';

@Component({
  selector: 'app-metrics-list',
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    RouterModule],
  templateUrl: './metrics-list.html',
  styleUrl: './metrics-list.css'
})
export class MetricsList  implements OnInit, OnDestroy{
  collection = MetricObject.collectionName
  folderCollection = MetricFolderCollection.collectionName
  models = signal<Array<Metric>|null>(null)
  folders = signal<Array<MetricFolder>|null>(null)
  unsubscribe:any
  folderUnsubscribe:any

  constructor(private firestore:FirebaseService,
    private authService: AuthService ){
  }

  ngOnInit(): void {
    const userid = this.authService.getUserUid()!;

    this.unsubscribe = this.firestore.onsnapShotQuery( this.collection, [{fieldPath:"owner",opStr:"==",value:userid}],{
      next: (snapshot) =>{
        const models:Array<Metric> = []
        snapshot.docs.forEach( doc =>{
          const m = doc.data() as Metric
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
        const folders:Array<MetricFolder> = []
        snapshot.docs.forEach( doc =>{
          const f = doc.data() as MetricFolder
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

  modelsInFolder(folderId:string): Metric[] {
    return (this.models() ?? []).filter(m => m.folderId === folderId)
  }

  addFolder() {
    const label = prompt('Folder name:')
    if (!label?.trim()) return
    const folder:MetricFolder = {
      id: uuid.v4(),
      label: label.trim(),
      owner: this.authService.getUserUid()!,
      deleted: false,
      createon: getCurrentTimeStamp(),
      updateon: getCurrentTimeStamp()
    }
    this.firestore.setDoc(this.folderCollection, folder.id!, folder)
  }

  renameFolder(folder:MetricFolder) {
    const label = prompt('Rename folder:', folder.label)
    if (!label?.trim() || label.trim() === folder.label) return
    this.firestore.updateDoc(this.folderCollection, folder.id!, { label: label.trim() })
  }

  deleteFolder(folder:MetricFolder) {
    if (confirm(`Delete folder "${folder.label}"?`)) {
      this.firestore.deleteDoc(this.folderCollection, folder.id!)
    }
  }
}
