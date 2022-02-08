
let route_context = new Context(window.location.pathname);

function Link({ to, className }, children) {
    let [ route, set_route ] = useContext(route_context);

    return ['a', {
        onclick: () => {
            window.history.pushState(null, null, to);
            set_route(to);
        },
        className: `${className? className:''}${to.indexOf(route) !== -1?' active':''}`,
    }, children];
}

function path_regex(path) {
    return new RegExp(`^${path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
}

function route_match(path, route){
    return path_regex(path).test(route);
}

function Route({ path, active = true, onchange, element }){
    let [ route ] = useContext(route_context);
    let [ match, set_match ] = useState(false);

    useEffect(() => {
        let new_match = route_match(path, route);
        if(new_match !== match){
            set_match(new_match, (value) => {
                if(onchange){
                    onchange(value);
                }
            });
        }
    }, [ route, match, set_match ]);

    if(active && match){
        return element;
    }
}

function Routes({}, children) {
    children = children.filter((child) => {
        return Array.isArray(child) && child[0] === Route;
    });
    let [ matched_children, set_matched_children ] = useState(Array.from(new Array(children.length), () => false));

    let found_match = false;
    return [ 'div', {}, children.map(([tag, props], i) => {
            let onchange = (value) => {
                if(matched_children[i] === value){
                    return;
                }
                let matches = [...matched_children];
                matches[i] = value;
                set_matched_children(matches);
            }

            props.onchange = onchange;

            if(!found_match && matched_children[i]){
                props.active = true;
                found_match = true;
            }
            else {
                props.active = false;
            }

            return [ tag, props ];
        }),
    ]
}
