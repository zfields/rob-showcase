<script>
    const LOCAL_DEV = false;
    let API_URL;
    let GET_URL;
    let ORIGIN_URL;

    if (LOCAL_DEV) {
        API_URL = "http://localhost:3000/api";
        GET_URL = "http://localhost:3000/api?";
        ORIGIN_URL = "http://localhost:3000"
    } else {
        API_URL = "https://rob-proxy.vercel.app/api";
        GET_URL = "https://rob-proxy.vercel.app/api?";
        ORIGIN_URL = "https://nesrob.live"
    }

    let result = null;
    import { actions } from "../store.js";

    const addToActionList = (command) => {
        const index = $actions.length;
        $actions = [...$actions, command];
        return index;
    };

    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    const generateUUID = () => {
        // Public Domain/MIT
        var d = new Date().getTime(); // Timestamp
        var d2 =
            (performance && performance.now && performance.now() * 1000) || 0; // Time in microseconds since page-load or 0 if unsupported
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
                var r = Math.random() * 16; // random number between 0 and 16
                if (d > 0) {
                    // Use timestamp until depleted
                    r = (d + r) % 16 | 0;
                    d = Math.floor(d / 16);
                } else {
                    // Use microseconds since page-load if supported
                    r = (d2 + r) % 16 | 0;
                    d2 = Math.floor(d2 / 16);
                }
                return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
            }
        );
    };

    const poll = async (fn, timeout_ms, interval_ms) => {
        const endTime = Number(new Date()) + (timeout_ms || 3000);
        interval_ms = interval_ms || 100;

        const checkCondition = async (resolve, reject) => {
            // If the condition is met, then we're done!
            try {
                const result = await fn();
                if (result) {
                    resolve(result);
                }
                // If the timeout hasn't elapsed, then go again.
                else if (Number(new Date()) < endTime) {
                    setTimeout(checkCondition, interval_ms, resolve, reject);
                }
                // Didn't match and too much time, reject!
                else {
                    reject(new Error("timed out for " + fn + ": " + arguments));
                }
            } catch (error) {
                console.log(error);
                reject(new Error("Throw occured in " + fn + ": " + arguments));
            }
        };

        return new Promise(checkCondition);
    };

    const sendCommand = async (command) => {
        // Create command object
        var cmdObj = {
            guid: generateUUID(),
            command: command,
            status: "REQUESTED",
        };

        // Send request to proxy service
        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cmdObj),
        })
            .then((response) => response.json())
            .then((data) => {
                result = JSON.stringify(data);
                console.log(
                    "Proxy: ",
                    cmdObj.guid,
                    " (",
                    cmdObj.command,
                    ")\nReceived: ",
                    result
                );
            });

        // Record request in store
        const index = addToActionList(cmdObj);

        // Set command status to AWAITING NOTEHUB.IO
        $actions[index].status = "AWAITING NOTEHUB.IO";
        console.log("status: ", $actions[index].status);
        await poll(
            async function () {
                // Check if command has arrived at Notehub.io
                let response = await fetch(
                    GET_URL + new URLSearchParams($actions[index]),
                    {
                        headers: { "Origin": ORIGIN_URL},
                        mode: "cors",
                    }
                );
                console.log("Response status:", response.status);
                return 200 == response.status;
            }
        ).catch((error) => {
            $actions[index].status = "COMMAND FAILED";
            throw new Error(
                "Failed to send command to Notehub.io!\n" + error + "\n"
            );
        });

        // Set command status to AWAITING CELLULAR NETWORK
        $actions[index].status = "AWAITING CELLULAR NETWORK";
        console.log("status: ", $actions[index].status);
        await poll(
            async function () {
                // Check if Notehub.io sent Note to R.O.B.
                let response = await fetch(
                    GET_URL + new URLSearchParams($actions[index]),
                    {
                        headers: { "Origin": ORIGIN_URL},
                        mode: "cors",
                    }
                );
                console.log("Response status:", response.status);
                return 200 == response.status;
            },
            10000,
            500
        ).catch(function () {
            console.log("Notehub.io failed to send Note to R.O.B.!");
        });

        // Set command status to AWAITING R.O.B.
        $actions[index].status = "AWAITING R.O.B.";
        console.log("status: ", $actions[index].status);
        await poll(
            async function () {
                // Check if R.O.B. processed command
                let response = await fetch(
                    GET_URL + new URLSearchParams($actions[index]),
                    {
                        headers: { "Origin": ORIGIN_URL},
                        mode: "cors",
                    }
                );
                console.log("Response status:", response.status);
                return 202 == response.status;
            },
            300000,
            500
        ).catch(function () {
            console.log("R.O.B. failed to process command!");
        });

        // Set command status to AWAITING STREAM DELAY
        $actions[index].status = "AWAITING STREAM DELAY";
        console.log("status: ", $actions[index].status);

        // Wait 5 seconds
        await delay(5000);

        // Set command status to COMPLETE
        $actions[index].status = "COMPLETE";
        console.log("status: ", $actions[index].status);
    };
</script>

<div class="controller">
    <div class="pad-area">
        <div class="row">
            <div class="col">
                <div class="dpad-wrapper">
                    <div class="cross-border vert" />
                    <div class="cross-border hor" />

                    <div class="cross vert" />
                    <div class="cross hor" />

                    <button
                        id="Up"
                        class="direction"
                        on:click={() => sendCommand("UP")}
                    >
                        <div class="arrow arrow-top" />
                    </button>
                    <button
                        id="Down"
                        class="direction"
                        on:click={() => sendCommand("DOWN")}
                    >
                        <div class="arrow arrow-bottom" />
                    </button>
                    <button
                        id="Left"
                        class="direction"
                        on:click={() => sendCommand("LEFT")}
                    >
                        <div class="arrow arrow-left" />
                    </button>
                    <button
                        id="Right"
                        class="direction"
                        on:click={() => sendCommand("RIGHT")}
                    >
                        <div class="arrow arrow-right" />
                    </button>

                    <div class="circle" />
                </div>
            </div>

            <div class="col">
                <div class="center">
                    <div class="gray-bar first" />
                    <div class="gray-bar" />
                    <div class="gray-bar">
                        <div class="label left-label">INFO</div>
                        <div class="label right-label">START</div>
                    </div>
                    <div class="gray-bar big">
                        <button
                            id="Select"
                            class="skinny-button select"
                            on:click={() =>
                                window.open(
                                    "https://www.hackster.io/zachary_fields/cellular-r-o-b-with-blues-wireless-38ac41",
                                    "_blank"
                                )}
                        />
                        <button
                            id="Start"
                            class="skinny-button start"
                            on:click={() => sendCommand("RECALIBRATE")}
                        />
                    </div>
                    <div class="gray-bar last" />
                </div>
            </div>

            <div class="col">
                <div class="logo-button-wrapper">
                    <div class="logo">
                        <a href="https://blues.io" target="_blank"
                            >blues<span>wireless</span></a
                        >
                    </div>

                    <div class="buttons">
                        <div class="button-pad">
                            <button
                                id="A"
                                class="button"
                                on:click={() => sendCommand("OPEN")}
                            />
                            <div class="button-letter">A</div>
                        </div>

                        <div class="button-pad">
                            <button
                                id="B"
                                class="button"
                                on:click={() => sendCommand("CLOSE")}
                            />
                            <div class="button-letter">B</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .controller {
        position: relative;
        background: #d2d2d0;
        width: 100%;
        height: 20rem;
        border-radius: 0 0 0.25rem 0.25rem;
    }

    .row {
        position: relative;
        display: flex;
        height: 100%;
    }

    .row:after {
        content: "";
        display: table;
        clear: both;
    }

    .col {
        float: left;
        width: 33.33%;
        display: inline-flex;
    }

    .pad-area {
        position: absolute;
        background: #2b3334;
        background: linear-gradient(to bottom, #3a3e3b 0%, #232624 100%);
        box-shadow: inset 0px 1px 2px 1px rgb(0 10 0 / 91%);
        left: 1rem;
        bottom: 1rem;
        width: 95%;
        height: 16rem;
        border-radius: 0.25rem;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .dpad-wrapper {
        position: relative;
        display: table-cell;
        vertical-align: middle;
        margin: 0 auto;
        width: 9rem;
        height: 9rem;
        top: 3.5rem;
    }

    .cross {
        position: absolute;
        background: #252725;
        box-shadow: inset 3px 0px 0px 0px rgb(255 255 255 / 61%);
        border-radius: 0.2rem;
        z-index: 5;
    }

    .cross.vert {
        left: 3rem;
        width: 3rem;
        height: 9rem;
        box-shadow: inset 3px 0px 0px 0px rgb(255 255 255 / 61%);
    }

    .cross.hor {
        top: 3rem;
        width: 9rem;
        height: 3rem;
    }

    .cross-border {
        position: absolute;
        background: #d3d2ce;
        border-radius: 0.2rem;
        z-index: 5;
    }

    .cross-border.vert {
        top: -0.25rem;
        left: 2.75rem;
        width: 3.5rem;
        height: 9.5rem;
    }

    .cross-border.hor {
        top: 2.75rem;
        left: -0.25rem;
        width: 9.5rem;
        height: 3.5rem;
    }

    .arrow {
        width: 0;
        height: 0;
        border-top: 0.875rem solid transparent;
        border-bottom: 0.875rem solid transparent;
        border-left: 0.875rem solid #111111;
        position: absolute;
        z-index: 9999;
        right: 0.6875rem;
        top: calc(50% - 0.5rem / 2 - 0.6875rem);
    }

    .arrow:after {
        content: "";
        position: absolute;
        width: 0.875rem;
        height: 0.875rem;
        background-color: #111111;
        right: 0.6rem;
        top: calc(50% - 0.4375rem);
    }

    .arrow.arrow-left {
        -moz-transform: rotate(180deg);
        -webkit-transform: rotate(180deg);
        -o-transform: rotate(180deg);
        -ms-transform: rotate(180deg);
        transform: rotate(180deg);
        top: calc(50% - 0.5rem / 2 - 0.6875rem);
        left: 0.6875rem;
        right: inherit;
    }

    .arrow.arrow-top {
        -moz-transform: rotate(-90deg);
        -webkit-transform: rotate(-90deg);
        -o-transform: rotate(-90deg);
        -ms-transform: rotate(-90deg);
        transform: rotate(-90deg);
        top: 0.275rem !important;
        left: calc(50% - 1rem / 2 + 0.06rem);
    }

    .arrow.arrow-bottom {
        -moz-transform: rotate(90deg);
        -webkit-transform: rotate(90deg);
        -o-transform: rotate(90deg);
        -ms-transform: rotate(90deg);
        transform: rotate(90deg);
        top: inherit;
        bottom: 0.275rem;
        left: calc(50% - 1rem / 2 + 0.06rem);
        top: inherit;
    }

    .circle {
        width: 1.5rem;
        height: 1.5rem;
        -webkit-border-radius: 50%;
        border-radius: 50%;
        background: linear-gradient(
            180deg,
            rgb(22, 22, 22) 30%,
            rgb(58, 58, 58) 100%
        );
        position: relative;
        z-index: 99999;
        top: 42%;
        left: 42%;
    }

    .direction {
        position: absolute;
        background: #252725;
        border: none;
        width: 3rem;
        height: 3rem;
        z-index: 10;
    }

    .direction:active {
        background: #1f1f1f;
    }

    #Up {
        left: 3rem;
    }

    #Down {
        left: 3rem;
        bottom: 0;
    }

    #Left {
        top: 3rem;
    }

    #Right {
        top: 3rem;
        right: 0;
    }

    .center {
        width: 20rem;
        height: 100%;
        margin: 0 auto;
    }

    .gray-bar {
        position: relative;
        background: #9a9b96;
        width: 100%;
        height: 16%;
        border-radius: 0.25rem;
        margin-bottom: 0.72rem;
    }

    .gray-bar.first {
        height: 2.5rem;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
    }

    .gray-bar.big {
        background: #d3d2ce;
        border: 5px solid #e0ded4;
        box-shadow: inset 0px 1px 3px 4px rgb(50 50 50 / 15%);
        z-index: 3;
        height: 4rem;
    }

    .gray-bar.last {
        height: 1.5rem;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
    }

    .label {
        font-size: 1.5rem;
        text-align: center;
        line-height: 2.5rem;
    }

    .label.left-label {
        width: 50%;
        float: left;
        padding-left: 0.5rem;
    }

    .label.right-label {
        width: 50%;
        float: right;
    }

    .label::after {
        display: block;
        content: "";
        clear: both;
    }

    .skinny-button {
        position: absolute;
        background-color: #464646;
        border-radius: 10px;
        border: 1px solid #272723;
        box-shadow: inset 0px 1px 0px 0px rgb(255 255 255 / 51%);
        top: 50%;
        transform: translateY(-50%);
        width: 4.5rem;
        height: 1.75rem;
        border-radius: 2rem;
    }

    .skinny-button:active {
        box-shadow: inset 0px 0px 0px 0px rgb(255 255 255 / 51%);
    }

    .skinny-button.select {
        left: 2rem;
    }

    .skinny-button.start {
        right: 2rem;
    }

    .logo-button-wrapper {
        position: relative;
        display: table-cell;
        vertical-align: middle;
        margin: 0 auto;
        height: 16rem;
        top: 0;
    }

    .logo {
        font-size: 1.5rem;
        color: #9ebacc;
        margin-top: 2.75rem;
        margin-bottom: 4rem;
    }

    .logo a {
        font-size: 1.55rem;
        color: #9ebacc;
        text-decoration: none;
    }

    .logo span {
        color: #ffffff;
    }

    .button-pad {
        position: relative;
        float: right;
        background: #d3d2ce;
        margin-right: 1rem;
        width: 5rem;
        height: 5rem;
        border-radius: 0.25rem;
    }

    .button {
        background: linear-gradient(to bottom, #df2015 0%, #f84936 100%);
        border-radius: 50%;
        float: left;
        border: 1px rgba(0, 0, 0, 0.51) solid;
        box-shadow: inset 0px 1.5px 1.5px 0px #fbfbfb,
            0px 2px 2px 0px rgb(0 0 0 / 71%);
        width: 4rem;
        height: 4rem;
        margin: 0.5rem;
        border-radius: 50%;
    }

    .button:active {
        top: 1px;
        border: 1px rgba(0, 0, 0, 0.5) solid;
        box-shadow: inset 0px 0px 1.5px 0px #fbfbfb,
            0px 2px 2px 0px rgb(0 0 0 / 21%);
    }

    .button-letter {
        position: absolute;
        font-size: 1.25rem;
        right: 0;
        bottom: -1.75rem;
    }
</style>
