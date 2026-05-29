import { Injectable } from '@angular/core';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

import {
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private firebaseService: FirebaseService
  ) {}

  async register(
    email: string,
    password: string,
    nombre: string,
    apellido: string,
  ) {

    const credencial =
      await createUserWithEmailAndPassword(
        this.firebaseService.auth,
        email,
        password
      );

    const uid = credencial.user.uid;

    await setDoc(
      doc(this.firebaseService.firestore, 'usuarios', uid),
      {
        uid,
        email,
        nombre,
        apellido,
        fotoPerfil: '',
        fechaCreacion: new Date()
      }
    );

    return credencial;

  }

  async login(
    email: string,
    password: string
  ) {

    return await signInWithEmailAndPassword(
      this.firebaseService.auth,
      email,
      password
    );

  }

  async logout() {

    return await signOut(
      this.firebaseService.auth
    );

  }

  async obtenerPerfil() {

    const usuario =
      this.firebaseService.auth.currentUser;

    if (!usuario) return null;

    const ref = doc(
      this.firebaseService.firestore,
      'usuarios',
      usuario.uid
    );

    const snap = await getDoc(ref);

    return snap.exists()
      ? snap.data()
      : null;

  }

  async actualizarPerfil(data: any) {

    const usuario =
      this.firebaseService.auth.currentUser;

    if (!usuario) return;

    const ref = doc(
      this.firebaseService.firestore,
      'usuarios',
      usuario.uid
    );

    return await updateDoc(ref, data);

  }

}