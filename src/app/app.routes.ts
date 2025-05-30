import { Routes } from '@angular/router';
import { TranslatorComponent } from './components/translate/translate.component';

export const routes: Routes = [
  {
    path: '',
    component: TranslatorComponent
  },
  {
    path: '**',  // Ruta comodín para manejar cualquier ruta no definida
    redirectTo: ''
  }
];
