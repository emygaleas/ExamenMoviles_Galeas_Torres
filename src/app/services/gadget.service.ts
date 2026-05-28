import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface Gadget {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  audioUrl: string;
  videoUrl: string;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class GadgetService {
  private gadgetsSubject = new BehaviorSubject<Gadget[]>([]);
  gadgets$ = this.gadgetsSubject.asObservable();

  // Estado reactivo del reproductor de audio
  private audio = new Audio();
  private currentPlayingSubject = new BehaviorSubject<Gadget | null>(null);
  currentPlaying$ = this.currentPlayingSubject.asObservable();

  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  isPlaying$ = this.isPlayingSubject.asObservable();

  private currentTimeSubject = new BehaviorSubject<number>(0);
  currentTime$ = this.currentTimeSubject.asObservable();

  private durationSubject = new BehaviorSubject<number>(0);
  duration$ = this.durationSubject.asObservable();

  private volumeSubject = new BehaviorSubject<number>(0.8);
  volume$ = this.volumeSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    this.loadGadgets();
    this.initAudioListeners();
  }

  /**
   * Carga los gadgets de la base de datos de Supabase.
   */
  async loadGadgets() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('gadgets')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error al cargar gadgets de Supabase:', error);
        return;
      }

      this.gadgetsSubject.next(data || []);
    } catch (err) {
      console.error('Error inesperado al cargar gadgets:', err);
    }
  }

  /**
   * Agrega un nuevo gadget a la base de datos de Supabase y recarga el listado.
   */
  async addGadget(gadget: Omit<Gadget, 'id' | 'createdAt'>) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('gadgets')
        .insert([gadget]);

      if (error) {
        console.error('Error al insertar gadget en Supabase:', error);
        throw error;
      }

      await this.loadGadgets();
    } catch (err) {
      console.error('Error al añadir gadget:', err);
      throw err;
    }
  }

  /**
   * Actualiza un gadget existente en la base de datos de Supabase y recarga el listado.
   */
  async updateGadget(id: string, updatedData: Partial<Omit<Gadget, 'id' | 'createdAt'>>) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('gadgets')
        .update(updatedData)
        .eq('id', id);

      if (error) {
        console.error('Error al actualizar gadget en Supabase:', error);
        throw error;
      }

      await this.loadGadgets();

      // Si el gadget que se está reproduciendo actualmente es el actualizado, refrescar su información
      const currentPlaying = this.currentPlayingSubject.value;
      if (currentPlaying && currentPlaying.id === id) {
        const { data, error: fetchError } = await this.supabaseService.supabase
          .from('gadgets')
          .select('*')
          .eq('id', id)
          .single();

        if (!fetchError && data) {
          this.currentPlayingSubject.next(data);
        }
      }
    } catch (err) {
      console.error('Error al actualizar gadget:', err);
      throw err;
    }
  }

  /**
   * Elimina un gadget permanentemente de la base de datos de Supabase y recarga el listado.
   */
  async deleteGadget(id: string) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('gadgets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar gadget en Supabase:', error);
        throw error;
      }

      if (this.currentPlayingSubject.value?.id === id) {
        this.stop();
      }

      await this.loadGadgets();
    } catch (err) {
      console.error('Error al eliminar gadget:', err);
      throw err;
    }
  }

  /**
   * Configura oyentes de eventos para el reproductor de audio HTML5.
   */
  private initAudioListeners() {
    this.audio.volume = this.volumeSubject.value;

    this.audio.addEventListener('timeupdate', () => {
      this.currentTimeSubject.next(this.audio.currentTime);
    });

    this.audio.addEventListener('durationchange', () => {
      this.durationSubject.next(this.audio.duration || 0);
    });

    this.audio.addEventListener('play', () => {
      this.isPlayingSubject.next(true);
    });

    this.audio.addEventListener('pause', () => {
      this.isPlayingSubject.next(false);
    });

    this.audio.addEventListener('ended', () => {
      this.isPlayingSubject.next(false);
      this.currentTimeSubject.next(0);
    });
  }

  /**
   * Alterna el estado del reproductor de audio para un gadget específico.
   */
  toggleAudio(gadget: Gadget) {
    const current = this.currentPlayingSubject.value;
    if (current && current.id === gadget.id) {
      if (this.isPlayingSubject.value) {
        this.audio.pause();
      } else {
        this.audio.play().catch(err => console.error('Error al reproducir audio:', err));
      }
    } else {
      this.audio.src = gadget.audioUrl;
      this.audio.load();
      this.currentPlayingSubject.next(gadget);
      this.audio.play()
        .then(() => {
          this.isPlayingSubject.next(true);
        })
        .catch(err => {
          console.error('Error al reproducir pista de audio:', err);
          this.isPlayingSubject.next(false);
        });
    }
  }

  pause() {
    this.audio.pause();
  }

  resume() {
    if (this.audio.src) {
      this.audio.play().catch(err => console.error('Error al reanudar audio:', err));
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.currentPlayingSubject.next(null);
    this.isPlayingSubject.next(false);
  }

  seek(seconds: number) {
    if (this.audio.duration) {
      this.audio.currentTime = seconds;
    }
  }

  setVolume(vol: number) {
    const safeVol = Math.max(0, Math.min(1, vol));
    this.audio.volume = safeVol;
    this.volumeSubject.next(safeVol);
  }
}
