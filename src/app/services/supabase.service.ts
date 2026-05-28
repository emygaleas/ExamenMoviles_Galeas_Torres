import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }

  /**
   * Sube un archivo a Supabase Storage en la carpeta especificada ('images' o 'sounds')
   * y devuelve su URL pública.
   * 
   * @param file Archivo a subir
   * @param folder Carpeta de destino dentro del bucket
   */
  async uploadFile(file: File, folder: 'images' | 'sounds'): Promise<string> {
    // Generar un nombre de archivo único para evitar colisiones
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueName = `${Date.now()}_${cleanFileName}`;
    const filePath = `${folder}/${uniqueName}`;

    const { data, error } = await this.supabase.storage
      .from(environment.supabaseBucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error al subir archivo a Supabase Storage:', error);
      throw error;
    }

    // Obtener la URL pública del archivo cargado
    const { data: publicUrlData } = this.supabase.storage
      .from(environment.supabaseBucket)
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('No se pudo obtener la URL pública del archivo subido.');
    }

    return publicUrlData.publicUrl;
  }
}
