import { createStore, compose } from 'redux';
import { Platform } from 'react-native';

import RootReducer from '../reducers';

const initialState = {};

let composeEnhancers = compose;
if (Platform.OS === 'web') {
    composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
}

const store = createStore(
    RootReducer,
    initialState,
    composeEnhancers(),
);

export default store;
