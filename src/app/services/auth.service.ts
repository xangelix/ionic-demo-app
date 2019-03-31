import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';

import { Platform } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { GooglePlus } from '@ionic-native/google-plus/ngx';

import { Observable, of } from 'rxjs';
import { switchMap, take, map } from 'rxjs/operators';

import { DbService } from './db.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<any>;

  constructor(
    private afAuth: AngularFireAuth,
    private db: DbService,
    private router: Router,
    private gplus: GooglePlus,
    private platform: Platform,
    private loadingController: LoadingController,
    private storage: Storage
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => (user ? db.doc$(`users/${user.uid}`) : of(null)))
    );

    this.handleRedirect();
  }

  async anonymousLogin() {
    const credential = await this.afAuth.auth.signInAnonymously();
    return await this.updateUserData(credential.user);
  }

  private updateUserData({ uid, email, displayName, photoURL, isAnonymous }) {
    const path = `users/${uid}`;

    const data = {
      uid,
      email,
      displayName,
      photoURL,
      isAnonymous
    };

    return this.db.updateAt(path, data);
  }

  uid() {
    return this.user$.pipe(
      take(1),
      map(u => u && u.uid)
    ).toPromise();
  }

  async signOut() {
    await this.afAuth.auth.signOut();
    return this.router.navigate(['/']);
  }

  setRedirect(val) {
    this.storage.set('authRedirect', val);
  }

  async isRedirect() {
    return await this.storage.get('authRedirect');
  }

  async googleLogin() {
    try {
      let user;

      if (this.platform.is('cordova')) {
        user = await this.nativeGoogleLogin();
      } else {
        await this.setRedirect(true);
        const provider = new auth.GoogleAuthProvider();
        user = await this.afAuth.auth.signInWithRedirect(provider);
      }

      return await this.updateUserData(user);
    } catch (err) {
      console.log(err);
    }
  }

  private async handleRedirect() {
    if ((await this.isRedirect()) !== true) {
      return null;
    }
    const loading = await this.loadingController.create();
    await loading.present();

    const result = await this.afAuth.auth.getRedirectResult();

    if (result.user) {
      await this.updateUserData(result.user);
    }

    await loading.dismiss();
    await this.setRedirect(false);

    return result;
  }

  async nativeGoogleLogin(): Promise<any> {
    const gplusUser = await this.gplus.login({
      webClientId: '847425801415-gvfr9hkmhqevhoog5i2ppo5kflsv8jib.apps.googleusercontent.com',
      offline: true,
      scopes: 'profile email'
    });

    return await this.afAuth.auth.signInWithCredential(
      auth.GoogleAuthProvider.credential(gplusUser.idToken)
    );
  }
}
