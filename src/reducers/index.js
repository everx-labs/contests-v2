import { combineReducers } from 'redux';
import AuthReducer from './AuthReducer';
import ControllerReducer from './ControllerReducer';

export default combineReducers({
    auth: AuthReducer,
    controller: ControllerReducer,
});
