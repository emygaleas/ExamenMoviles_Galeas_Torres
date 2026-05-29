import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path:'',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('../home/home.page')
          .then(m => m.HomePage)
      },
      {
        path: 'tablero',
        loadComponent: () => import('../tablero/tablero.page').then(m => m.TableroPage)
      },
      {
        path: 'perfil',
        loadComponent: () => import('../perfil/perfil.page').then( m => m.PerfilPage)
      },
    ],
  }
];