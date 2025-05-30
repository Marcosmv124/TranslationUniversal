import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private translateUrl = 'http://localhost:5181/api/translate/translate'; // Endpoint de traducción
  private suggestionsUrl = 'http://localhost:5181/api/translate/suggestions'; // Endpoint de sugerencias

  constructor(private http: HttpClient) {}

  // Método para traducir texto
  translate(text: string, sourceLang: string, targetLang: string): Observable<any> {
    return this.http.post(this.translateUrl, {
      text,
      sourceLang,
      targetLang
    });
  }

  // Método para obtener sugerencias de frases alternativas
  getSuggestions(text: string): Observable<any> {
    return this.http.post(this.suggestionsUrl, {
      text
    });
  }
}
