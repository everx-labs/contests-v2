import * as firebase from 'firebase/firebase';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';
import 'firebase/storage';

import Credentials from './FBCredentials';

let currentApp = null;

export default class Firebase {
    static db = null;
    static storage = null;

    static init() {
        console.log('========', firebase.apps);
        currentApp = firebase.initializeApp(Credentials);
        console.log('========currentApp', currentApp);

        Firebase.db = firebase.firestore();
        Firebase.storage = firebase.storage();
    }

    static functions() {
        return firebase.functions();
    }

    static loginAnonymously() {
        return this.auth().signInAnonymously()
            .catch((error) => {
                console.error('[Firebase] Failed to sign in anonymously with error: ', error);
            });
    }

    static auth(app = currentApp) {
        return firebase.auth(app);
    }
}
