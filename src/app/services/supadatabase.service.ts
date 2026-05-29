import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  // =========================
  // AUTH
  // =========================

  login(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  async register(email: string, password: string) {

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });

    if (data.user) {

      await this.supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          nombre: '',
          apellido: '',
          edad: null,
          foto_url: ''
        });

    }

    return { data, error };
  }

  logout() {
    return this.supabase.auth.signOut();
  }

  // =========================
  // USER
  // =========================

  async obtenerUsuario() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  // =========================
  // PROFILE
  // =========================

  async obtenerPerfil() {

    const user = await this.obtenerUsuario();

    if (!user) return null;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.log(error);
      return null;
    }
    console.log('DATA:', data);
    console.log('ERROR:', error);

    return data;
  }

  async actualizarPerfil(perfil: any) {

    const user = await this.obtenerUsuario();

    if (!user) return;

    return this.supabase
      .from('profiles')
      .update(perfil)
      .eq('id', user.id);

  }

  // =========================
  // STORAGE
  // =========================

  async subirFoto(file: File) {

    const user = await this.obtenerUsuario();

    if (!user) return null;

    const nombreArchivo = `${user.id}-${Date.now()}.jpg`;

    const { error } = await this.supabase.storage
      .from('avatars')
      .upload(nombreArchivo, file);

    if (error) {
      console.log(error);
      return null;
    }

    const { data } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(nombreArchivo);

    const foto_url = data.publicUrl;

    await this.actualizarPerfil({
      foto_url: foto_url
    });

    return foto_url;
  }
}