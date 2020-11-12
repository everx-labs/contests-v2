import Firebase from './index';
import { timestampData } from './dataWrapper';

export default class FBProposals {
    static Collection = 'proposals';

    static getCollection() {
        const { db } = Firebase;
        return db.collection(FBProposals.Collection);
    }

    static add(document) {
        const collection = this.getCollection();
        return collection.add(timestampData(document));
    }
}
