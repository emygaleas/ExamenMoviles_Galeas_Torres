import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  IonHeader, IonToolbar, IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonIcon, IonLabel, IonSpinner, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  statsChartOutline,
  gameControllerOutline,
  locationOutline,
  peopleOutline,
  hardwareChipOutline,
  albumsOutline,
  sparklesOutline,
  trendingUpOutline
} from 'ionicons/icons';

import { GadgetService, Videojuego } from '../services/gadget.service';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.page.html',
  styleUrls: ['./tablero.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonContent, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonIcon, IonLabel, IonSpinner, IonButton
  ]
})
export class TableroPage implements OnInit, OnDestroy {
  private subscription!: Subscription;
  isLoading = true;

  // Métricas generales
  totalEncuestas = 0;
  juegosDistintosCount = 0;
  ubicacionesCount = 0;

  // Colecciones de métricas estructuradas
  rolesData: { name: string; count: number; percentage: number }[] = [];
  plataformasData: { name: string; count: number; percentage: number }[] = [];
  generosData: { name: string; count: number; percentage: number }[] = [];

  constructor(private gadgetService: GadgetService) {
    addIcons({
      'stats-chart-outline': statsChartOutline,
      'game-controller-outline': gameControllerOutline,
      'location-outline': locationOutline,
      'people-outline': peopleOutline,
      'hardware-chip-outline': hardwareChipOutline,
      'albums-outline': albumsOutline,
      'sparkles-outline': sparklesOutline,
      'trending-up-outline': trendingUpOutline
    });
  }

  ngOnInit() {
    this.isLoading = true;
    
    // Suscribirse de forma reactiva al observable de la Base de Datos
    this.subscription = this.gadgetService.gadgets$.subscribe({
      next: (gadgets: Videojuego[]) => {
        this.calcularEstadisticas(gadgets);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al suscribir datos del tablero:', err);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Procesa la lista de encuestas registradas de Firestore para calcular los agregados en tiempo real.
   */
  private calcularEstadisticas(gadgets: Videojuego[]) {
    this.totalEncuestas = gadgets.length;

    // 1. Juegos únicos
    const juegosUnicos = new Set(
      gadgets.map(g => g.videojuegoFavorito?.trim()).filter(Boolean)
    );
    this.juegosDistintosCount = juegosUnicos.size;

    // 2. Ubicaciones únicas
    const ubicacionesUnicas = new Set(
      gadgets.map(g => g.ubicacion?.trim()).filter(Boolean)
    );
    this.ubicacionesCount = ubicacionesUnicas.size;

    // 3. Distribución por Rol Institucional (Requerimiento especial de usuario)
    const rolesMap: { [key: string]: number } = {
      'Estudiante': 0,
      'Docente': 0,
      'Administrativo': 0,
      'Visitante': 0
    };

    // 4. Distribución por Plataforma
    const plataformasMap: { [key: string]: number } = {
      'PC': 0,
      'Consola': 0,
      'Móvil': 0,
      'Navegador': 0
    };

    // 5. Distribución por Géneros
    const generosMap: { [key: string]: number } = {
      'Acción': 0,
      'Estrategia': 0,
      'Deportes': 0,
      'RPG': 0,
      'Terror': 0,
      'Simulación': 0,
      'Aventura': 0,
      'Otro': 0
    };

    // Recorrer y mapear datos
    gadgets.forEach(g => {
      // Roles
      if (g.rol) {
        const rNorm = g.rol.trim();
        const rNormCapitalized = rNorm.charAt(0).toUpperCase() + rNorm.slice(1).toLowerCase();
        if (rolesMap[rNormCapitalized] !== undefined) {
          rolesMap[rNormCapitalized]++;
        } else {
          rolesMap['Visitante']++;
        }
      }

      // Plataformas
      if (g.plataforma) {
        const pNorm = g.plataforma.trim().toLowerCase();
        if (pNorm.includes('pc') || pNorm.includes('windows')) {
          plataformasMap['PC']++;
        } else if (pNorm.includes('móvil') || pNorm.includes('movil') || pNorm.includes('phone') || pNorm.includes('celular')) {
          plataformasMap['Móvil']++;
        } else if (pNorm.includes('navegador') || pNorm.includes('browser') || pNorm.includes('web')) {
          plataformasMap['Navegador']++;
        } else {
          plataformasMap['Consola']++;
        }
      }

      // Géneros
      if (g.generoFavorito) {
        const genNorm = g.generoFavorito.trim();
        if (generosMap[genNorm] !== undefined) {
          generosMap[genNorm]++;
        } else {
          generosMap['Otro']++;
        }
      }
    });

    // Mapear arrays para bindeo e inyección directa en el HTML
    this.rolesData = Object.keys(rolesMap).map(key => ({
      name: key,
      count: rolesMap[key],
      percentage: this.totalEncuestas > 0 ? Math.round((rolesMap[key] / this.totalEncuestas) * 100) : 0
    }));

    this.plataformasData = Object.keys(plataformasMap).map(key => ({
      name: key,
      count: plataformasMap[key],
      percentage: this.totalEncuestas > 0 ? Math.round((plataformasMap[key] / this.totalEncuestas) * 100) : 0
    }));

    this.generosData = Object.keys(generosMap)
      .map(key => ({
        name: key,
        count: generosMap[key],
        percentage: this.totalEncuestas > 0 ? Math.round((generosMap[key] / this.totalEncuestas) * 100) : 0
      }))
      .filter(x => x.count > 0) // Mostrar solo géneros con al menos 1 encuesta
      .sort((a, b) => b.count - a.count); // Ordenar de más popular a menos
  }

  /**
   * Refresca manualmente la información solicitando a GadgetService volver a cargar Firestore
   */
  async refrescarDatos() {
    this.isLoading = true;
    await this.gadgetService.loadGadgets();
    this.isLoading = false;
  }
}
