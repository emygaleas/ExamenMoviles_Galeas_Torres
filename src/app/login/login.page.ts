import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonCard, IonCardContent, IonItem, IonLabel,
  IonButton, IonInput, IonText, IonIcon
} from '@ionic/angular/standalone';

import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { AuthService } from 'src/app/services/auth.service';

import { addIcons } from 'ionicons';

import {
  mailOutline,
  lockClosedOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  gameControllerOutline,
  flashOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    CommonModule, FormsModule, IonCard, IonCardContent,
    IonItem, IonLabel, IonButton, IonText, IonInput, IonIcon
  ]
})
export class LoginPage implements OnInit {

  email = '';
  password = '';
  mensaje = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({
      'mail-outline': mailOutline,
      'lock-closed-outline': lockClosedOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'game-controller-outline': gameControllerOutline,
      'flash-outline': flashOutline
    });
  }

  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  async login() {
    this.email = this.email.trim();

    if (!this.email || !this.password) {
      await this.mostrarToast(
        'Completa el correo y la contraseña',
        'danger'
      );
      return;
    }

    if (!this.validarEmail(this.email)) {
      await this.mostrarToast(
        'Ingresa un correo válido',
        'danger'
      );
      return;
    }

    if (this.password.length < 6) {
      await this.mostrarToast(
        'La contraseña debe tener mínimo 6 caracteres',
        'danger'
      );
      return;
    }

    try {
      await this.authService.login(this.email, this.password);

      await this.mostrarToast(
        'Inicio de sesión exitoso',
        'success'
      );

      this.router.navigateByUrl('/tabs');

    } catch (error: any) {
      console.log('ERROR LOGIN:', error.code);

      let mensaje = 'Credenciales incorrectas';

      if (error.code === 'auth/user-not-found') {
        mensaje = 'No existe una cuenta con este correo';
      }

      if (error.code === 'auth/wrong-password') {
        mensaje = 'Contraseña incorrecta';
      }

      if (error.code === 'auth/invalid-credential') {
        mensaje = 'Correo o contraseña incorrectos';
      }

      if (error.code === 'auth/too-many-requests') {
        mensaje = 'Demasiados intentos. Intenta más tarde';
      }

      await this.mostrarToast(mensaje, 'danger');
    }
  }

  async register() {
    this.router.navigateByUrl('/register');
  }

  async mostrarToast(mensaje: string, color: string) {
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

  ngOnInit() {}
}