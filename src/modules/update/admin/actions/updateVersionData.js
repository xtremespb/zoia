import {
    UPDATE_SET_VERSION_DATA
} from '../constants/update';

export default (versionLocal, versionRemote) => ({
    type: UPDATE_SET_VERSION_DATA,
    versionLocal,
    versionRemote
});
