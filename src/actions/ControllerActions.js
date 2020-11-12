import {
    SHOW_CONTROLLER,
    SET_BACKGROUND_PRESET,
    SET_SCREEN_WIDTH,
    SET_MOBILE,
    NAVIGATION_MENU_CONTROLLER,
} from './ActionTypes';

const showController = (controllerToShow, animated) => {
    return {
        type: SHOW_CONTROLLER,
        controllerToShow,
        animated,
    };
};

const navigationMenuController = (menuItems, navigation) => {
    return {
        type: NAVIGATION_MENU_CONTROLLER,
        menuItems,
        navigation,
    };
};

const setBackgroundPreset = (backgroundPresetName) => {
    return {
        type: SET_BACKGROUND_PRESET,
        backgroundPresetName,
    };
};

const setScreenWidth = (screenWidth) => {
    return {
        type: SET_SCREEN_WIDTH,
        screenWidth,
    };
};

const setMobile = (mobile) => {
    return {
        type: SET_MOBILE,
        mobile,
    };
};

export { showController, navigationMenuController, setBackgroundPreset, setScreenWidth, setMobile };
