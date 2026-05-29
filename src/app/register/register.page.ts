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
  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  async register() {
    this.nombre = this.nombre.trim();
    this.apellido = this.apellido.trim();
    this.email = this.email.trim();

    if (!this.nombre || !this.apellido || !this.email || !this.password) {
      await this.mostrarToast(
        'Completa todos los campos',
        'danger'
      );
      return;
    }

    if (this.nombre.length < 2) {
      await this.mostrarToast(
        'El nombre debe tener al menos 2 caracteres',
        'danger'
      );
      return;
    }

    if (this.apellido.length < 2) {
      await this.mostrarToast(
        'El apellido debe tener al menos 2 caracteres',
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
      }, 1500);

    } catch (error: any) {
      console.log('ERROR FIREBASE:', error.code);

      let mensaje = 'No se pudo registrar';

      if (error.code === 'auth/email-already-in-use') {
        mensaje = 'Este correo ya está registrado';
      }

      if (error.code === 'auth/invalid-email') {
        mensaje = 'Correo electrónico inválido';
      }

      if (error.code === 'auth/weak-password') {
        mensaje = 'La contraseña es muy débil';
      }

      if (error.code === 'auth/network-request-failed') {
        mensaje = 'Error de conexión. Revisa tu internet';
      }

      await this.mostrarToast(mensaje, 'danger');
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