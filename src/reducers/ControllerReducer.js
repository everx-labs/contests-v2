import { Dimensions } from 'react-native';
import { UIConstant } from '../services/UIKit/UIKit';
import { SHOW_CONTROLLER, NAVIGATION_MENU_CONTROLLER, SET_BACKGROUND_PRESET, SET_SCREEN_WIDTH, SET_MOBILE } from '../actions/ActionTypes';

const initialState = {
    controllerToShow: null,
    backgroundPresetName: '',
    screenWidth: 0,
    mobile: Dimensions.get('window').width < UIConstant.elasticWidthBroad(),
    menuItems: [],
    navigation: null,
};

const controllerReducer = (state = initialState, action) => {
    switch (action.type) {
    case NAVIGATION_MENU_CONTROLLER:
        return {
            ...state,
            menuItems: action.menuItems,
            navigation: action.navigation,
        };
    case SHOW_CONTROLLER:
        return {
            ...state,
            controllerToShow: action.controllerToShow,
        };
    case SET_BACKGROUND_PRESET:
        return {
            ...state,
            backgroundPresetName: action.backgroundPresetName,
        };
    case SET_SCREEN_WIDTH:
        return {
            ...state,
            screenWidth: action.screenWidth,
        };
    case SET_MOBILE:
        return {
            ...state,
            mobile: action.mobile,
        };
    default:
        return state;
    }
};

export default controllerReducer;
