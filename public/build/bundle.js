
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const actions = writable([]);

    /* src/components/Video.svelte generated by Svelte v3.32.1 */
    const file = "src/components/Video.svelte";

    function create_fragment(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let p;
    	let t1;
    	let div0;
    	let ol;
    	let li0;
    	let t3;
    	let li1;
    	let t5;
    	let li2;
    	let t7;
    	let li3;
    	let t9;
    	let li4;
    	let t11;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "Commands";
    			t1 = space();
    			div0 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			li0.textContent = "Left";
    			t3 = space();
    			li1 = element("li");
    			li1.textContent = "Right";
    			t5 = space();
    			li2 = element("li");
    			li2.textContent = "Up";
    			t7 = space();
    			li3 = element("li");
    			li3.textContent = "Down";
    			t9 = space();
    			li4 = element("li");
    			li4.textContent = "Close";
    			t11 = space();
    			iframe = element("iframe");
    			attr_dev(p, "class", "title svelte-1dphutz");
    			add_location(p, file, 15, 6, 321);
    			attr_dev(li0, "class", "done svelte-1dphutz");
    			add_location(li0, file, 21, 10, 476);
    			attr_dev(li1, "class", "done svelte-1dphutz");
    			add_location(li1, file, 22, 10, 513);
    			attr_dev(li2, "class", " svelte-1dphutz");
    			add_location(li2, file, 23, 10, 551);
    			attr_dev(li3, "class", " svelte-1dphutz");
    			add_location(li3, file, 24, 10, 582);
    			attr_dev(li4, "class", " svelte-1dphutz");
    			add_location(li4, file, 25, 10, 615);
    			attr_dev(ol, "class", "svelte-1dphutz");
    			add_location(ol, file, 20, 8, 461);
    			attr_dev(div0, "class", "command-list svelte-1dphutz");
    			add_location(div0, file, 19, 6, 426);
    			attr_dev(div1, "class", "result svelte-1dphutz");
    			add_location(div1, file, 14, 4, 294);
    			attr_dev(div2, "class", "result-wrapper svelte-1dphutz");
    			add_location(div2, file, 13, 2, 261);
    			if (iframe.src !== (iframe_src_value = "https://player.twitch.tv/?channel=nesroblive&parent=localhost&parent=rob-showcase.vercel.app")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "title", "Twitch Stream Embed");
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "scrolling", "no");
    			attr_dev(iframe, "height", "500");
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "class", "svelte-1dphutz");
    			add_location(iframe, file, 31, 2, 689);
    			attr_dev(div3, "class", "video svelte-1dphutz");
    			add_location(div3, file, 11, 0, 238);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, ol);
    			append_dev(ol, li0);
    			append_dev(ol, t3);
    			append_dev(ol, li1);
    			append_dev(ol, t5);
    			append_dev(ol, li2);
    			append_dev(ol, t7);
    			append_dev(ol, li3);
    			append_dev(ol, t9);
    			append_dev(ol, li4);
    			append_dev(div3, t11);
    			append_dev(div3, iframe);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Video", slots, []);
    	let last_command = "";

    	actions.subscribe(updatedActions => {
    		if (updatedActions.length > 0) {
    			last_command = updatedActions[updatedActions.length - 1];
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Video> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ actions, last_command });

    	$$self.$inject_state = $$props => {
    		if ("last_command" in $$props) last_command = $$props.last_command;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

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

    const { console: console_1 } = globals;
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
    	let a;
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
    	let mounted;
    	let dispose;

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
    			div14.textContent = "RECALIBRATE";
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
    			a = element("a");
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
    			attr_dev(div0, "class", "cross-border vert svelte-r8jti7");
    			add_location(div0, file$1, 31, 12, 726);
    			attr_dev(div1, "class", "cross-border hor svelte-r8jti7");
    			add_location(div1, file$1, 32, 12, 776);
    			attr_dev(div2, "class", "cross vert svelte-r8jti7");
    			add_location(div2, file$1, 34, 12, 826);
    			attr_dev(div3, "class", "cross hor svelte-r8jti7");
    			add_location(div3, file$1, 35, 12, 869);
    			attr_dev(div4, "class", "arrow arrow-top svelte-r8jti7");
    			add_location(div4, file$1, 39, 16, 1015);
    			attr_dev(button0, "id", "Up");
    			attr_dev(button0, "class", "direction svelte-r8jti7");
    			add_location(button0, file$1, 37, 12, 912);
    			attr_dev(div5, "class", "arrow arrow-bottom svelte-r8jti7");
    			add_location(div5, file$1, 43, 14, 1188);
    			attr_dev(button1, "id", "Down");
    			attr_dev(button1, "class", "direction svelte-r8jti7");
    			add_location(button1, file$1, 41, 12, 1085);
    			attr_dev(div6, "class", "arrow arrow-left svelte-r8jti7");
    			add_location(div6, file$1, 47, 14, 1363);
    			attr_dev(button2, "id", "Left");
    			attr_dev(button2, "class", "direction svelte-r8jti7");
    			add_location(button2, file$1, 45, 12, 1261);
    			attr_dev(div7, "class", "arrow arrow-right svelte-r8jti7");
    			add_location(div7, file$1, 51, 14, 1538);
    			attr_dev(button3, "id", "Right");
    			attr_dev(button3, "class", "direction svelte-r8jti7");
    			add_location(button3, file$1, 49, 12, 1434);
    			attr_dev(div8, "class", "circle svelte-r8jti7");
    			add_location(div8, file$1, 54, 12, 1611);
    			attr_dev(div9, "class", "dpad-wrapper svelte-r8jti7");
    			add_location(div9, file$1, 30, 10, 687);
    			attr_dev(div10, "class", "col svelte-r8jti7");
    			add_location(div10, file$1, 29, 8, 659);
    			attr_dev(div11, "class", "gray-bar first svelte-r8jti7");
    			add_location(div11, file$1, 61, 12, 1741);
    			attr_dev(div12, "class", "gray-bar svelte-r8jti7");
    			add_location(div12, file$1, 62, 12, 1788);
    			attr_dev(div13, "class", "label left-label svelte-r8jti7");
    			add_location(div13, file$1, 64, 14, 1866);
    			attr_dev(div14, "class", "label right-label svelte-r8jti7");
    			add_location(div14, file$1, 65, 14, 1921);
    			attr_dev(div15, "class", "gray-bar svelte-r8jti7");
    			add_location(div15, file$1, 63, 12, 1829);
    			attr_dev(button4, "id", "Select");
    			attr_dev(button4, "class", "skinny-button select svelte-r8jti7");
    			add_location(button4, file$1, 68, 14, 2042);
    			attr_dev(button5, "id", "Start");
    			attr_dev(button5, "class", "skinny-button start svelte-r8jti7");
    			add_location(button5, file$1, 69, 14, 2115);
    			attr_dev(div16, "class", "gray-bar big svelte-r8jti7");
    			add_location(div16, file$1, 67, 12, 2001);
    			attr_dev(div17, "class", "gray-bar last svelte-r8jti7");
    			add_location(div17, file$1, 72, 12, 2263);
    			attr_dev(div18, "class", "center svelte-r8jti7");
    			add_location(div18, file$1, 60, 10, 1708);
    			attr_dev(div19, "class", "col svelte-r8jti7");
    			add_location(div19, file$1, 59, 8, 1680);
    			attr_dev(span, "class", "svelte-r8jti7");
    			add_location(span, file$1, 79, 46, 2477);
    			attr_dev(a, "href", "https://blues.io");
    			attr_dev(a, "class", "svelte-r8jti7");
    			add_location(a, file$1, 79, 14, 2445);
    			attr_dev(div20, "class", "logo svelte-r8jti7");
    			add_location(div20, file$1, 78, 12, 2412);
    			attr_dev(button6, "id", "A");
    			attr_dev(button6, "class", "button svelte-r8jti7");
    			add_location(button6, file$1, 84, 16, 2612);
    			attr_dev(div21, "class", "button-letter svelte-r8jti7");
    			add_location(div21, file$1, 86, 16, 2723);
    			attr_dev(div22, "class", "button-pad svelte-r8jti7");
    			add_location(div22, file$1, 83, 14, 2571);
    			attr_dev(button7, "id", "B");
    			attr_dev(button7, "class", "button svelte-r8jti7");
    			add_location(button7, file$1, 90, 16, 2835);
    			attr_dev(div23, "class", "button-letter svelte-r8jti7");
    			add_location(div23, file$1, 92, 16, 2947);
    			attr_dev(div24, "class", "button-pad svelte-r8jti7");
    			add_location(div24, file$1, 89, 14, 2794);
    			attr_dev(div25, "class", "buttons");
    			add_location(div25, file$1, 82, 12, 2535);
    			attr_dev(div26, "class", "logo-button-wrapper svelte-r8jti7");
    			add_location(div26, file$1, 77, 10, 2366);
    			attr_dev(div27, "class", "col svelte-r8jti7");
    			add_location(div27, file$1, 76, 8, 2338);
    			attr_dev(div28, "class", "row svelte-r8jti7");
    			add_location(div28, file$1, 28, 4, 633);
    			attr_dev(div29, "class", "pad-area svelte-r8jti7");
    			add_location(div29, file$1, 26, 2, 605);
    			attr_dev(div30, "class", "controller svelte-r8jti7");
    			add_location(div30, file$1, 25, 0, 578);
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
    			append_dev(div20, a);
    			append_dev(a, t18);
    			append_dev(a, span);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[3], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[4], false, false, false),
    					listen_dev(button5, "click", /*click_handler_4*/ ctx[5], false, false, false),
    					listen_dev(button6, "click", /*click_handler_5*/ ctx[6], false, false, false),
    					listen_dev(button7, "click", /*click_handler_6*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div30);
    			mounted = false;
    			run_all(dispose);
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

    const API_URL = "https://rob-proxy.vercel.app/api";

    function instance$1($$self, $$props, $$invalidate) {
    	let $actions;
    	validate_store(actions, "actions");
    	component_subscribe($$self, actions, $$value => $$invalidate(9, $actions = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Controller", slots, []);
    	let result = null;

    	const addToActionList = command => {
    		set_store_value(actions, $actions = [...$actions, command], $actions);
    	};

    	const sendCommand = async command => {
    		const res = await fetch(API_URL, {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({ command })
    		});

    		const json = await res.json();
    		result = JSON.stringify(json);
    		console.log(`Sent ${command}: ${result}`);
    		addToActionList(command);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Controller> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => sendCommand("raise");
    	const click_handler_1 = () => sendCommand("lower");
    	const click_handler_2 = () => sendCommand("left");
    	const click_handler_3 = () => sendCommand("right");
    	const click_handler_4 = () => sendCommand("recalibrate");
    	const click_handler_5 = () => sendCommand("open");
    	const click_handler_6 = () => sendCommand("close");

    	$$self.$capture_state = () => ({
    		API_URL,
    		result,
    		actions,
    		addToActionList,
    		sendCommand,
    		$actions
    	});

    	$$self.$inject_state = $$props => {
    		if ("result" in $$props) result = $$props.result;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		sendCommand,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6
    	];
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
