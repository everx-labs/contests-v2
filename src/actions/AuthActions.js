import { IS_LOGGED_IN } from './ActionTypes';

const setIsLoggedIn = (isLoggedIn) => {
    return {
        type: IS_LOGGED_IN,
        isLoggedIn,
    };
};

export { setIsLoggedIn };
