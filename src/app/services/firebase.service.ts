import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment } from '../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  public app: FirebaseApp;
  public firestore: Firestore;

  constructor() {
    // Inicializar Firebase (evitando re-inicialización en desarrollo caliente)
    this.app = getApps().length === 0 ? initializeApp(environment.firebase) : getApp();
    this.firestore = getFirestore(this.app);
  }
}
