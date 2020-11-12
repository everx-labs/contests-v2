import * as firebase from 'firebase/firebase';
import 'firebase/firestore';

const timestampData = (data) => {
    const timestampedData = {
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    return timestampedData;
};

export { timestampData };
