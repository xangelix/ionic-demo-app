import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProfileComponent } from './profile/profile.component';
import { Profile } from 'selenium-webdriver/firefox';

@NgModule({
  declarations: [ProfileComponent],
  imports: [
    CommonModule
  ],
  exports: [ProfileComponent]
})
export class SharedModule { }
