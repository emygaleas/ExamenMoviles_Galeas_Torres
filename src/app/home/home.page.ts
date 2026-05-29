import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import {
  IonHeader, IonToolbar, IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonIcon, IonInput, IonTextarea,
  IonModal, IonLabel, IonList, IonSpinner, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add, close, trash, sparkles, pencil, person, gameController,
  hardwareChip, albums, chatbubbleEllipses, calendar, search, location, checkmarkCircle
} from 'ionicons/icons';

import { GadgetService, Videojuego } from '../services/gadget.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonContent, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonButton, IonIcon, IonInput, IonTextarea,
    IonModal, IonLabel, IonList, IonSpinner, IonSelect, IonSelectOption
  ]
})
export class HomePage implements OnInit {
  // Listado de videojuegos registrados en la Base de Datos
  filteredGadgets$!: Observable<Videojuego[]>;
  private searchSubject = new BehaviorSubject<string>('');

  // Modales
  isAddModalOpen = false;
  editingGadget: Videojuego | null = null;
  isEditMode = false;

  // Formulario para registrar encuesta de videojuego
  personaNombre = '';
  personaEdad = '';
  personaRol = '';
  personaUbicacion = '';
  videojuegoFavorito = '';
  plataforma = '';
  generoFavorito = '';
  comentario = '';
  imageUrl = ''; // Se obtiene automáticamente de la API

  // Búsqueda GLOBAL en la API de FreeToGame (desde el buscador del Header)
  apiSearchQueryGlobal = '';
  apiSearchResultsGlobal: any[] = [];
  isSearchingAPIGlobal = false;

  // Búsqueda LOCAL dentro del modal de registro
  apiSearchQuery = '';
  apiSearchResults: any[] = [];
  selectedGameDetails: any = null; // Ficha técnica completa del juego seleccionado
  isSearchingAPI = false;

  // Carga
  isUploading = false;
  uploadStatusMessage = '';

  // Recurso por defecto por seguridad
  defaultImage = 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80';

  constructor(
    public gadgetService: GadgetService,
    private sanitizer: DomSanitizer
  ) {
    // Registrar iconos standalone necesarios
    addIcons({
      add, close, trash, sparkles, pencil, person, gameController,
      hardwareChip, albums, chatbubbleEllipses, calendar, search, location, checkmarkCircle
    });
  }

  ngOnInit() {
    // La base de datos sólo lista y almacena los registros de forma directa
    this.filteredGadgets$ = this.gadgetService.gadgets$;
  }

  /**
   * Realiza la búsqueda de videojuegos directamente en la API de FreeToGame,
   * sin consultar la base de datos (donde solo se guardan los registros).
   */
  async onSearchChange(event: any) {
    const value = event?.target?.value || '';
    this.apiSearchQueryGlobal = value.trim();

    if (!this.apiSearchQueryGlobal) {
      this.apiSearchResultsGlobal = [];
      return;
    }

    try {
      this.isSearchingAPIGlobal = true;
      const term = this.apiSearchQueryGlobal.toLowerCase();

      // Consultar todos los juegos en la API a través de corsproxy
      const response = await fetch(`https://corsproxy.io/?https://www.freetogame.com/api/games`);
      if (response.ok) {
        const allGames: any[] = await response.json();
        // Filtrar coincidencias
        this.apiSearchResultsGlobal = allGames.filter(g =>
          g.title.toLowerCase().includes(term) ||
          g.genre.toLowerCase().includes(term) ||
          g.platform.toLowerCase().includes(term)
        ).slice(0, 9); // Mostrar hasta 9 resultados sugeridos en grilla
      }
    } catch (e) {
      console.error('Error al realizar búsqueda global en FreeToGame API:', e);
    } finally {
      this.isSearchingAPIGlobal = false;
    }
  }

  /**
   * Abre el modal y pre-carga la información técnica completa de un juego buscado en la API global.
   */
  async registerSurveyForGame(gameId: number) {
    this.resetForm();
    this.isEditMode = false;
    this.editingGadget = null;
    this.isAddModalOpen = true;

    // Obtener los detalles completos del juego
    await this.selectGameFromAPI(gameId);
  }

  /**
   * Elimina un registro de la encuesta de la Base de Datos.
   */
  async deleteGadget(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este registro de encuesta de videojuegos?')) {
      try {
        await this.gadgetService.deleteGadget(id);
        alert('¡Encuesta eliminada exitosamente!');
      } catch (err) {
        console.error('Error al eliminar encuesta:', err);
        alert('Hubo un error al eliminar el registro en Firestore.');
      }
    }
  }

  /**
   * Abre el modal para registrar una nueva encuesta manualmente.
   */
  openAddModal() {
    this.resetForm();
    this.isEditMode = false;
    this.editingGadget = null;
    this.isAddModalOpen = true;
  }

  /**
   * Abre el modal en modo edición de la encuesta.
   */
  openEditModal(videojuego: Videojuego, event: Event) {
    event.stopPropagation();
    this.resetForm();
    this.isEditMode = true;
    this.editingGadget = videojuego;

    // Precargar campos del formulario
    this.personaNombre = videojuego.nombre;
    this.personaEdad = videojuego.edad;
    this.personaRol = videojuego.rol;
    this.personaUbicacion = videojuego.ubicacion;
    this.videojuegoFavorito = videojuego.videojuegoFavorito;
    this.plataforma = videojuego.plataforma;
    this.generoFavorito = videojuego.generoFavorito;
    this.comentario = videojuego.comentario;
    this.imageUrl = videojuego.imageUrl;

    this.isAddModalOpen = true;
  }

  /**
   * Cierra el modal de registro.
   */
  closeAddModal() {
    this.isAddModalOpen = false;
  }

  /**
   * Busca videojuegos en la lista completa de la API de FreeToGame dentro del modal.
   */
  async searchGamesOnAPI() {
    if (!this.apiSearchQuery.trim()) {
      alert('Por favor, ingresa el nombre de un videojuego a buscar.');
      return;
    }

    try {
      this.isSearchingAPI = true;
      this.apiSearchResults = [];
      const queryStr = this.apiSearchQuery.trim().toLowerCase();

      const response = await fetch(`https://corsproxy.io/?https://www.freetogame.com/api/games`);
      if (!response.ok) {
        throw new Error('No se pudo conectar con la API de FreeToGame');
      }

      const allGames: any[] = await response.json();
      this.apiSearchResults = allGames.filter(g =>
        g.title.toLowerCase().includes(queryStr)
      ).slice(0, 5);

      if (this.apiSearchResults.length === 0) {
        alert('🔍 No se encontraron videojuegos con ese nombre en la API.');
      }
    } catch (error) {
      console.error('Error al buscar videojuegos en la API:', error);
      alert('⚠️ Hubo un error de conexión al consultar la base de datos de videojuegos.');
    } finally {
      this.isSearchingAPI = false;
    }
  }

  /**
   * Selecciona un videojuego y realiza una segunda consulta a la API para traer toda su información directa.
   * Endpoint usado: https://www.freetogame.com/api/game?id={id}
   */
  async selectGameFromAPI(gameId: number) {
    try {
      this.isSearchingAPI = true;
      this.uploadStatusMessage = 'Obteniendo ficha técnica completa del videojuego...';

      const response = await fetch(`https://corsproxy.io/?https://www.freetogame.com/api/game?id=${gameId}`);
      if (!response.ok) {
        throw new Error('No se pudo obtener el detalle del videojuego');
      }

      const gameData = await response.json();
      this.selectedGameDetails = gameData;

      // Rellenar automáticamente los campos de la encuesta
      this.videojuegoFavorito = gameData.title;
      this.imageUrl = gameData.thumbnail;
      this.comentario = gameData.short_description || '';

      // Mapear género
      const rawGenre = (gameData.genre || '').toLowerCase();
      if (rawGenre.includes('shooter') || rawGenre.includes('fight') || rawGenre.includes('action')) {
        this.generoFavorito = 'Acción';
      } else if (rawGenre.includes('strategy') || rawGenre.includes('moba') || rawGenre.includes('card')) {
        this.generoFavorito = 'Estrategia';
      } else if (rawGenre.includes('sport') || rawGenre.includes('race') || rawGenre.includes('racing')) {
        this.generoFavorito = 'Deportes';
      } else if (rawGenre.includes('rpg') || rawGenre.includes('mmorpg') || rawGenre.includes('role')) {
        this.generoFavorito = 'RPG';
      } else if (rawGenre.includes('horror') || rawGenre.includes('terror')) {
        this.generoFavorito = 'Terror';
      } else if (rawGenre.includes('sim')) {
        this.generoFavorito = 'Simulación';
      } else if (rawGenre.includes('adventure')) {
        this.generoFavorito = 'Aventura';
      } else {
        this.generoFavorito = 'Otro';
      }

      // Mapear plataforma
      const rawPlatform = (gameData.platform || '').toLowerCase();
      if (rawPlatform.includes('pc') || rawPlatform.includes('windows')) {
        this.plataforma = 'PC';
      } else if (rawPlatform.includes('browser') || rawPlatform.includes('web')) {
        this.plataforma = 'Navegador';
      } else {
        this.plataforma = 'Consola';
      }

      this.apiSearchResults = [];
      this.apiSearchQuery = '';
    } catch (error) {
      console.error('Error al obtener detalle del videojuego:', error);
      alert('⚠️ Hubo un error de conexión al cargar la información detallada del juego.');
    } finally {
      this.isSearchingAPI = false;
      this.uploadStatusMessage = '';
    }
  }

  /**
   * Guarda la encuesta en Firestore.
   */
  async saveGadget() {
    if (!this.personaNombre.trim()) {
      alert('Por favor, ingresa tu nombre o alias.');
      return;
    }
    if (!this.personaEdad) {
      alert('Por favor, selecciona tu rango de edad.');
      return;
    }
    if (!this.personaRol) {
      alert('Por favor, selecciona tu rol.');
      return;
    }
    if (!this.personaUbicacion.trim()) {
      alert('Por favor, selecciona o ingresa tu ubicación.');
      return;
    }
    if (!this.videojuegoFavorito.trim()) {
      alert('Por favor, busca y selecciona un videojuego.');
      return;
    }

    try {
      this.isUploading = true;
      this.uploadStatusMessage = 'Conectando con Firestore...';

      const finalImageUrl = this.imageUrl.trim() || this.defaultImage;

      if (this.isEditMode && this.editingGadget) {
        this.uploadStatusMessage = 'Actualizando encuesta en Firestore...';
        await this.gadgetService.updateGadget(this.editingGadget.id!, {
          nombre: this.personaNombre,
          edad: this.personaEdad,
          rol: this.personaRol,
          ubicacion: this.personaUbicacion,
          videojuegoFavorito: this.videojuegoFavorito,
          plataforma: this.plataforma,
          generoFavorito: this.generoFavorito,
          comentario: this.comentario,
          imageUrl: finalImageUrl
        });
        alert('¡Encuesta actualizada exitosamente!');
      } else {
        this.uploadStatusMessage = 'Guardando encuesta en Firestore...';
        await this.gadgetService.addGadget({
          nombre: this.personaNombre,
          edad: this.personaEdad,
          rol: this.personaRol,
          ubicacion: this.personaUbicacion,
          videojuegoFavorito: this.videojuegoFavorito,
          plataforma: this.plataforma,
          generoFavorito: this.generoFavorito,
          comentario: this.comentario,
          imageUrl: finalImageUrl,
          createdAt: Date.now()
        });
        alert('¡Encuesta registrada exitosamente en Firebase Firestore!');
      }

      this.isUploading = false;
      this.isAddModalOpen = false;
      this.resetForm();
    } catch (e: any) {
      this.isUploading = false;
      this.uploadStatusMessage = '';
      console.error('Error al guardar encuesta:', e);
      alert('Hubo un error al conectar con Firebase Firestore.');
    }
  }

  /**
   * Limpia los estados del formulario.
   */
  private resetForm() {
    this.personaNombre = '';
    this.personaEdad = '';
    this.personaRol = '';
    this.personaUbicacion = '';
    this.videojuegoFavorito = '';
    this.plataforma = '';
    this.generoFavorito = '';
    this.comentario = '';
    this.imageUrl = '';

    this.apiSearchQuery = '';
    this.apiSearchResults = [];
    this.selectedGameDetails = null;
    this.isUploading = false;
    this.isSearchingAPI = false;
    this.uploadStatusMessage = '';
    this.isEditMode = false;
    this.editingGadget = null;
  }
}
