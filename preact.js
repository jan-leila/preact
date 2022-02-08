
function objEqual(a, b){
    if(a == undefined && b == undefined) return true;
    if(a == undefined || b == undefined) return false;
    let a_keys = Object.keys(a);
    let b_keys = Object.keys(b);
    if(a_keys.length !== b_keys.length) return false;
    for(let key in a){
        if(typeof a[key] === 'object' || typeof b[key] === 'object'){
            if(!objEqual(a[key], b[key])){
                return false;
            }
        }
        if(a[key] !== b[key]){
            return false;
        }
    }
    return true;
}

let id_counter = 0;
class RenderContext {
    static active_context;

    constructor(context_id, container, bind_target){
        this.id = context_id;
        this.container = container;
        this.bind_target = bind_target;

        this.saves = [];

        this.state_pointer;
    }

    create_save(){
        this.saves[this.state_pointer] = this.active_node_context;
    }

    normalizeChild(child, node = {}){
        if(typeof child === 'string'){
            return child;
        }
        if(typeof child === 'function'){
            return this.normalizeChild(child({}));
        }
        let [ tag, props, children ] = child;
        if(typeof tag === 'function'){
            return this.normalizeChild(tag(props, children));
        }
        return this.createNode(node, tag, props, children);
    }

    createNode(node, tag, props, children){
        if(objEqual(props, node.props) && objEqual(children, node.children)) return node.element;

        if(node.id == undefined) node.id = id_counter++;
        if(node.states == undefined) node.states = [];
        if(node.children == undefined) node.children = [];
        if(node.effects == undefined) node.effects = [];
        
        node.element = document.createElement(tag);

        this.renderNode(node, props, children);
        return node.element;
    }

    cleanup(node){
        node.effects.forEach((cleanup) => {
            cleanup();
        });
        node.children.forEach(this.cleanup);
    }

    renderNode(node, props = {}, children = []){
        node.effect_pointer = 0;
        node.state_pointer = 0;
        for(let prop in props){
            node.element[prop] = props[prop];
        }
        // TODO: do this better so its more deterministic (keys)
        if(children.length < node.children.length){
            node.children(children.length).forEach(this.cleanup);
        }

        let child_elements = children.map((child, i) => {
            this.active_node_context = {
                node,
                props,
                children,
            };
            let child_node = node.children[i];
            if(child_node == undefined){
                child_node = {};
                node.children[i] = child;
            }
            return this.normalizeChild(child, child_node);
        });

        node.effects.forEach(({
            effect,
            run,
            cleanup,
        }, i, arr) => {
            if(run){
                if(cleanup){
                    cleanup();
                }
                arr[i].cleanup = effect();
            }
        });

        node.element.replaceChildren(...child_elements);
        return node;
    }

    render(node_context){
        RenderContext.active_context = this;

        if(node_context == undefined){
            let element = this.normalizeChild(['div', {}, [ this.bind_target ]]);
            this.container.replaceChildren(element);
        }
        else {
            let { node, props, children } = node_context;
            this.renderNode(node, props, children);
        }
    }
}

function useState(default_value){
    let context = RenderContext.active_context;

    let node_context = RenderContext.active_context.active_node_context;
    let node = node_context.node;
    let pointer = node.state_pointer;
    node.state_pointer++;

    let value = node.states[pointer] || default_value;

    let set_value = async (new_value, after) => {
        if(typeof new_value === 'function'){
            new_value = await new_value(value);
        }
        node.states[pointer] = new_value;
        context.render(node_context);
        after();
    }

    return [ value, set_value ];
}

function useEffect(effect, dependencies){
    let node = RenderContext.active_context.active_node_context.node;
    let target_effect = node.effects[node.effect_pointer] || {};
    node.effects[node.effect_pointer] = {
        effect,
        dependencies,
        run: dependencies === undefined || !objEqual(dependencies, target_effect.dependencies),
        cleanup: target_effect.cleanup,
    }
    node.effect_pointer++;
}

class Context {
    constructor(value){
        this.value = value;
        this.nodes = [];
    }

    set_value(value){
        this.value = value;
        this.nodes.forEach(({ render_context, node }) => {
            render_context.render(node);
        });
    }

    add(node){
        this.nodes.push({
            render_context: RenderContext.active_context,
            node,
        });
    }

    remove(id){
        this.nodes = this.nodes.filter(({ node }) => {
            return id !== node.id;
        });
    }
}

function useContext(context){
    let node = RenderContext.active_context.active_node_context;
    let value = context.value;
    let set_value = (value) => {
        context.set_value(value);
    }

    useEffect(() => {
        context.add(node);
        return () => {
            context.remove(node.id);
        }
    }, []);

    return [ value, set_value ];
}

let render_contexts = [];
const Preact = {
    bind(container, bind_target){
        let context_id = render_contexts.length;
        render_contexts.push(new RenderContext(context_id, container, bind_target)) - 1;
        this.render(context_id);
    },
    render(context_id, node){
        let context = render_contexts[context_id];
        
        context.render(node);
    },
}
