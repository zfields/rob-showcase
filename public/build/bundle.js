
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.32.1 */

    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div32;
    	let div0;
    	let iframe;
    	let iframe_src_value;
    	let t0;
    	let div31;
    	let div30;
    	let div29;
    	let div11;
    	let div10;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3;
    	let div4;
    	let t4;
    	let button0;
    	let div5;
    	let t5;
    	let button1;
    	let div6;
    	let t6;
    	let button2;
    	let div7;
    	let t7;
    	let button3;
    	let div8;
    	let t8;
    	let div9;
    	let t9;
    	let div20;
    	let div19;
    	let div12;
    	let t10;
    	let div13;
    	let t11;
    	let div16;
    	let div14;
    	let t13;
    	let div15;
    	let t15;
    	let div17;
    	let button4;
    	let t16;
    	let button5;
    	let t17;
    	let div18;
    	let t18;
    	let div28;
    	let div27;
    	let div21;
    	let t19;
    	let span;
    	let t21;
    	let div26;
    	let div23;
    	let button6;
    	let t22;
    	let div22;
    	let t24;
    	let div25;
    	let button7;
    	let t25;
    	let div24;

    	const block = {
    		c: function create() {
    			div32 = element("div");
    			div0 = element("div");
    			iframe = element("iframe");
    			t0 = space();
    			div31 = element("div");
    			div30 = element("div");
    			div29 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");
    			t4 = space();
    			button0 = element("button");
    			div5 = element("div");
    			t5 = space();
    			button1 = element("button");
    			div6 = element("div");
    			t6 = space();
    			button2 = element("button");
    			div7 = element("div");
    			t7 = space();
    			button3 = element("button");
    			div8 = element("div");
    			t8 = space();
    			div9 = element("div");
    			t9 = space();
    			div20 = element("div");
    			div19 = element("div");
    			div12 = element("div");
    			t10 = space();
    			div13 = element("div");
    			t11 = space();
    			div16 = element("div");
    			div14 = element("div");
    			div14.textContent = "INFO";
    			t13 = space();
    			div15 = element("div");
    			div15.textContent = "START";
    			t15 = space();
    			div17 = element("div");
    			button4 = element("button");
    			t16 = space();
    			button5 = element("button");
    			t17 = space();
    			div18 = element("div");
    			t18 = space();
    			div28 = element("div");
    			div27 = element("div");
    			div21 = element("div");
    			t19 = text("blues");
    			span = element("span");
    			span.textContent = "wireless";
    			t21 = space();
    			div26 = element("div");
    			div23 = element("div");
    			button6 = element("button");
    			t22 = space();
    			div22 = element("div");
    			div22.textContent = "A";
    			t24 = space();
    			div25 = element("div");
    			button7 = element("button");
    			t25 = space();
    			div24 = element("div");
    			div24.textContent = "B";
    			if (iframe.src !== (iframe_src_value = "https://player.twitch.tv/?video=910355935&parent=localhost")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "scrolling", "no");
    			attr_dev(iframe, "height", "500");
    			attr_dev(iframe, "width", "100%");
    			add_location(iframe, file, 5, 4, 68);
    			attr_dev(div0, "class", "video");
    			add_location(div0, file, 4, 2, 44);
    			attr_dev(div1, "class", "cross-border vert");
    			add_location(div1, file, 15, 14, 440);
    			attr_dev(div2, "class", "cross-border hor");
    			add_location(div2, file, 16, 14, 492);
    			attr_dev(div3, "class", "cross vert");
    			add_location(div3, file, 18, 14, 544);
    			attr_dev(div4, "class", "cross hor");
    			add_location(div4, file, 19, 14, 589);
    			attr_dev(div5, "class", "arrow arrow-top");
    			add_location(div5, file, 22, 16, 685);
    			attr_dev(button0, "id", "Up");
    			attr_dev(button0, "class", "direction");
    			add_location(button0, file, 21, 14, 634);
    			attr_dev(div6, "class", "arrow arrow-bottom");
    			add_location(div6, file, 25, 16, 812);
    			attr_dev(button1, "id", "Down");
    			attr_dev(button1, "class", "direction");
    			add_location(button1, file, 24, 14, 759);
    			attr_dev(div7, "class", "arrow arrow-left");
    			add_location(div7, file, 28, 16, 942);
    			attr_dev(button2, "id", "Left");
    			attr_dev(button2, "class", "direction");
    			add_location(button2, file, 27, 14, 889);
    			attr_dev(div8, "class", "arrow arrow-right");
    			add_location(div8, file, 31, 16, 1071);
    			attr_dev(button3, "id", "Right");
    			attr_dev(button3, "class", "direction");
    			add_location(button3, file, 30, 14, 1017);
    			attr_dev(div9, "class", "circle");
    			add_location(div9, file, 34, 14, 1148);
    			attr_dev(div10, "class", "dpad-wrapper");
    			add_location(div10, file, 14, 12, 399);
    			attr_dev(div11, "class", "col");
    			add_location(div11, file, 13, 10, 369);
    			attr_dev(div12, "class", "gray-bar first");
    			add_location(div12, file, 41, 14, 1288);
    			attr_dev(div13, "class", "gray-bar");
    			add_location(div13, file, 42, 14, 1337);
    			attr_dev(div14, "class", "label left-label");
    			add_location(div14, file, 44, 16, 1419);
    			attr_dev(div15, "class", "label right-label");
    			add_location(div15, file, 45, 16, 1476);
    			attr_dev(div16, "class", "gray-bar");
    			add_location(div16, file, 43, 14, 1380);
    			attr_dev(button4, "id", "Select");
    			attr_dev(button4, "class", "skinny-button select");
    			add_location(button4, file, 48, 16, 1597);
    			attr_dev(button5, "id", "Start");
    			attr_dev(button5, "class", "skinny-button start");
    			add_location(button5, file, 49, 16, 1672);
    			attr_dev(div17, "class", "gray-bar big");
    			add_location(div17, file, 47, 14, 1554);
    			attr_dev(div18, "class", "gray-bar last");
    			add_location(div18, file, 51, 14, 1764);
    			attr_dev(div19, "class", "center");
    			add_location(div19, file, 40, 12, 1253);
    			attr_dev(div20, "class", "col");
    			add_location(div20, file, 39, 10, 1223);
    			add_location(span, file, 58, 21, 1963);
    			attr_dev(div21, "class", "logo");
    			add_location(div21, file, 57, 14, 1923);
    			attr_dev(button6, "id", "A");
    			attr_dev(button6, "class", "button");
    			add_location(button6, file, 63, 18, 2102);
    			attr_dev(div22, "class", "button-letter");
    			add_location(div22, file, 64, 18, 2160);
    			attr_dev(div23, "class", "button-pad");
    			add_location(div23, file, 62, 16, 2059);
    			attr_dev(button7, "id", "B");
    			attr_dev(button7, "class", "button");
    			add_location(button7, file, 68, 18, 2278);
    			attr_dev(div24, "class", "button-letter");
    			add_location(div24, file, 69, 18, 2336);
    			attr_dev(div25, "class", "button-pad");
    			add_location(div25, file, 67, 16, 2235);
    			attr_dev(div26, "class", "buttons");
    			add_location(div26, file, 61, 14, 2021);
    			attr_dev(div27, "class", "logo-button-wrapper");
    			add_location(div27, file, 56, 12, 1875);
    			attr_dev(div28, "class", "col");
    			add_location(div28, file, 55, 10, 1845);
    			attr_dev(div29, "class", "row");
    			add_location(div29, file, 12, 6, 341);
    			attr_dev(div30, "class", "pad-area");
    			add_location(div30, file, 10, 4, 311);
    			attr_dev(div31, "class", "controller");
    			add_location(div31, file, 8, 2, 243);
    			attr_dev(div32, "class", "wrapper");
    			add_location(div32, file, 3, 0, 20);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div32, anchor);
    			append_dev(div32, div0);
    			append_dev(div0, iframe);
    			append_dev(div32, t0);
    			append_dev(div32, div31);
    			append_dev(div31, div30);
    			append_dev(div30, div29);
    			append_dev(div29, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div1);
    			append_dev(div10, t1);
    			append_dev(div10, div2);
    			append_dev(div10, t2);
    			append_dev(div10, div3);
    			append_dev(div10, t3);
    			append_dev(div10, div4);
    			append_dev(div10, t4);
    			append_dev(div10, button0);
    			append_dev(button0, div5);
    			append_dev(div10, t5);
    			append_dev(div10, button1);
    			append_dev(button1, div6);
    			append_dev(div10, t6);
    			append_dev(div10, button2);
    			append_dev(button2, div7);
    			append_dev(div10, t7);
    			append_dev(div10, button3);
    			append_dev(button3, div8);
    			append_dev(div10, t8);
    			append_dev(div10, div9);
    			append_dev(div29, t9);
    			append_dev(div29, div20);
    			append_dev(div20, div19);
    			append_dev(div19, div12);
    			append_dev(div19, t10);
    			append_dev(div19, div13);
    			append_dev(div19, t11);
    			append_dev(div19, div16);
    			append_dev(div16, div14);
    			append_dev(div16, t13);
    			append_dev(div16, div15);
    			append_dev(div19, t15);
    			append_dev(div19, div17);
    			append_dev(div17, button4);
    			append_dev(div17, t16);
    			append_dev(div17, button5);
    			append_dev(div19, t17);
    			append_dev(div19, div18);
    			append_dev(div29, t18);
    			append_dev(div29, div28);
    			append_dev(div28, div27);
    			append_dev(div27, div21);
    			append_dev(div21, t19);
    			append_dev(div21, span);
    			append_dev(div27, t21);
    			append_dev(div27, div26);
    			append_dev(div26, div23);
    			append_dev(div23, button6);
    			append_dev(div23, t22);
    			append_dev(div23, div22);
    			append_dev(div26, t24);
    			append_dev(div26, div25);
    			append_dev(div25, button7);
    			append_dev(div25, t25);
    			append_dev(div25, div24);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div32);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
