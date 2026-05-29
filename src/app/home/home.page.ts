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
  hardwareChip, albums, chatbubbleEllipses, calendar, search, location, checkmarkCircle, camera
} from 'ionicons/icons';

import {
  Camera,
  CameraResultType,
  CameraSource
} from '@capacitor/camera';

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
  fotoActividad = ''; // Foto personalizada de la actividad

  // Ubicación Geográfica y Georreferenciación
  latitud = -0.2104; // Latitud por defecto EPN
  longitud = -78.4891; // Longitud por defecto EPN
  ubicacionTipo = 'Dentro del campus'; // 'Dentro del campus' o 'Fuera del campus'

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
      hardwareChip, albums, chatbubbleEllipses, calendar, search, location, checkmarkCircle, camera
    });
  }

  ngOnInit() {
    // Filtrar los videojuegos localmente basándose en el BehaviorSubject de búsqueda en tiempo real
    this.filteredGadgets$ = combineLatest([
      this.gadgetService.gadgets$,
      this.searchSubject
    ]).pipe(
      map(([gadgets, term]) => {
        const query = term.trim().toLowerCase();
        if (!query) {
          return gadgets;
        }
        return gadgets.filter(g =>
          (g.videojuegoFavorito && g.videojuegoFavorito.toLowerCase().includes(query)) ||
          (g.nombre && g.nombre.toLowerCase().includes(query)) ||
          (g.ubicacion && g.ubicacion.toLowerCase().includes(query)) ||
          (g.generoFavorito && g.generoFavorito.toLowerCase().includes(query)) ||
          (g.plataforma && g.plataforma.toLowerCase().includes(query)) ||
          (g.rol && g.rol.toLowerCase().includes(query))
        );
      })
    );
  }

  /**
   * Filtra las encuestas guardadas localmente en la base de datos según el término ingresado.
   */
  onSearchChange(event: any) {
    const value = event?.target?.value || '';
    this.searchSubject.next(value);
  }

  /**
   * Solicita coordenadas GPS reales al abrir el formulario usando HTML5 Geolocation API.
   */
  obtenerCoordenadas() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitud = position.coords.latitude;
          this.longitud = position.coords.longitude;
        },
        (error) => {
          console.warn('Geolocalización denegada o fallida, cargando EPN por defecto:', error);
          this.latitud = -0.2104;
          this.longitud = -78.4891;
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      this.latitud = -0.2104;
      this.longitud = -78.4891;
    }
  }

  /**
   * Maneja el cambio de tipo de ubicación.
   */
  onUbicacionTipoChange() {
    if (this.ubicacionTipo === 'Fuera del campus') {
      this.personaUbicacion = 'Fuera del campus';
    } else {
      this.personaUbicacion = '';
    }
  }

  /**
   * Redimensiona y comprime una imagen en Base64 usando un canvas HTML5.
   * Esto garantiza que, incluso en PWA o navegadores web donde las opciones de la cámara no se aplican,
   * la imagen resultante sea pequeña (normalmente < 50KB) y no exceda el límite de Firestore.
   */
  comprimirYRedimensionarBase64(base64Str: string, maxAncho = 500): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxAncho) {
          height = Math.round((height * maxAncho) / width);
          width = maxAncho;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Comprimir como JPEG al 60% de calidad para un tamaño mínimo pero nítido
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        resolve(compressedBase64);
      };
      img.onerror = (err) => {
        reject(err);
      };
    });
  }

  /**
   * Permite tomar una foto de la actividad con la cámara o seleccionarla desde la galería.
   */
  async seleccionarFotoActividad() {
    try {
      const image = await Camera.getPhoto({
        quality: 40, // Alta compresión pero suficiente nitidez para celular
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Diálogo nativo: tomar foto o elegir galería
        width: 500, // Redimensionar automáticamente a 500px para que pese ~20KB en lugar de >1MB!
        correctOrientation: true
      });
      if (image && image.dataUrl) {
        this.uploadStatusMessage = 'Procesando foto...';
        this.isUploading = true;
        try {
          this.fotoActividad = await this.comprimirYRedimensionarBase64(image.dataUrl, 500);
        } catch (resizeError) {
          console.warn('Error al redimensionar la imagen, usando original:', resizeError);
          this.fotoActividad = image.dataUrl;
        } finally {
          this.uploadStatusMessage = '';
          this.isUploading = false;
        }
      }
    } catch (error) {
      console.warn('Selección de foto cancelada o fallida:', error);
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

    // Obtener coordenadas GPS en tiempo real
    this.obtenerCoordenadas();

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

    // Obtener coordenadas GPS
    this.obtenerCoordenadas();
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
    this.ubicacionTipo = videojuego.ubicacionTipo || 'Dentro del campus';
    this.personaUbicacion = videojuego.ubicacion;
    this.latitud = videojuego.latitud !== undefined ? videojuego.latitud : -0.2104;
    this.longitud = videojuego.longitud !== undefined ? videojuego.longitud : -78.4891;

    this.videojuegoFavorito = videojuego.videojuegoFavorito;
    this.plataforma = videojuego.plataforma;
    this.generoFavorito = videojuego.generoFavorito;
    this.comentario = videojuego.comentario;
    this.imageUrl = videojuego.imageUrl;
    this.fotoActividad = videojuego.fotoActividad || '';

    this.isAddModalOpen = true;
  }

  /**
   * Cierra el modal de registro.
   */
  closeAddModal() {
    this.isAddModalOpen = false;
  }

  // Caché local en memoria de la lista de juegos de FreeToGame para búsquedas instantáneas
  private cachedAllGames: any[] = [];

  /**
   * Realiza la búsqueda de videojuegos en la API en tiempo real conforme el usuario escribe.
   * Utiliza una caché en memoria para evitar llamadas de red redundantes y garantizar rapidez de 0ms.
   */
  async onApiSearchInput(event: any) {
    const value = event?.target?.value || '';
    this.apiSearchQuery = value;
    const term = value.trim().toLowerCase();

    if (!term) {
      this.apiSearchResults = [];
      return;
    }

    try {
      this.isSearchingAPI = true;

      // Cargar la lista completa en memoria solo una vez
      if (this.cachedAllGames.length === 0) {
        const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent('https://www.freetogame.com/api/games')}`);
        if (response.ok) {
          this.cachedAllGames = await response.json();
        } else {
          throw new Error('No se pudo conectar con la API de FreeToGame');
        }
      }

      // Filtrar la caché local en memoria de forma instantánea
      this.apiSearchResults = this.cachedAllGames.filter(g =>
        g.title.toLowerCase().includes(term)
      ).slice(0, 5);

    } catch (error) {
      console.error('Error en la búsqueda de videojuegos en tiempo real:', error);
    } finally {
      this.isSearchingAPI = false;
    }
  }

  /**
   * Selecciona un videojuego y realiza una segunda consulta a la API para traer toda su información directa.
   */
  async selectGameFromAPI(gameId: number) {
    try {
      this.isSearchingAPI = true;
      this.uploadStatusMessage = 'Cargando detalles...';

      const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.freetogame.com/api/game?id=${gameId}`)}`);
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
      this.uploadStatusMessage = 'Conectando...';

      const finalImageUrl = this.imageUrl.trim() || this.defaultImage;

      // Obtener fecha y hora formateada en Ecuador (EPN)
      const ahora = new Date();
      const fechaHoraFormateada = ahora.toLocaleString('es-EC', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      if (this.isEditMode && this.editingGadget) {
        this.uploadStatusMessage = 'Guardando...';
        await this.gadgetService.updateGadget(this.editingGadget.id!, {
          nombre: this.personaNombre,
          edad: this.personaEdad,
          rol: this.personaRol,
          ubicacionTipo: this.ubicacionTipo,
          ubicacion: this.personaUbicacion,
          latitud: this.latitud,
          longitud: this.longitud,
          fechaHora: fechaHoraFormateada,
          videojuegoFavorito: this.videojuegoFavorito,
          plataforma: this.plataforma,
          generoFavorito: this.generoFavorito,
          comentario: this.comentario,
          imageUrl: finalImageUrl,
          fotoActividad: this.fotoActividad
        });
        alert('¡Encuesta actualizada exitosamente!');
      } else {
        this.uploadStatusMessage = 'Guardando...';
        await this.gadgetService.addGadget({
          nombre: this.personaNombre,
          edad: this.personaEdad,
          rol: this.personaRol,
          ubicacionTipo: this.ubicacionTipo,
          ubicacion: this.personaUbicacion,
          latitud: this.latitud,
          longitud: this.longitud,
          fechaHora: fechaHoraFormateada,
          videojuegoFavorito: this.videojuegoFavorito,
          plataforma: this.plataforma,
          generoFavorito: this.generoFavorito,
          comentario: this.comentario,
          imageUrl: finalImageUrl,
          fotoActividad: this.fotoActividad,
          createdAt: Date.now()
        });
        alert('¡Encuesta registrada exitosamente!');
      }

      this.isUploading = false;
      this.isAddModalOpen = false;
      this.resetForm();
    } catch (e: any) {
      this.isUploading = false;
      this.uploadStatusMessage = '';
      console.error('Error al guardar encuesta:', e);
      alert('Hubo un error al guardar la encuesta.');
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
    this.ubicacionTipo = 'Dentro del campus';
    this.latitud = -0.2104;
    this.longitud = -78.4891;
    this.videojuegoFavorito = '';
    this.plataforma = '';
    this.generoFavorito = '';
    this.comentario = '';
    this.imageUrl = '';
    this.fotoActividad = '';
    
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
