const component = {
    type: null,
    props: {},
    text: "",
    children: [],
    eventlisteners: [],
    domRef: null,
    create: function(type, props, text, children) {
        const object = Object.create(this);
        object.type = type;
        object.props = props;
        object.text = text;
        object.children = [...children];
        object.eventlisteners = [];
        return object;
    },
    addEventListener: function(event, call) {
        this.eventlisteners.push({event, call});
        return this;
    }
}

function render(element) {
    const newE = document.createElement(element.type);
    newE.textContent = element.text;
    for (const [key, value] of Object.entries(element.props)) {
        newE.setAttribute(key, value);
    }
    if (element.children.length > 0) {
        for (let child of element.children) {
            newE.appendChild(render(child));
        }
    }
    for (let {event, call} of element.eventlisteners) {
        newE.addEventListener(event, call);
    }
    element.domRef = newE;
    return newE;
}

function rerender(virtual, parent_renderd, rendered) {
    const newE = document.createElement(virtual.type);
    newE.textContent = virtual.text;
    for (const [key, value] of Object.entries(virtual.props)) {
        newE.setAttribute(key, value);
    }
    if (virtual.children.length > 0) {
        for (let child of virtual.children) {
            newE.appendChild(render(child));
        }
    }
    for ({event, call} of virtual.eventlisteners) {
        newE.addEventListener(event, call);
    }
    virtual.domRef = newE;
    parent_renderd.insertBefore(newE, rendered);
    rendered.remove()
}

//export {component, listComponent, render, rerender}