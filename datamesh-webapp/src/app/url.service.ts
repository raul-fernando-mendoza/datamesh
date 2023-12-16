import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { baseUrl } from '../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class UrlService {

  constructor(private http: HttpClient) { }

  public post(url:string, data:Object): Observable<Object> {
    console.log( JSON.stringify(data, null, 2))
    var myheaders = new HttpHeaders({'Content-Type': 'application/json'});
    return this.http.post(baseUrl + url, data, {headers: myheaders})
  }  
}
