import { IS_LOGGED_IN } from '../actions/ActionTypes';

const initialState = { isLoggedIn: undefined };

const authReducer = (state = initialState, action) => {
    switch (action.type) {
    case IS_LOGGED_IN:
        return {
            ...state,
            isLoggedIn: action.isLoggedIn,
        };
    default:
        return state;
    }
};

export default authReducer;



// WEBPACK FOOTER //
// src/reducers/AuthReducer.js