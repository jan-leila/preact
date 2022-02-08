
function App() {

    let [value, set_value] = useState(0);
    let [value2, set_value2] = useState(0);

    useEffect(() => {
        console.log('render');
    });

    useEffect(() => {
        console.log('only on 2');
        return () => {
            console.log('cleanup 2');
        }
    }, [value2]);

    return ['div', {}, [
        ['button', {
            onclick: () => {
                set_value(value + 1);
            },
        }, ['click me']],
        ['div', {}, [`${value}`]],
        ['button', {
            onclick: () => {
                set_value2(value2 + 1);
            },
        }, ['click me']],
        ['div', {}, [`${value2}`]],
    ]];
}

Preact.bind(root, App);