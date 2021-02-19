
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
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
    			if (iframe.src !== (iframe_src_value = "https://player.twitch.tv/?channel=nesroblive&parent=localhost&parent=rob-showcase.vercel.app")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "title", "Twitch Stream Embed");
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "scrolling", "no");
    			attr_dev(iframe, "height", "500");
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "class", "svelte-ch03ml");
    			add_location(iframe, file, 5, 2, 43);
    			attr_dev(div, "class", "video svelte-ch03ml");
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

    const { console: console_1 } = globals;
    const file$1 = "src/components/Controller.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let t2;
    	let t3;
    	let div32;
    	let div31;
    	let div30;
    	let div12;
    	let div11;
    	let div2;
    	let t4;
    	let div3;
    	let t5;
    	let div4;
    	let t6;
    	let div5;
    	let t7;
    	let button0;
    	let div6;
    	let t8;
    	let button1;
    	let div7;
    	let t9;
    	let button2;
    	let div8;
    	let t10;
    	let button3;
    	let div9;
    	let t11;
    	let div10;
    	let t12;
    	let div21;
    	let div20;
    	let div13;
    	let t13;
    	let div14;
    	let t14;
    	let div17;
    	let div15;
    	let t16;
    	let div16;
    	let t18;
    	let div18;
    	let button4;
    	let t19;
    	let button5;
    	let t20;
    	let div19;
    	let t21;
    	let div29;
    	let div28;
    	let div22;
    	let t22;
    	let span;
    	let t24;
    	let div27;
    	let div24;
    	let button6;
    	let t25;
    	let div23;
    	let t27;
    	let div26;
    	let button7;
    	let t28;
    	let div25;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Last R.O.B. Command";
    			t1 = space();
    			p1 = element("p");
    			t2 = text(/*last_command*/ ctx[0]);
    			t3 = space();
    			div32 = element("div");
    			div31 = element("div");
    			div30 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div2 = element("div");
    			t4 = space();
    			div3 = element("div");
    			t5 = space();
    			div4 = element("div");
    			t6 = space();
    			div5 = element("div");
    			t7 = space();
    			button0 = element("button");
    			div6 = element("div");
    			t8 = space();
    			button1 = element("button");
    			div7 = element("div");
    			t9 = space();
    			button2 = element("button");
    			div8 = element("div");
    			t10 = space();
    			button3 = element("button");
    			div9 = element("div");
    			t11 = space();
    			div10 = element("div");
    			t12 = space();
    			div21 = element("div");
    			div20 = element("div");
    			div13 = element("div");
    			t13 = space();
    			div14 = element("div");
    			t14 = space();
    			div17 = element("div");
    			div15 = element("div");
    			div15.textContent = "INFO";
    			t16 = space();
    			div16 = element("div");
    			div16.textContent = "START";
    			t18 = space();
    			div18 = element("div");
    			button4 = element("button");
    			t19 = space();
    			button5 = element("button");
    			t20 = space();
    			div19 = element("div");
    			t21 = space();
    			div29 = element("div");
    			div28 = element("div");
    			div22 = element("div");
    			t22 = text("blues");
    			span = element("span");
    			span.textContent = "wireless";
    			t24 = space();
    			div27 = element("div");
    			div24 = element("div");
    			button6 = element("button");
    			t25 = space();
    			div23 = element("div");
    			div23.textContent = "A";
    			t27 = space();
    			div26 = element("div");
    			button7 = element("button");
    			t28 = space();
    			div25 = element("div");
    			div25.textContent = "B";
    			attr_dev(p0, "class", "title svelte-1vqld1m");
    			add_location(p0, file$1, 21, 4, 529);
    			attr_dev(p1, "class", "command svelte-1vqld1m");
    			add_location(p1, file$1, 24, 4, 586);
    			attr_dev(div0, "class", "result svelte-1vqld1m");
    			add_location(div0, file$1, 20, 2, 504);
    			attr_dev(div1, "class", "result-wrapper svelte-1vqld1m");
    			add_location(div1, file$1, 19, 0, 473);
    			attr_dev(div2, "class", "cross-border vert svelte-1vqld1m");
    			add_location(div2, file$1, 34, 12, 789);
    			attr_dev(div3, "class", "cross-border hor svelte-1vqld1m");
    			add_location(div3, file$1, 35, 12, 839);
    			attr_dev(div4, "class", "cross vert svelte-1vqld1m");
    			add_location(div4, file$1, 37, 12, 889);
    			attr_dev(div5, "class", "cross hor svelte-1vqld1m");
    			add_location(div5, file$1, 38, 12, 932);
    			attr_dev(div6, "class", "arrow arrow-top svelte-1vqld1m");
    			add_location(div6, file$1, 42, 16, 1078);
    			attr_dev(button0, "id", "Up");
    			attr_dev(button0, "class", "direction svelte-1vqld1m");
    			add_location(button0, file$1, 40, 12, 975);
    			attr_dev(div7, "class", "arrow arrow-bottom svelte-1vqld1m");
    			add_location(div7, file$1, 46, 14, 1251);
    			attr_dev(button1, "id", "Down");
    			attr_dev(button1, "class", "direction svelte-1vqld1m");
    			add_location(button1, file$1, 44, 12, 1148);
    			attr_dev(div8, "class", "arrow arrow-left svelte-1vqld1m");
    			add_location(div8, file$1, 50, 14, 1426);
    			attr_dev(button2, "id", "Left");
    			attr_dev(button2, "class", "direction svelte-1vqld1m");
    			add_location(button2, file$1, 48, 12, 1324);
    			attr_dev(div9, "class", "arrow arrow-right svelte-1vqld1m");
    			add_location(div9, file$1, 54, 14, 1601);
    			attr_dev(button3, "id", "Right");
    			attr_dev(button3, "class", "direction svelte-1vqld1m");
    			add_location(button3, file$1, 52, 12, 1497);
    			attr_dev(div10, "class", "circle svelte-1vqld1m");
    			add_location(div10, file$1, 57, 12, 1674);
    			attr_dev(div11, "class", "dpad-wrapper svelte-1vqld1m");
    			add_location(div11, file$1, 33, 10, 750);
    			attr_dev(div12, "class", "col svelte-1vqld1m");
    			add_location(div12, file$1, 32, 8, 722);
    			attr_dev(div13, "class", "gray-bar first svelte-1vqld1m");
    			add_location(div13, file$1, 64, 12, 1804);
    			attr_dev(div14, "class", "gray-bar svelte-1vqld1m");
    			add_location(div14, file$1, 65, 12, 1851);
    			attr_dev(div15, "class", "label left-label svelte-1vqld1m");
    			add_location(div15, file$1, 67, 14, 1929);
    			attr_dev(div16, "class", "label right-label svelte-1vqld1m");
    			add_location(div16, file$1, 68, 14, 1984);
    			attr_dev(div17, "class", "gray-bar svelte-1vqld1m");
    			add_location(div17, file$1, 66, 12, 1892);
    			attr_dev(button4, "id", "Select");
    			attr_dev(button4, "class", "skinny-button select svelte-1vqld1m");
    			add_location(button4, file$1, 71, 14, 2099);
    			attr_dev(button5, "id", "Start");
    			attr_dev(button5, "class", "skinny-button start svelte-1vqld1m");
    			add_location(button5, file$1, 72, 14, 2172);
    			attr_dev(div18, "class", "gray-bar big svelte-1vqld1m");
    			add_location(div18, file$1, 70, 12, 2058);
    			attr_dev(div19, "class", "gray-bar last svelte-1vqld1m");
    			add_location(div19, file$1, 75, 12, 2320);
    			attr_dev(div20, "class", "center svelte-1vqld1m");
    			add_location(div20, file$1, 63, 10, 1771);
    			attr_dev(div21, "class", "col svelte-1vqld1m");
    			add_location(div21, file$1, 62, 8, 1743);
    			attr_dev(span, "class", "svelte-1vqld1m");
    			add_location(span, file$1, 82, 19, 2507);
    			attr_dev(div22, "class", "logo svelte-1vqld1m");
    			add_location(div22, file$1, 81, 12, 2469);
    			attr_dev(button6, "id", "A");
    			attr_dev(button6, "class", "button svelte-1vqld1m");
    			add_location(button6, file$1, 87, 16, 2638);
    			attr_dev(div23, "class", "button-letter svelte-1vqld1m");
    			add_location(div23, file$1, 89, 16, 2749);
    			attr_dev(div24, "class", "button-pad svelte-1vqld1m");
    			add_location(div24, file$1, 86, 14, 2597);
    			attr_dev(button7, "id", "B");
    			attr_dev(button7, "class", "button svelte-1vqld1m");
    			add_location(button7, file$1, 93, 16, 2861);
    			attr_dev(div25, "class", "button-letter svelte-1vqld1m");
    			add_location(div25, file$1, 95, 16, 2973);
    			attr_dev(div26, "class", "button-pad svelte-1vqld1m");
    			add_location(div26, file$1, 92, 14, 2820);
    			attr_dev(div27, "class", "buttons");
    			add_location(div27, file$1, 85, 12, 2561);
    			attr_dev(div28, "class", "logo-button-wrapper svelte-1vqld1m");
    			add_location(div28, file$1, 80, 10, 2423);
    			attr_dev(div29, "class", "col svelte-1vqld1m");
    			add_location(div29, file$1, 79, 8, 2395);
    			attr_dev(div30, "class", "row svelte-1vqld1m");
    			add_location(div30, file$1, 31, 4, 696);
    			attr_dev(div31, "class", "pad-area svelte-1vqld1m");
    			add_location(div31, file$1, 29, 2, 668);
    			attr_dev(div32, "class", "controller svelte-1vqld1m");
    			add_location(div32, file$1, 28, 0, 641);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div32, anchor);
    			append_dev(div32, div31);
    			append_dev(div31, div30);
    			append_dev(div30, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div2);
    			append_dev(div11, t4);
    			append_dev(div11, div3);
    			append_dev(div11, t5);
    			append_dev(div11, div4);
    			append_dev(div11, t6);
    			append_dev(div11, div5);
    			append_dev(div11, t7);
    			append_dev(div11, button0);
    			append_dev(button0, div6);
    			append_dev(div11, t8);
    			append_dev(div11, button1);
    			append_dev(button1, div7);
    			append_dev(div11, t9);
    			append_dev(div11, button2);
    			append_dev(button2, div8);
    			append_dev(div11, t10);
    			append_dev(div11, button3);
    			append_dev(button3, div9);
    			append_dev(div11, t11);
    			append_dev(div11, div10);
    			append_dev(div30, t12);
    			append_dev(div30, div21);
    			append_dev(div21, div20);
    			append_dev(div20, div13);
    			append_dev(div20, t13);
    			append_dev(div20, div14);
    			append_dev(div20, t14);
    			append_dev(div20, div17);
    			append_dev(div17, div15);
    			append_dev(div17, t16);
    			append_dev(div17, div16);
    			append_dev(div20, t18);
    			append_dev(div20, div18);
    			append_dev(div18, button4);
    			append_dev(div18, t19);
    			append_dev(div18, button5);
    			append_dev(div20, t20);
    			append_dev(div20, div19);
    			append_dev(div30, t21);
    			append_dev(div30, div29);
    			append_dev(div29, div28);
    			append_dev(div28, div22);
    			append_dev(div22, t22);
    			append_dev(div22, span);
    			append_dev(div28, t24);
    			append_dev(div28, div27);
    			append_dev(div27, div24);
    			append_dev(div24, button6);
    			append_dev(div24, t25);
    			append_dev(div24, div23);
    			append_dev(div27, t27);
    			append_dev(div27, div26);
    			append_dev(div26, button7);
    			append_dev(div26, t28);
    			append_dev(div26, div25);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[3], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[4], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[5], false, false, false),
    					listen_dev(button5, "click", /*click_handler_4*/ ctx[6], false, false, false),
    					listen_dev(button6, "click", /*click_handler_5*/ ctx[7], false, false, false),
    					listen_dev(button7, "click", /*click_handler_6*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*last_command*/ 1) set_data_dev(t2, /*last_command*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div32);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Controller", slots, []);
    	let result = null;
    	let last_command = "";

    	const sendCommand = async command => {
    		const res = await fetch(API_URL, {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({ command })
    		});

    		const json = await res.json();
    		result = JSON.stringify(json);
    		console.log(`Sent ${command}: ${result}`);
    		$$invalidate(0, last_command = command);
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
    		last_command,
    		sendCommand
    	});

    	$$self.$inject_state = $$props => {
    		if ("result" in $$props) result = $$props.result;
    		if ("last_command" in $$props) $$invalidate(0, last_command = $$props.last_command);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		last_command,
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
