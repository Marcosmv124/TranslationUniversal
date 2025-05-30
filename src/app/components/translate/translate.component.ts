import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '../../services/translate.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Language {
  code: string;
  name: string;
}

@Component({
  selector: 'app-translator',
  template: `
  <div class="translator-container" role="main" aria-label="Traductor universal accesible" 
       [class.high-contrast]="isHighContrast" 
       [class.keyboard-nav]="keyboardNavigation" 
       [class.dyslexia-friendly]="isDyslexiaFriendly"
       [class.grayscale]="isGrayscale">
    <!-- Título del proyecto -->
    <h1 class="project-title" tabindex="0">Traductor Universal Accesible</h1>
    
    <!-- Controles de accesibilidad -->
    <div class="accessibility-tools">
      <button (click)="toggleContrast()" aria-label="Alternar modo de alto contraste">
        {{ isHighContrast ? '☀️' : '🌙' }}
      </button>
      <button (click)="decreaseFontSize()" aria-label="Disminuir tamaño de fuente">A-</button>
      <button (click)="increaseFontSize()" aria-label="Aumentar tamaño de fuente">A+</button>
      <button (click)="toggleDyslexiaFriendly()" aria-label="Alternar modo amigable para dislexia">
        {{ isDyslexiaFriendly ? '🔤 Normal' : '🧠 Dislexia' }}
      </button>
      <button (click)="toggleGrayscale()" aria-label="Alternar modo escala de grises">
        {{ isGrayscale ? '🌈 Color' : '⚫ Escala de grises' }}
      </button>
    </div>

    <!-- Contenedor de las cajas de traducción -->
    <div class="translation-boxes">
      <!-- Caja origen -->
      <div class="box source-box" aria-label="Texto de origen">
        <label for="sourceLang">Idioma origen</label>
        <select id="sourceLang" [(ngModel)]="sourceLang" aria-live="polite" (change)="updateVoiceLanguage()">
          <option *ngFor="let lang of languages" [value]="lang.code">{{lang.name}}</option>
        </select>

        <textarea
          [(ngModel)]="inputText"
          (ngModelChange)="onInputChange($event)"
          placeholder="Escribe o habla"
          aria-label="Texto para traducir"
          [attr.aria-describedby]="'sourceHelp' + sourceLang"
        ></textarea>
        <span [id]="'sourceHelp' + sourceLang" class="sr-only">Texto en {{ getLanguageName(sourceLang) }}</span>

        <div class="button-group">
          <button class="clear-btn" (click)="clearInput()" aria-label="Limpiar texto de origen">✕</button>
          <button class="voice-btn" (click)="toggleVoiceRecognition()" [class.active]="isListening">
            🎤 {{ isListening ? 'Detener' : 'Hablar' }}
          </button>
        </div>

        <!-- Área para mostrar sugerencias -->
        <div
          class="suggestions-text"
          *ngIf="suggestionsText"
          aria-live="polite"
          tabindex="0"
        >
          <strong>Sugerencias:</strong><br />
          {{ suggestionsText }}
        </div>
      </div>

      <!-- Botón intercambio -->
      <button
        class="swap-button"
        aria-label="Intercambiar idiomas"
        title="Intercambiar idiomas"
        (click)="swapLanguages()"
      >
        ↔
      </button>

      <!-- Caja destino -->
      <div class="box target-box" aria-label="Texto traducido">
        <label for="targetLang">Idioma destino</label>
        <select id="targetLang" [(ngModel)]="targetLang" aria-live="polite">
          <option *ngFor="let lang of languages" [value]="lang.code">{{lang.name}}</option>
        </select>

        <div class="translated-text" tabindex="0" aria-live="polite" [attr.aria-describedby]="'targetHelp' + targetLang">
          {{ translatedText || 'Traducción aparecerá aquí' }}
        </div>
        <span [id]="'targetHelp' + targetLang" class="sr-only">Texto traducido a {{ getLanguageName(targetLang) }}</span>

        <div class="button-group">
          <button class="translate-btn" (click)="translate()">
            Traducir
          </button>
          <button class="speech-btn" (click)="speakText()" [disabled]="!translatedText">
            🔊
          </button>
          <button class="copy-btn" (click)="copyTranslation()" [disabled]="!translatedText" aria-label="Copiar traducción">
            ⎘
          </button>
        </div>
      </div>
    </div>

    <!-- Mensaje para screen readers -->
    <div aria-live="polite" class="sr-only">
      {{ liveMessage }}
    </div>

    <!-- Información de accesibilidad -->
    <div class="accessibility-info" tabindex="0" aria-label="Información de accesibilidad">
      <button (click)="showAccessibilityInfo = !showAccessibilityInfo" class="info-btn">
        ℹ️
      </button>
      <div *ngIf="showAccessibilityInfo" class="info-content">
        <h2>Accesibilidad WCAG 2.1 AA</h2>
        <p>Este traductor cumple con los estándares de accesibilidad WCAG 2.1 nivel AA:</p>
        <ul>
          <li>✅ Perceptible: Contenido presentable de múltiples formas</li>
          <li>✅ Operable: Navegación completa por teclado</li>
          <li>✅ Comprensible: Texto legible y predecible</li>
          <li>✅ Robusto: Compatible con tecnologías asistivas</li>
          <li>🎨 Contraste ajustable (4.5:1 mínimo)</li>
          <li>🔠 Tamaño de texto modificable</li>
          <li>🧠 Fuente compatible con dislexia</li>
          <li>⚫ Modo escala de grises</li>
          <li>🔍 Enfoque visible para navegación por teclado</li>
          <li>🗣 Soporte para lectores de pantalla</li>
        </ul>
        <button class="close-info" (click)="showAccessibilityInfo = false">Cerrar</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .translator-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      max-width: 1200px;
      margin: 40px auto;
      padding: 20px;
      font-family: Arial, sans-serif;
      position: relative;
      transition: all 0.3s ease;
    }

    .project-title {
      text-align: center;
      width: 100%;
      margin-bottom: 20px;
      color: #0056b3;
    }

    /* Contenedor de las cajas de traducción */
    .translation-boxes {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      gap: 20px;
      width: 100%;
    }

    /* Estilos base para las cajas */
    .box {
      flex: 1;
      min-width: 300px;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    /* Estilos de accesibilidad */
    .accessibility-tools {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .accessibility-tools button {
      padding: 6px 10px;
      background: #333;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .high-contrast .translator-container {
      background-color: black;
      color: white;
    }

    .high-contrast .box {
      background-color: black;
      color: yellow;
      border: 2px solid yellow;
    }

    .high-contrast textarea,
    .high-contrast .translated-text,
    .high-contrast select {
      background-color: black;
      color: white;
      border: 2px solid white;
    }

    .high-contrast .accessibility-tools button {
      background: yellow;
      color: black;
    }

    /* Modo dislexia */
    .dyslexia-friendly {
      font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif;
      letter-spacing: 0.05em;
      line-height: 1.6;
    }

    .dyslexia-friendly textarea,
    .dyslexia-friendly .translated-text {
      font-family: inherit;
    }

    /* Modo escala de grises */
    .grayscale {
      filter: grayscale(100%);
    }

    /* Indicador de navegación por teclado */
    .keyboard-nav button:focus,
    .keyboard-nav select:focus,
    .keyboard-nav textarea:focus {
      outline: 3px solid #0056b3;
      outline-offset: 2px;
    }

    .keyboard-nav .translated-text:focus {
      outline: 3px solid #28a745;
    }

    .keyboard-nav .box {
      box-shadow: 0 0 0 3px #0056b3;
    }

    label {
      font-weight: 600;
      margin-bottom: 8px;
    }

    select {
      padding: 8px 12px;
      font-size: 1rem;
      margin-bottom: 12px;
      border-radius: 4px;
      border: 1px solid #ccc;
      width: 100%;
    }

    textarea {
      flex-grow: 1;
      resize: vertical;
      padding: 12px;
      font-size: 1rem;
      border-radius: 4px;
      border: 1px solid #ccc;
      margin-bottom: 12px;
      font-family: inherit;
      min-height: 150px;
      width: 100%;
      box-sizing: border-box;
    }

    .button-group {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .clear-btn {
      padding: 4px 10px;
      background: #e0e0e0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      font-size: 1.2rem;
      line-height: 1;
    }

    .clear-btn:hover {
      background: #cfcfcf;
    }

    .voice-btn {
      padding: 8px 16px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      flex-grow: 1;
    }

    .voice-btn:hover, .voice-btn.active {
      background-color: #0056b3;
    }

    .swap-button {
      align-self: center;
      padding: 12px 18px;
      font-size: 1.6rem;
      cursor: pointer;
      border-radius: 50%;
      border: none;
      background-color: #007bff;
      color: white;
      box-shadow: 0 2px 6px rgba(0, 123, 255, 0.5);
      transition: background-color 0.3s;
      margin-top: 40px;
    }

    .swap-button:hover {
      background-color: #0056b3;
    }

    .translated-text {
      flex-grow: 1;
      background: #fff;
      border-radius: 4px;
      padding: 12px;
      font-size: 1rem;
      border: 1px solid #ccc;
      margin-bottom: 12px;
      white-space: pre-wrap;
      min-height: 150px;
      width: 100%;
      box-sizing: border-box;
    }

    .translate-btn {
      padding: 10px 16px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      flex-grow: 1;
    }

    .translate-btn:hover {
      background-color: #218838;
    }

    .speech-btn, .copy-btn {
      padding: 8px 16px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
    }

    .speech-btn:hover, .copy-btn:hover {
      background-color: #218838;
    }

    .speech-btn:disabled, .copy-btn:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    .suggestions-text {
      margin-top: 10px;
      white-space: pre-wrap;
      background: #fff;
      border: 1px solid #ccc;
      padding: 10px;
      border-radius: 4px;
    }

    /* Información de accesibilidad */
    .accessibility-info {
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 1000;
    }

    .info-btn {
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      font-size: 1.2rem;
    }

    .info-content {
      position: fixed;
      bottom: 70px;
      left: 20px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      width: calc(100% - 40px);
      max-width: 500px;
      max-height: 70vh;
      overflow-y: auto;
      z-index: 1001;
    }

    .info-content h2 {
      margin-top: 0;
      font-size: 1.3rem;
      color: #0056b3;
    }

    .info-content p {
      margin-bottom: 15px;
    }

    .info-content ul {
      padding-left: 20px;
      margin-bottom: 20px;
    }

    .info-content li {
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .close-info {
      display: block;
      margin-top: 15px;
      padding: 8px 16px;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .close-info:hover {
      background-color: #5a6268;
    }

    /* Estilo para screen readers */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .translator-container {
        margin: 20px auto;
        padding: 10px;
      }

      .translation-boxes {
        flex-direction: column;
        gap: 15px;
      }

      .box {
        min-width: 100%;
        max-width: 100%;
      }

      .swap-button {
        margin: 10px 0;
        transform: rotate(90deg);
      }

      .info-content {
        width: calc(100% - 60px);
        left: 10px;
        bottom: 60px;
      }
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TranslatorComponent implements OnDestroy, OnInit {
  languages: Language[] = [
    { code: 'en', name: 'Inglés' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Francés' },
    { code: 'de', name: 'Alemán' },
    { code: 'zh', name: 'Chino' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Portugués' },
    { code: 'ru', name: 'Ruso' },
    { code: 'ja', name: 'Japonés' },
    { code: 'ar', name: 'Árabe' }
  ];

  sourceLang = 'en';
  targetLang = 'es';
  inputText = '';
  translatedText = '';
  suggestionsText = '';
  isListening = false;
  isHighContrast = false;
  isDyslexiaFriendly = false;
  isGrayscale = false;
  fontSize = 1;
  liveMessage = '';
  keyboardNavigation = false;
  showAccessibilityInfo = false;

  private inputSubject = new Subject<string>();
  private subscription: Subscription;
  private recognition: any;
  private synth: any = window.speechSynthesis;

  constructor(private translateService: TranslateService) {
    this.subscription = this.inputSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(text => {
      this.fetchSuggestions(text);
    });

    // Inicializar reconocimiento de voz
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      this.recognition = new (window.SpeechRecognition || (window as any).webkitSpeechRecognition)();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.sourceLang;
    }
  }

  ngOnInit() {
    // Asegurar que las voces estén cargadas
    setTimeout(() => {
      this.synth.getVoices();
    }, 100);

    // Detectar navegación por teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.keyboardNavigation = true;
      }
    });

    document.addEventListener('mousedown', () => {
      this.keyboardNavigation = false;
    });

    // Cargar fuente para dislexia si está disponible
    this.loadDyslexiaFont();
  }

  private loadDyslexiaFont() {
    const link = document.createElement('link');
    link.href = 'https://fonts.cdnfonts.com/css/open-dyslexic';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  toggleContrast() {
    this.isHighContrast = !this.isHighContrast;
    document.body.classList.toggle('high-contrast', this.isHighContrast);
    this.setLiveMessage(this.isHighContrast ? 'Modo alto contraste activado' : 'Modo alto contraste desactivado');
  }

  toggleDyslexiaFriendly() {
    this.isDyslexiaFriendly = !this.isDyslexiaFriendly;
    document.body.classList.toggle('dyslexia-friendly', this.isDyslexiaFriendly);
    this.setLiveMessage(this.isDyslexiaFriendly ? 'Modo amigable para dislexia activado' : 'Modo amigable para dislexia desactivado');
  }

  toggleGrayscale() {
    this.isGrayscale = !this.isGrayscale;
    document.body.classList.toggle('grayscale', this.isGrayscale);
    this.setLiveMessage(this.isGrayscale ? 'Modo escala de grises activado' : 'Modo escala de grises desactivado');
  }

  increaseFontSize() {
    this.fontSize = Math.min(this.fontSize + 0.1, 1.5);
    document.documentElement.style.fontSize = `${this.fontSize}rem`;
    this.setLiveMessage(`Tamaño de fuente aumentado a ${Math.round(this.fontSize * 100)}%`);
  }

  decreaseFontSize() {
    this.fontSize = Math.max(this.fontSize - 0.1, 0.8);
    document.documentElement.style.fontSize = `${this.fontSize}rem`;
    this.setLiveMessage(`Tamaño de fuente disminuido a ${Math.round(this.fontSize * 100)}%`);
  }

  setLiveMessage(message: string) {
    this.liveMessage = message;
    setTimeout(() => this.liveMessage = '', 3000);
  }

  onInputChange(text: string) {
    this.inputSubject.next(text);
  }

  fetchSuggestions(text: string) {
    if (!text.trim()) {
      this.suggestionsText = '';
      return;
    }

    this.translateService.getSuggestions(text)
      .subscribe({
        next: response => {
          this.suggestionsText = response.suggestions || 'No se recibieron sugerencias';
        },
        error: err => {
          console.error('Error al obtener sugerencias:', err);
          this.suggestionsText = 'Error al obtener sugerencias.';
        }
      });
  }

  getLanguageName(code: string): string {
    const lang = this.languages.find(l => l.code === code);
    return lang ? lang.name : 'desconocido';
  }

  swapLanguages() {
    const temp = this.sourceLang;
    this.sourceLang = this.targetLang;
    this.targetLang = temp;
    this.inputText = '';
    this.translatedText = '';
    this.suggestionsText = '';
    this.updateVoiceLanguage();
    this.setLiveMessage('Idiomas intercambiados');
  }

  translate() {
    if (!this.inputText.trim()) {
      this.translatedText = '';
      this.setLiveMessage('No hay texto para traducir');
      return;
    }

    this.setLiveMessage('Traduciendo...');

    this.translateService.translate(this.inputText, this.sourceLang, this.targetLang)
      .subscribe({
        next: response => {
          this.translatedText = response.translated || 'No se recibió traducción';
          this.setLiveMessage('Traducción completada');
        },
        error: err => {
          console.error('Error en la traducción:', err);
          this.translatedText = 'Error al traducir, inténtalo más tarde.';
          this.setLiveMessage('Error en la traducción');
        }
      });
  }

  clearInput() {
    this.inputText = '';
    this.translatedText = '';
    this.suggestionsText = '';
    this.setLiveMessage('Texto limpiado');
  }

  copyTranslation() {
    if (!this.translatedText) return;
    
    navigator.clipboard.writeText(this.translatedText)
      .then(() => {
        this.setLiveMessage('Traducción copiada al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar:', err);
        this.setLiveMessage('Error al copiar la traducción');
      });
  }

  updateVoiceLanguage() {
    if (this.recognition) {
      this.recognition.lang = this.sourceLang;
    }
  }

  toggleVoiceRecognition() {
    this.isListening = !this.isListening;

    if (this.isListening) {
      this.setLiveMessage('Escuchando...');
      this.recognition.start();
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[event.resultIndex][0].transcript;
        this.inputText = transcript;
      };
      this.recognition.onerror = (event: any) => {
        this.setLiveMessage('Error en el reconocimiento de voz');
        console.error('Error en reconocimiento de voz:', event.error);
      };
    } else {
      this.recognition.stop();
      this.setLiveMessage('Reconocimiento de voz detenido');
    }
  }

  speakText() {
    if (!this.translatedText) {
      this.setLiveMessage('No hay texto para leer');
      return;
    }

    if (!this.synth || this.synth.getVoices().length === 0) {
      this.setLiveMessage('La síntesis de voz no está disponible en este idioma o navegador');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(this.translatedText);
    utterance.lang = this.targetLang;

    try {
      this.synth.speak(utterance);
      this.setLiveMessage('Reproduciendo traducción');
    } catch (error) {
      console.error('Error al reproducir voz:', error);
      this.setLiveMessage('No se pudo reproducir la voz para este idioma');
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    document.removeEventListener('keydown', () => { });
    document.removeEventListener('mousedown', () => { });
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }
}