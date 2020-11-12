Set your Firebase credentials here:

```src/services/Firebase/FBCredentials.js```

don't forget to set up:
```
web/.firebaserc
web/firebase.json
set your-fb-hosting in deploy:contests script in package.json
```

to run:
```
npm install
git submodule init
git submodule update
npm run web:contests
```
