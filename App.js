
function App() {

    return ['div', {}, [
        [Routes, {}, [
            [Route, {
                path: '/1',
                element: [ 'div', {}, [ 'page 1' ]],
            }],
            [Route, {
                path: '/2',
                element: [ 'div', {}, [ 'page 2' ]],
            }],
            [Route, {
                path: '/3',
                element: [ 'div', {}, [ 'page 3' ]],
            }],
            [Route, {
                path: '*',
                element: [ 'div', {}, [ 'wild card' ]],
            }],
        ]],
        [Link, { to: '/1' }, [ 'link1' ]],
        [Link, { to: '/2' }, [ 'link2' ]],
        [Link, { to: '/3' }, [ 'link3' ]],
        [Link, { to: '/' }, [ 'root' ]],
        [Link, { to: '/wow/this/is/cool' }, [ 'some random place' ]],
    ]];
}

Preact.bind(root, App);