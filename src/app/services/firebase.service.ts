import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment } from '../../environments/enviroment';

import {getAuth, Auth} from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  public app: FirebaseApp;

  public firestore: Firestore;

  public auth: Auth;

  constructor() {

    this.app = getApps().length === 0
      ? initializeApp(environment.firebaseConfig)
      : getApp();

    this.firestore = getFirestore(this.app);

    this.auth = getAuth(this.app);

  }
}