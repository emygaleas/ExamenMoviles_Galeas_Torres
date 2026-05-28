import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  IonHeader, IonToolbar, IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonIcon, IonRange, IonInput, IonTextarea,
  IonModal, IonLabel, IonList, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  play, pause, volumeHigh, volumeMute, add, close,
  cloudUpload, trash, film, sparkles, link, musicalNotes, checkmarkCircle,
  pencil
} from 'ionicons/icons';

import { GadgetService, Gadget } from '../services/gadget.service';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonContent, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonButton, IonIcon, IonRange, IonInput, IonTextarea,
    IonModal, IonLabel, IonList, IonSpinner
  ]
})
export class HomePage implements OnInit {
  // Observables para el estado del reproductor
  currentPlaying$: Observable<Gadget | null>;
  isPlaying$: Observable<boolean>;
  currentTime$: Observable<number>;
  duration$: Observable<number>;
  volume$: Observable<number>;

  // Listado filtrable de gadgets
  filteredGadgets$!: Observable<Gadget[]>;
  private searchSubject = new BehaviorSubject<string>('');

  // Modales
  isAddModalOpen = false;
  isVideoModalOpen = false;
  selectedVideoGadget: Gadget | null = null;
  selectedVideoSafeUrl: SafeResourceUrl | null = null;
  isEditMode = false;
  editingGadget: Gadget | null = null;

  // Formulario para nuevo gadget
  newName = '';
  newDescription = '';
  newVideoUrl = '';
  imageFile: File | null = null;
  audioFile: File | null = null;

  // Previews e información de carga
  imagePreviewUrl: string | null = null;
  audioFileName = '';
  imageFileName = '';
  isUploading = false;
  uploadStatusMessage = '';

  // Estado local para evitar usar async pipe en eventos click
  isPlayingLocal = false;

  constructor(
    public gadgetService: GadgetService,
    private supabaseService: SupabaseService,
    private sanitizer: DomSanitizer
  ) {
    // Registrar iconos standalone para usarlos con <ion-icon>
    addIcons({
      play, pause, volumeHigh, volumeMute, add, close,
      cloudUpload, trash, film, sparkles, link, musicalNotes, checkmarkCircle,
      pencil
    });

    this.currentPlaying$ = this.gadgetService.currentPlaying$;
    this.isPlaying$ = this.gadgetService.isPlaying$;
    this.currentTime$ = this.gadgetService.currentTime$;
    this.duration$ = this.gadgetService.duration$;
    this.volume$ = this.gadgetService.volume$;

    // Suscribirse para tener una copia sincrónica del estado de reproducción
    this.isPlaying$.subscribe(playing => {
      this.isPlayingLocal = playing;
    });
  }

  ngOnInit() {
    // Configurar el buscador reactivo combinando el listado con el filtro de texto
    this.filteredGadgets$ = combineLatest([
      this.gadgetService.gadgets$,
      this.searchSubject
    ]).pipe(
      map(([gadgets, search]) => {
        if (!search.trim()) return gadgets;
        const term = search.toLowerCase().trim();
        return gadgets.filter(g =>
          g.name.toLowerCase().includes(term) ||
          g.description.toLowerCase().includes(term)
        );
      })
    );
  }

  /**
   * Actualiza el término de búsqueda.
   */
  onSearchChange(event: any) {
    const value = event?.target?.value || '';
    this.searchSubject.next(value);
  }

  /**
   * Alterna la reproducción de un gadget directamente desde su tarjeta.
   */
  playAudio(gadget: Gadget, event: Event) {
    event.stopPropagation(); // Evitar comportamientos no deseados en la tarjeta
    this.gadgetService.toggleAudio(gadget);
  }

  /**
   * Pausa/Reanuda el reproductor global.
   */
  toggleGlobalPlay() {
    if (this.isPlayingLocal) {
      this.gadgetService.pause();
    } else {
      this.gadgetService.resume();
    }
  }

  /**
   * Cambia la posición del track.
   */
  onSeek(event: any) {
    const value = event?.detail?.value;
    if (value !== undefined) {
      this.gadgetService.seek(value);
    }
  }

  /**
   * Ajusta el volumen.
   */
  onVolumeChange(event: any) {
    const value = event?.detail?.value;
    if (value !== undefined) {
      this.gadgetService.setVolume(value / 100);
    }
  }

  /**
   * Elimina un gadget.
   */
  async deleteGadget(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este gadget de tu catálogo?')) {
      try {
        await this.gadgetService.deleteGadget(id);
        alert('¡Gadget eliminado exitosamente!');
      } catch (err) {
        console.error('Error al eliminar gadget:', err);
        alert('Hubo un error al eliminar el gadget de la base de datos.');
      }
    }
  }

  /**
   * Abre el modal para visualizar el video del gadget.
   */
  openVideo(gadget: Gadget) {
    this.selectedVideoGadget = gadget;
    this.selectedVideoSafeUrl = this.getSafeEmbedUrl(gadget.videoUrl);
    this.isVideoModalOpen = true;
  }

  /**
   * Cierra el modal de video.
   */
  closeVideo() {
    this.isVideoModalOpen = false;
    this.selectedVideoGadget = null;
    this.selectedVideoSafeUrl = null;
  }

  /**
   * Abre el modal para registrar un nuevo gadget.
   */
  openAddModal() {
    this.resetForm();
    this.isEditMode = false;
    this.editingGadget = null;
    this.isAddModalOpen = true;
  }

  /**
   * Abre el modal en modo edición precargando los datos del gadget.
   */
  openEditModal(gadget: Gadget, event: Event) {
    event.stopPropagation();
    this.resetForm();
    this.isEditMode = true;
    this.editingGadget = gadget;

    // Precargar campos del formulario
    this.newName = gadget.name;
    this.newDescription = gadget.description;
    this.newVideoUrl = gadget.videoUrl;
    // La imagen no se carga como archivo, pero mostramos el preview actual
    this.imagePreviewUrl = gadget.imageUrl;

    this.isAddModalOpen = true;
  }

  /**
   * Cierra el modal de registro de gadget.
   */
  closeAddModal() {
    this.isAddModalOpen = false;
  }

  /**
   * Maneja la selección del archivo de imagen.
   */
  onImageSelected(event: any) {
    const file = event?.target?.files?.[0];
    if (file) {
      this.imageFile = file;
      this.imageFileName = file.name;
      // Generar preview local
      this.imagePreviewUrl = URL.createObjectURL(file);
    }
  }

  /**
   * Maneja la selección del archivo de audio.
   */
  onAudioSelected(event: any) {
    const file = event?.target?.files?.[0];
    if (file) {
      this.audioFile = file;
      this.audioFileName = file.name;
    }
  }

  /**
   * Guarda el gadget (registra o actualiza) subiendo los archivos modificados a Supabase.
   */
  async saveGadget() {
    // Validaciones básicas
    if (!this.newName.trim()) {
      alert('Por favor, ingresa el nombre del gadget.');
      return;
    }

    // Los archivos son requeridos únicamente en modo creación
    if (!this.isEditMode) {
      if (!this.imageFile) {
        alert('Por favor, selecciona una imagen para el gadget.');
        return;
      }
      if (!this.audioFile) {
        alert('Por favor, selecciona un sonido para el gadget.');
        return;
      }
    }

    try {
      this.isUploading = true;

      // 1. Subir la imagen si se seleccionó una nueva
      let imageUrl = this.editingGadget?.imageUrl || '';
      if (this.imageFile) {
        this.uploadStatusMessage = this.isEditMode 
          ? 'Subiendo nueva fotografía a Supabase...' 
          : '1/2: Subiendo fotografía a Supabase Storage...';
        imageUrl = await this.supabaseService.uploadFile(this.imageFile, 'images');
      }

      // 2. Subir el audio si se seleccionó uno nuevo
      let audioUrl = this.editingGadget?.audioUrl || '';
      if (this.audioFile) {
        this.uploadStatusMessage = this.isEditMode 
          ? 'Subiendo nuevo archivo de sonido a Supabase...' 
          : '2/2: Subiendo archivo de sonido a Supabase Storage...';
        audioUrl = await this.supabaseService.uploadFile(this.audioFile, 'sounds');
      }

      // 3. Guardar datos en el listado
      if (this.isEditMode && this.editingGadget) {
        this.uploadStatusMessage = 'Actualizando datos del gadget...';
        await this.gadgetService.updateGadget(this.editingGadget.id, {
          name: this.newName,
          description: this.newDescription,
          imageUrl: imageUrl,
          audioUrl: audioUrl,
          videoUrl: this.newVideoUrl || 'https://www.youtube.com/watch?v=5V9H1S62Uj8'
        });
        alert('¡Gadget actualizado exitosamente!');
      } else {
        this.uploadStatusMessage = 'Guardando datos del gadget...';
        await this.gadgetService.addGadget({
          name: this.newName,
          description: this.newDescription,
          imageUrl: imageUrl,
          audioUrl: audioUrl,
          videoUrl: this.newVideoUrl || 'https://www.youtube.com/watch?v=5V9H1S62Uj8'
        });
        alert('¡Gadget agregado exitosamente en Supabase Database!');
      }

      // Finalizar
      this.isUploading = false;
      this.isAddModalOpen = false;
      this.resetForm();
    } catch (e: any) {
      this.isUploading = false;
      this.uploadStatusMessage = '';
      console.error('Error al guardar gadget:', e);
      alert('Hubo un error al subir los archivos o conectar con Supabase. Verifica tu conexión e inténtalo de nuevo.');
    }
  }

  /**
   * Limpia los estados del formulario.
   */
  private resetForm() {
    this.newName = '';
    this.newDescription = '';
    this.newVideoUrl = '';
    this.imageFile = null;
    this.audioFile = null;
    this.imagePreviewUrl = null;
    this.imageFileName = '';
    this.audioFileName = '';
    this.isUploading = false;
    this.uploadStatusMessage = '';
    this.isEditMode = false;
    this.editingGadget = null;
  }

  /**
   * Formatea un número de segundos en formato mm:ss.
   */
  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds === null) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * Procesa la URL de video (YouTube o TikTok) para generar una URL segura embebida.
   */
  private getSafeEmbedUrl(url: string): SafeResourceUrl {
    if (!url) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('');
    }

    let embedUrl = url;

    try {
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/');
        if (parts.length > 1) {
          const videoId = parts[1].split('?')[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (url.includes('tiktok.com/') && url.includes('/video/')) {
        const match = url.match(/\/video\/(\d+)/);
        if (match && match[1]) {
          embedUrl = `https://www.tiktok.com/embed/v2/${match[1]}`;
        }
      }
    } catch (e) {
      console.error('Error al parsear URL de video:', e);
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}
