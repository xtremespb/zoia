import {
    PAGES_LIST_TABLE_SET_STATE
} from '../constants/pages';

const initialState = {
    pagesTableState: null
};

export default ((state = initialState, action) => {
    switch (action.type) {
    case PAGES_LIST_TABLE_SET_STATE:
        return {
            ...state,
            pagesTableState: action.payload
        };
    default:
        return state;
    }
});
