import {
    USERS_LIST_TABLE_SET_STATE
} from '../constants/users';

const initialState = {
    usersTableState: null
};

export default ((state = initialState, action) => {
    switch (action.type) {
    case USERS_LIST_TABLE_SET_STATE:
        return {
            ...state,
            usersTableState: action.payload
        };
    default:
        return state;
    }
});
