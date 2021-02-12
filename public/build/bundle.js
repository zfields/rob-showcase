
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
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
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

    /* src/components/Video.svelte generated by Svelte v3.32.1 */

    const file = "src/components/Video.svelte";

    function create_fragment(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = "https://player.twitch.tv/?video=910355935&parent=localhost&parent=rob-showcase.vercel.app")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "title", "Twitch Stream Embed");
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "scrolling", "no");
    			attr_dev(iframe, "height", "500");
    			attr_dev(iframe, "width", "100%");
    			add_location(iframe, file, 5, 2, 43);
    			attr_dev(div, "class", "video");
    			add_location(div, file, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	validate_slots("Video", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Video> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Video extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Video",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/components/Controller.svelte generated by Svelte v3.32.1 */

    const file$1 = "src/components/Controller.svelte";

    function create_fragment$1(ctx) {
    	let div30;
    	let div29;
    	let div28;
    	let div10;
    	let div9;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3;
    	let button0;
    	let div4;
    	let t4;
    	let button1;
    	let div5;
    	let t5;
    	let button2;
    	let div6;
    	let t6;
    	let button3;
    	let div7;
    	let t7;
    	let div8;
    	let t8;
    	let div19;
    	let div18;
    	let div11;
    	let t9;
    	let div12;
    	let t10;
    	let div15;
    	let div13;
    	let t12;
    	let div14;
    	let t14;
    	let div16;
    	let button4;
    	let t15;
    	let button5;
    	let t16;
    	let div17;
    	let t17;
    	let div27;
    	let div26;
    	let div20;
    	let t18;
    	let span;
    	let t20;
    	let div25;
    	let div22;
    	let button6;
    	let t21;
    	let div21;
    	let t23;
    	let div24;
    	let button7;
    	let t24;
    	let div23;

    	const block = {
    		c: function create() {
    			div30 = element("div");
    			div29 = element("div");
    			div28 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			button0 = element("button");
    			div4 = element("div");
    			t4 = space();
    			button1 = element("button");
    			div5 = element("div");
    			t5 = space();
    			button2 = element("button");
    			div6 = element("div");
    			t6 = space();
    			button3 = element("button");
    			div7 = element("div");
    			t7 = space();
    			div8 = element("div");
    			t8 = space();
    			div19 = element("div");
    			div18 = element("div");
    			div11 = element("div");
    			t9 = space();
    			div12 = element("div");
    			t10 = space();
    			div15 = element("div");
    			div13 = element("div");
    			div13.textContent = "INFO";
    			t12 = space();
    			div14 = element("div");
    			div14.textContent = "START";
    			t14 = space();
    			div16 = element("div");
    			button4 = element("button");
    			t15 = space();
    			button5 = element("button");
    			t16 = space();
    			div17 = element("div");
    			t17 = space();
    			div27 = element("div");
    			div26 = element("div");
    			div20 = element("div");
    			t18 = text("blues");
    			span = element("span");
    			span.textContent = "wireless";
    			t20 = space();
    			div25 = element("div");
    			div22 = element("div");
    			button6 = element("button");
    			t21 = space();
    			div21 = element("div");
    			div21.textContent = "A";
    			t23 = space();
    			div24 = element("div");
    			button7 = element("button");
    			t24 = space();
    			div23 = element("div");
    			div23.textContent = "B";
    			attr_dev(div0, "class", "cross-border vert");
    			add_location(div0, file$1, 11, 12, 206);
    			attr_dev(div1, "class", "cross-border hor");
    			add_location(div1, file$1, 12, 12, 256);
    			attr_dev(div2, "class", "cross vert");
    			add_location(div2, file$1, 14, 12, 306);
    			attr_dev(div3, "class", "cross hor");
    			add_location(div3, file$1, 15, 12, 349);
    			attr_dev(div4, "class", "arrow arrow-top");
    			add_location(div4, file$1, 18, 14, 441);
    			attr_dev(button0, "id", "Up");
    			attr_dev(button0, "class", "direction");
    			add_location(button0, file$1, 17, 12, 392);
    			attr_dev(div5, "class", "arrow arrow-bottom");
    			add_location(div5, file$1, 21, 14, 562);
    			attr_dev(button1, "id", "Down");
    			attr_dev(button1, "class", "direction");
    			add_location(button1, file$1, 20, 12, 511);
    			attr_dev(div6, "class", "arrow arrow-left");
    			add_location(div6, file$1, 24, 14, 686);
    			attr_dev(button2, "id", "Left");
    			attr_dev(button2, "class", "direction");
    			add_location(button2, file$1, 23, 12, 635);
    			attr_dev(div7, "class", "arrow arrow-right");
    			add_location(div7, file$1, 27, 14, 809);
    			attr_dev(button3, "id", "Right");
    			attr_dev(button3, "class", "direction");
    			add_location(button3, file$1, 26, 12, 757);
    			attr_dev(div8, "class", "circle");
    			add_location(div8, file$1, 30, 12, 882);
    			attr_dev(div9, "class", "dpad-wrapper");
    			add_location(div9, file$1, 10, 10, 167);
    			attr_dev(div10, "class", "col");
    			add_location(div10, file$1, 9, 8, 139);
    			attr_dev(div11, "class", "gray-bar first");
    			add_location(div11, file$1, 37, 12, 1012);
    			attr_dev(div12, "class", "gray-bar");
    			add_location(div12, file$1, 38, 12, 1059);
    			attr_dev(div13, "class", "label left-label");
    			add_location(div13, file$1, 40, 14, 1137);
    			attr_dev(div14, "class", "label right-label");
    			add_location(div14, file$1, 41, 14, 1192);
    			attr_dev(div15, "class", "gray-bar");
    			add_location(div15, file$1, 39, 12, 1100);
    			attr_dev(button4, "id", "Select");
    			attr_dev(button4, "class", "skinny-button select");
    			add_location(button4, file$1, 44, 14, 1307);
    			attr_dev(button5, "id", "Start");
    			attr_dev(button5, "class", "skinny-button start");
    			add_location(button5, file$1, 45, 14, 1380);
    			attr_dev(div16, "class", "gray-bar big");
    			add_location(div16, file$1, 43, 12, 1266);
    			attr_dev(div17, "class", "gray-bar last");
    			add_location(div17, file$1, 47, 12, 1468);
    			attr_dev(div18, "class", "center");
    			add_location(div18, file$1, 36, 10, 979);
    			attr_dev(div19, "class", "col");
    			add_location(div19, file$1, 35, 8, 951);
    			add_location(span, file$1, 54, 19, 1655);
    			attr_dev(div20, "class", "logo");
    			add_location(div20, file$1, 53, 12, 1617);
    			attr_dev(button6, "id", "A");
    			attr_dev(button6, "class", "button");
    			add_location(button6, file$1, 59, 16, 1786);
    			attr_dev(div21, "class", "button-letter");
    			add_location(div21, file$1, 60, 16, 1842);
    			attr_dev(div22, "class", "button-pad");
    			add_location(div22, file$1, 58, 14, 1745);
    			attr_dev(button7, "id", "B");
    			attr_dev(button7, "class", "button");
    			add_location(button7, file$1, 64, 16, 1954);
    			attr_dev(div23, "class", "button-letter");
    			add_location(div23, file$1, 65, 16, 2010);
    			attr_dev(div24, "class", "button-pad");
    			add_location(div24, file$1, 63, 14, 1913);
    			attr_dev(div25, "class", "buttons");
    			add_location(div25, file$1, 57, 12, 1709);
    			attr_dev(div26, "class", "logo-button-wrapper");
    			add_location(div26, file$1, 52, 10, 1571);
    			attr_dev(div27, "class", "col");
    			add_location(div27, file$1, 51, 8, 1543);
    			attr_dev(div28, "class", "row");
    			add_location(div28, file$1, 8, 4, 113);
    			attr_dev(div29, "class", "pad-area");
    			add_location(div29, file$1, 6, 2, 85);
    			attr_dev(div30, "class", "controller");
    			add_location(div30, file$1, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div30, anchor);
    			append_dev(div30, div29);
    			append_dev(div29, div28);
    			append_dev(div28, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div0);
    			append_dev(div9, t0);
    			append_dev(div9, div1);
    			append_dev(div9, t1);
    			append_dev(div9, div2);
    			append_dev(div9, t2);
    			append_dev(div9, div3);
    			append_dev(div9, t3);
    			append_dev(div9, button0);
    			append_dev(button0, div4);
    			append_dev(div9, t4);
    			append_dev(div9, button1);
    			append_dev(button1, div5);
    			append_dev(div9, t5);
    			append_dev(div9, button2);
    			append_dev(button2, div6);
    			append_dev(div9, t6);
    			append_dev(div9, button3);
    			append_dev(button3, div7);
    			append_dev(div9, t7);
    			append_dev(div9, div8);
    			append_dev(div28, t8);
    			append_dev(div28, div19);
    			append_dev(div19, div18);
    			append_dev(div18, div11);
    			append_dev(div18, t9);
    			append_dev(div18, div12);
    			append_dev(div18, t10);
    			append_dev(div18, div15);
    			append_dev(div15, div13);
    			append_dev(div15, t12);
    			append_dev(div15, div14);
    			append_dev(div18, t14);
    			append_dev(div18, div16);
    			append_dev(div16, button4);
    			append_dev(div16, t15);
    			append_dev(div16, button5);
    			append_dev(div18, t16);
    			append_dev(div18, div17);
    			append_dev(div28, t17);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			append_dev(div26, div20);
    			append_dev(div20, t18);
    			append_dev(div20, span);
    			append_dev(div26, t20);
    			append_dev(div26, div25);
    			append_dev(div25, div22);
    			append_dev(div22, button6);
    			append_dev(div22, t21);
    			append_dev(div22, div21);
    			append_dev(div25, t23);
    			append_dev(div25, div24);
    			append_dev(div24, button7);
    			append_dev(div24, t24);
    			append_dev(div24, div23);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div30);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Controller", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Controller> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Controller extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Controller",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.32.1 */
    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let video;
    	let t;
    	let controller;
    	let current;
    	video = new Video({ $$inline: true });
    	controller = new Controller({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(video.$$.fragment);
    			t = space();
    			create_component(controller.$$.fragment);
    			attr_dev(div, "class", "wrapper");
    			add_location(div, file$2, 5, 0, 128);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(video, div, null);
    			append_dev(div, t);
    			mount_component(controller, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(video.$$.fragment, local);
    			transition_in(controller.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(video.$$.fragment, local);
    			transition_out(controller.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(video);
    			destroy_component(controller);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Video, Controller });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
