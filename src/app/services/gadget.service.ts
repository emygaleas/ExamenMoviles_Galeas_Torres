import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';

export interface Videojuego {
  id?: string;
  nombre: string;              // Nombre de la persona encuestada
  edad: string;                // Rango de edad o edad aproximada
  rol: string;                 // estudiante, docente, administrativo, visitante
  ubicacion: string;           // Lugar aproximado (si es dentro) o "Fuera del campus"
  ubicacionTipo: string;       // 'Dentro del campus' o 'Fuera del campus'
  latitud: number;             // Coordenadas GPS
  longitud: number;            // Coordenadas GPS
  fechaHora: string;           // Fecha y hora formateada
  videojuegoFavorito: string;  // Videojuego favorito
  plataforma: string;          // móvil, consola, PC, navegador
  generoFavorito: string;      // acción, aventura, deportes, estrategia, RPG, terror, simulación, otro
  comentario: string;          // Comentario breve (extraído de descripción corta)
  imageUrl: string;            // Imagen de la API de FreeToGame
  fotoActividad?: string;      // Foto personalizada de la actividad
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class GadgetService {
  private videojuegosSubject = new BehaviorSubject<Videojuego[]>([]);
  gadgets$ = this.videojuegosSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.loadGadgets();
  }

  /**
   * Carga los registros de la encuesta de videojuegos desde Cloud Firestore.
   */
  async loadGadgets() {
    try {
      const q = query(
        collection(this.firebaseService.firestore, 'videojuegos'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const list: Videojuego[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Videojuego);
      });

      this.videojuegosSubject.next(list);
    } catch (err) {
      console.error('Error al cargar encuestas de videojuegos de Firestore:', err);
    }
  }

  /**
   * Agrega una nueva encuesta de videojuego a Firestore.
   */
  async addGadget(videojuego: Omit<Videojuego, 'id'>) {
    try {
      await addDoc(
        collection(this.firebaseService.firestore, 'videojuegos'),
        videojuego
      );
      await this.loadGadgets();
    } catch (err) {
      console.error('Error al añadir encuesta de videojuego en Firestore:', err);
      throw err;
    }
  }

  /**
   * Actualiza una encuesta de videojuego existente en Firestore.
   */
  async updateGadget(id: string, updatedData: Partial<Omit<Videojuego, 'id' | 'createdAt'>>) {
    try {
      const docRef = doc(this.firebaseService.firestore, 'videojuegos', id);
      await updateDoc(docRef, updatedData);
      await this.loadGadgets();
    } catch (err) {
      console.error('Error al actualizar encuesta de videojuego:', err);
      throw err;
    }
  }

  /**
   * Elimina una encuesta permanentemente de Firestore.
   */
  async deleteGadget(id: string) {
    try {
      const docRef = doc(this.firebaseService.firestore, 'videojuegos', id);
      await deleteDoc(docRef);
      await this.loadGadgets();
    } catch (err) {
      console.error('Error al eliminar encuesta en Firestore:', err);
      throw err;
    }
  }
}
