import React, { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';

const PagesList = lazy(() => import(/* webpackChunkName: "PagesList" */ './components/PagesList.jsx'));
const PagesEdit = lazy(() => import(/* webpackChunkName: "PagesEdit" */ './components/PagesEdit.jsx'));

const getSuspense = () => (<div className="uk-flex uk-flex-center uk-flex-middle" style={{ height: '100%' }}><span uk-spinner="ratio:2" /></div>);

// const getPageView = props => ((
//     <Suspense fallback={getSuspense()}>
//         <PageView
//             {...props}
//         />
//     </Suspense>
// ));

const getPagesList = () => ((
    <Suspense fallback={getSuspense()}>
        <PagesList />
    </Suspense>
));

const getPagesEdit = props => ((
    <Suspense fallback={getSuspense()}>
        <PagesEdit
            {...props}
        />
    </Suspense>
));

export default () => ([(<Route
    key="pagesList"
    path="/admin/pages"
    component={getPagesList}
    exact
/>),
(<Route
    key="pagesCreate"
    path="/admin/pages/add"
    exact
    component={getPagesEdit}
/>),
(<Route
    key="pagesEdit"
    path="/admin/pages/edit/:id"
    exact
    component={getPagesEdit}
/>)]);
