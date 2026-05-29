import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonInput,
  IonToast
} from '@ionic/angular/standalone';

import { Router } from '@angular/router';
import { addIcons } from 'ionicons';

import {
  personCircle,
  logOutOutline,
  person,
  personOutline,
  idCardOutline,
  calendarOutline,
  cameraOutline,
  checkmarkCircle,
  gameController,
  cloudDoneOutline,
  shieldCheckmarkOutline,
  saveOutline
} from 'ionicons/icons';

import {
  Camera,
  CameraResultType,
  CameraSource
} from '@capacitor/camera';

import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonInput,
    IonToast
  ]
})
export class PerfilPage implements OnInit {

  perfil: any = {
    nombre: '',
    apellido: '',
    edad: '',
    email: '',
    fotoPerfil: ''
  };

  toastOpen = false;
  toastMessage = '';
  toastColor = 'success';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      'person-circle': personCircle,
      'log-out-outline': logOutOutline,
      'person': person,
      'person-outline': personOutline,
      'id-card-outline': idCardOutline,
      'calendar-outline': calendarOutline,
      'camera-outline': cameraOutline,
      'checkmark-circle': checkmarkCircle,
      'game-controller': gameController,
      'cloud-done-outline': cloudDoneOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'save-outline': saveOutline
    });
  }

  async ngOnInit() {
    await this.cargarPerfil();
  }

  async cargarPerfil() {
    const data = await this.authService.obtenerPerfil();

    if (data) {
      this.perfil = {
        ...this.perfil,
        ...data
      };
    }
  }

  async seleccionarFoto() {
    const image = await Camera.getPhoto({
      quality: 50,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt
    });

    this.perfil.fotoPerfil = image.dataUrl || '';
  }

  async guardarPerfil() {
    try {
      await this.authService.actualizarPerfil({
        nombre: this.perfil.nombre,
        apellido: this.perfil.apellido,
        edad: this.perfil.edad,
        fotoPerfil: this.perfil.fotoPerfil
      });

      this.mostrarToast('Perfil actualizado correctamente', 'success');

    } catch (error) {
      this.mostrarToast('No se pudo actualizar el perfil', 'danger');
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  mostrarToast(mensaje: string, color: string) {
    this.toastMessage = mensaje;
    this.toastColor = color;
    this.toastOpen = true;
  }
}