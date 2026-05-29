import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';

import { addIcons } from 'ionicons';
import { gameControllerOutline } from 'ionicons/icons';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, CommonModule, FormsModule, RouterLink]
})

export class WelcomePage implements OnInit {

  constructor() {
    addIcons({
      'game-controller-outline': gameControllerOutline
    });
  }

  ngOnInit() {
  }

}
