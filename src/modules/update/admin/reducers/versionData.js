import {
    UPDATE_SET_VERSION_DATA
} from '../constants/update';

const initialState = {
    versionLocal: null,
    versionRemote: null
};

export default ((state = initialState, action) => {
    switch (action.type) {
    case UPDATE_SET_VERSION_DATA:
        return {
            ...state,
            versionLocal: action.versionLocal,
            versionRemote: action.versionRemote
        };
    default:
        return state;
    }
});
