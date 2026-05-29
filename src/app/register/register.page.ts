import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButton,
  IonInput,
  IonText,
  IonIcon
} from '@ionic/angular/standalone';

import { ToastController } from '@ionic/angular';

import { SupabaseService } from 'src/app/services/supadatabase.service';
import { Router } from '@angular/router';

import { addIcons } from 'ionicons';

import {
  mailOutline,
  lockClosedOutline,
  personAddOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  personOutline,
  idCardOutline,
  gameControllerOutline
} from 'ionicons/icons';

import {AuthService} from "../services/auth.service";

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,

  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonButton,
    IonInput,
    IonText,
    IonIcon
  ]
})

export class RegisterPage implements OnInit {

  nombre = '';
  apellido = '';
  email = '';
  password = '';
  mensaje = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {

    addIcons({
      'person-outline': personOutline,
      'id-card-outline': idCardOutline,
      'mail-outline': mailOutline,
      'lock-closed-outline': lockClosedOutline,
      'person-add-outline': personAddOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'game-controller-outline': gameControllerOutline
    });

  }

  async register() {
    try {
      await this.authService.register(
        this.email,
        this.password,
        this.nombre,
        this.apellido
      );

      await this.mostrarToast(
        'Registro exitoso',
        'success'
      );

      setTimeout(() => {
        this.router.navigateByUrl('/login');
      }, 2000);

    } catch (error: any) {
      console.log('ERROR FIREBASE:', error);

      console.log('CODE:', error.code);

      console.log('MESSAGE:', error.message);
      this.mensaje = error.message;

      await this.mostrarToast(
        'No se pudo registrar',
        'danger'
      );
    }
  }

  async login() {
    this.router.navigateByUrl('/login');
  }

  async mostrarToast(
    mensaje: string,
    color: string
  ) {

    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'top',
      color: color,

      icon: color === 'success'
        ? 'checkmark-circle-outline'
        : 'close-circle-outline'
    });

    await toast.present();
  }

  ngOnInit() {
  }

}