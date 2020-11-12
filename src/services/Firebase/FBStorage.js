import { Platform } from 'react-native';

import Firebase from './index';

// TODO:
// move services/Firebase functionality to services FBKit,
// and refuse to use services/Firebase in project

export default class FBStorage {
    static uploadFile(
        file, type, objectId, path,
        metadata = { contentType: 'application/octet-stream' },
    ) {
        return new Promise((resolve, reject) => {
            const fileRef = Firebase.storage.ref(`${path}/${type}/${objectId}`);
            fileRef.put(file, metadata)
                .then(() => {
                    return fileRef.getDownloadURL();
                }).then((url) => {
                    console.log(`File succeeded to upload with URL: ${url}`);
                    resolve(url);
                }).catch((error) => {
                    console.log(`File ${file} failed to upload with error: ${error}`);
                    reject(error);
                });
        });
    }
    static uploadDocument(document, type, objectId) {
        const documentsPath = 'documents';
        if (Platform.OS === 'web') {
            const metadata = {
                contentType: type || 'application/octet-stream',
            };
            return FBStorage.uploadFile(document, type, objectId, documentsPath, metadata);
        }
    }
}
