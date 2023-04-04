import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UrlService {

  constructor(private http: HttpClient) { }

  public post(url:string, data:Object): Observable<Object> {

    var baseUrl = "http://localhost:5000/"


    console.log( JSON.stringify(data, null, 2))
    var myheaders = new HttpHeaders({'Content-Type': 'application/json'});


    return this.http.post(baseUrl + url, data, {headers: myheaders})
  }  
}
