/*! Made with ct.js http://ctjs.rocks/ */

if (location.protocol === 'file:') {
    // eslint-disable-next-line no-alert
    alert('Your game won\'t work like this because\nWeb 👏 builds 👏 require 👏 a web 👏 server!\n\nConsider using a desktop build, or upload your web build to itch.io, GameJolt or your own website.\n\nIf you haven\'t created this game, please contact the developer about this issue.\n\n Also note that ct.js games do not work inside the itch app; you will need to open the game with your browser of choice.');
}

const deadPool = []; // a pool of `kill`-ed copies for delaying frequent garbage collection
const copyTypeSymbol = Symbol('I am a ct.js copy');
setInterval(function cleanDeadPool() {
    deadPool.length = 0;
}, 1000 * 60);

/**
 * The ct.js library
 * @namespace
 */
const ct = {
    /**
     * A target number of frames per second. It can be interpreted as a second in timers.
     * @type {number}
     */
    speed: [60][0] || 60,
    templates: {},
    snd: {},
    stack: [],
    fps: [60][0] || 60,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * Use ct.delta to balance your movement and other calculations on different framerates by
     * multiplying it with your reference value.
     *
     * Note that `this.move()` already uses it, so there is no need to premultiply
     * `this.speed` with it.
     *
     * **A minimal example:**
     * ```js
     * this.x += this.windSpeed * ct.delta;
     * ```
     *
     * @template {number}
     */
    delta: 1,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * This is a version for UI elements, as it is not affected by time scaling, and thus works well
     * both with slow-mo effects and game pause.
     *
     * @template {number}
     */
    deltaUi: 1,
    /**
     * The camera that outputs its view to the renderer.
     * @template {Camera}
     */
    camera: null,
    /**
     * ct.js version in form of a string `X.X.X`.
     * @template {string}
     */
    version: '2.0.2',
    meta: [{"name":"WD-GAME","author":"Sergey","site":"https://prologgg.github.io/wd-game","version":"0.0.0"}][0],
    get width() {
        return ct.pixiApp.renderer.view.width;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New width in pixels
     * @template {number}
     */
    set width(value) {
        ct.camera.width = ct.roomWidth = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(value, ct.height);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    },
    get height() {
        return ct.pixiApp.renderer.view.height;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New height in pixels
     * @template {number}
     */
    set height(value) {
        ct.camera.height = ct.roomHeight = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(ct.width, value);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    }
};

// eslint-disable-next-line no-console
console.log(
    `%c 😺 %c ct.js game editor %c v${ct.version} %c https://ctjs.rocks/ `,
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;',
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;'
);

ct.highDensity = [true][0];
const pixiAppSettings = {
    width: [1248][0],
    height: [702][0],
    antialias: ![false][0],
    powerPreference: 'high-performance',
    sharedTicker: false,
    sharedLoader: true
};
try {
    /**
     * The PIXI.Application that runs ct.js game
     * @template {PIXI.Application}
     */
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
} catch (e) {
    console.error(e);
    // eslint-disable-next-line no-console
    console.warn('[ct.js] Something bad has just happened. This is usually due to hardware problems. I\'ll try to fix them now, but if the game still doesn\'t run, try including a legacy renderer in the project\'s settings.');
    PIXI.settings.SPRITE_MAX_TEXTURES = Math.min(PIXI.settings.SPRITE_MAX_TEXTURES, 16);
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
}

PIXI.settings.ROUND_PIXELS = [false][0];
ct.pixiApp.ticker.maxFPS = [60][0] || 0;
if (!ct.pixiApp.renderer.options.antialias) {
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
}
/**
 * @template PIXI.Container
 */
ct.stage = ct.pixiApp.stage;
ct.pixiApp.renderer.autoDensity = ct.highDensity;
document.getElementById('ct').appendChild(ct.pixiApp.view);

/**
 * A library of different utility functions, mainly Math-related, but not limited to them.
 * @namespace
 */
ct.u = {
    /**
     * Get the environment the game runs on.
     * @returns {string} Either 'ct.ide', or 'nw', or 'electron', or 'browser'.
     */
    getEnvironment() {
        if (window.name === 'ct.js debugger') {
            return 'ct.ide';
        }
        try {
            if (nw.require) {
                return 'nw';
            }
        } catch (oO) {
            void 0;
        }
        try {
            require('electron');
            return 'electron';
        } catch (Oo) {
            void 0;
        }
        return 'browser';
    },
    /**
     * Get the current operating system the game runs on.
     * @returns {string} One of 'windows', 'darwin' (which is MacOS), 'linux', or 'unknown'.
     */
    getOS() {
        const ua = window.navigator.userAgent;
        if (ua.indexOf('Windows') !== -1) {
            return 'windows';
        }
        if (ua.indexOf('Linux') !== -1) {
            return 'linux';
        }
        if (ua.indexOf('Mac') !== -1) {
            return 'darwin';
        }
        return 'unknown';
    },
    /**
     * Returns the length of a vector projection onto an X axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldx(l, d) {
        return l * Math.cos(d * Math.PI / 180);
    },
    /**
     * Returns the length of a vector projection onto an Y axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldy(l, d) {
        return l * Math.sin(d * Math.PI / 180);
    },
    /**
     * Returns the direction of a vector that points from the first point to the second one.
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The angle of the resulting vector, in degrees
     */
    pdn(x1, y1, x2, y2) {
        return (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 360) % 360;
    },
    // Point-point DistanCe
    /**
     * Returns the distance between two points
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The distance between the two points
     */
    pdc(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    },
    /**
     * Convers degrees to radians
     * @param {number} deg The degrees to convert
     * @returns {number} The resulting radian value
     */
    degToRad(deg) {
        return deg * Math.PI / 180;
    },
    /**
     * Convers radians to degrees
     * @param {number} rad The radian value to convert
     * @returns {number} The resulting degree
     */
    radToDeg(rad) {
        return rad / Math.PI * 180;
    },
    /**
     * Rotates a vector (x; y) by `deg` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} deg The degree to rotate by
     * @returns {PIXI.Point} A pair of new `x` and `y` parameters.
     */
    rotate(x, y, deg) {
        return ct.u.rotateRad(x, y, ct.u.degToRad(deg));
    },
    /**
     * Rotates a vector (x; y) by `rad` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} rad The radian value to rotate around
     * @returns {PIXI.Point} A pair of new `x` and `y` parameters.
     */
    rotateRad(x, y, rad) {
        const sin = Math.sin(rad),
              cos = Math.cos(rad);
        return new PIXI.Point(
            cos * x - sin * y,
            cos * y + sin * x
        );
    },
    /**
     * Gets the most narrow angle between two vectors of given directions
     * @param {number} dir1 The direction of the first vector
     * @param {number} dir2 The direction of the second vector
     * @returns {number} The resulting angle
     */
    deltaDir(dir1, dir2) {
        dir1 = ((dir1 % 360) + 360) % 360;
        dir2 = ((dir2 % 360) + 360) % 360;
        var t = dir1,
            h = dir2,
            ta = h - t;
        if (ta > 180) {
            ta -= 360;
        }
        if (ta < -180) {
            ta += 360;
        }
        return ta;
    },
    /**
     * Returns a number in between the given range (clamps it).
     * @param {number} min The minimum value of the given number
     * @param {number} val The value to fit in the range
     * @param {number} max The maximum value of the given number
     * @returns {number} The clamped value
     */
    clamp(min, val, max) {
        return Math.max(min, Math.min(max, val));
    },
    /**
     * Linearly interpolates between two values by the apha value.
     * Can also be describing as mixing between two values with a given proportion `alpha`.
     * @param {number} a The first value to interpolate from
     * @param {number} b The second value to interpolate to
     * @param {number} alpha The mixing value
     * @returns {number} The result of the interpolation
     */
    lerp(a, b, alpha) {
        return a + (b - a) * alpha;
    },
    /**
     * Returns the position of a given value in a given range. Opposite to linear interpolation.
     * @param  {number} a The first value to interpolate from
     * @param  {number} b The second value to interpolate top
     * @param  {number} val The interpolated values
     * @return {number} The position of the value in the specified range.
     * When a <= val <= b, the result will be inside the [0;1] range.
     */
    unlerp(a, b, val) {
        return (val - a) / (b - a);
    },
    /**
     * Re-maps the given value from one number range to another.
     * @param  {number} val The value to be mapped
     * @param  {number} inMin Lower bound of the value's current range
     * @param  {number} inMax Upper bound of the value's current range
     * @param  {number} outMin Lower bound of the value's target range
     * @param  {number} outMax Upper bound of the value's target range
     * @returns {number} The mapped value.
     */
    map(val, inMin, inMax, outMin, outMax) {
        return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },
    /**
     * Translates a point from UI space to game space.
     * @param {number} x The x coordinate in UI space.
     * @param {number} y The y coordinate in UI space.
     * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
     */
    uiToGameCoord(x, y) {
        return ct.camera.uiToGameCoord(x, y);
    },
    /**
     * Translates a point from fame space to UI space.
     * @param {number} x The x coordinate in game space.
     * @param {number} y The y coordinate in game space.
     * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
     */
    gameToUiCoord(x, y) {
        return ct.camera.gameToUiCoord(x, y);
    },
    hexToPixi(hex) {
        return Number('0x' + hex.slice(1));
    },
    pixiToHex(pixi) {
        return '#' + (pixi).toString(16).padStart(6, 0);
    },
    /**
     * Tests whether a given point is inside the given rectangle
     * (it can be either a copy or an array).
     * @param {number} x The x coordinate of the point.
     * @param {number} y The y coordinate of the point.
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a rectangular shape)
     * or an array in a form of [x1, y1, x2, y2], where (x1;y1) and (x2;y2) specify
     * the two opposite corners of the rectangle.
     * @returns {boolean} `true` if the point is inside the rectangle, `false` otherwise.
     */
    prect(x, y, arg) {
        var xmin, xmax, ymin, ymax;
        if (arg.splice) {
            xmin = Math.min(arg[0], arg[2]);
            xmax = Math.max(arg[0], arg[2]);
            ymin = Math.min(arg[1], arg[3]);
            ymax = Math.max(arg[1], arg[3]);
        } else {
            xmin = arg.x - arg.shape.left * arg.scale.x;
            xmax = arg.x + arg.shape.right * arg.scale.x;
            ymin = arg.y - arg.shape.top * arg.scale.y;
            ymax = arg.y + arg.shape.bottom * arg.scale.y;
        }
        return x >= xmin && y >= ymin && x <= xmax && y <= ymax;
    },
    /**
     * Tests whether a given point is inside the given circle (it can be either a copy or an array)
     * @param {number} x The x coordinate of the point
     * @param {number} y The y coordinate of the point
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a circular shape)
     * or an array in a form of [x1, y1, r], where (x1;y1) define the center of the circle
     * and `r` defines the radius of it.
     * @returns {boolean} `true` if the point is inside the circle, `false` otherwise
     */
    pcircle(x, y, arg) {
        if (arg.splice) {
            return ct.u.pdc(x, y, arg[0], arg[1]) < arg[2];
        }
        return ct.u.pdc(0, 0, (arg.x - x) / arg.scale.x, (arg.y - y) / arg.scale.y) < arg.shape.r;
    },
    /**
     * Copies all the properties of the source object to the destination object.
     * This is **not** a deep copy. Useful for extending some settings with default values,
     * or for combining data.
     * @param {object} o1 The destination object
     * @param {object} o2 The source object
     * @param {any} [arr] An optional array of properties to copy. If not specified,
     * all the properties will be copied.
     * @returns {object} The modified destination object
     */
    ext(o1, o2, arr) {
        if (arr) {
            for (const i in arr) {
                if (o2[arr[i]]) {
                    o1[arr[i]] = o2[arr[i]];
                }
            }
        } else {
            for (const i in o2) {
                o1[i] = o2[i];
            }
        }
        return o1;
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer is run in gameplay time scale, meaning that it is affected by time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    wait(time) {
        return ct.timer.add(time);
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer runs in UI time scale and is not sensitive to time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    waitUi(time) {
        return ct.timer.addUi(time);
    },
    /**
     * Creates a new function that returns a promise, based
     * on a function with a regular (err, result) => {...} callback.
     * @param {Function} f The function that needs to be promisified
     * @see https://javascript.info/promisify
     */
    promisify(f) {
        // eslint-disable-next-line func-names
        return function (...args) {
            return new Promise((resolve, reject) => {
                const callback = function callback(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                };
                args.push(callback);
                f.call(this, ...args);
            });
        };
    },
    required(paramName, method) {
        let str = 'The parameter ';
        if (paramName) {
            str += `${paramName} `;
        }
        if (method) {
            str += `of ${method} `;
        }
        str += 'is required.';
        throw new Error(str);
    },
    numberedString(prefix, input) {
        return prefix + '_' + input.toString().padStart(2, '0');
    },
    getStringNumber(str) {
        return Number(str.split('_').pop());
    }
};
ct.u.ext(ct.u, {// make aliases
    getOs: ct.u.getOS,
    lengthDirX: ct.u.ldx,
    lengthDirY: ct.u.ldy,
    pointDirection: ct.u.pdn,
    pointDistance: ct.u.pdc,
    pointRectangle: ct.u.prect,
    pointCircle: ct.u.pcircle,
    extend: ct.u.ext
});

// eslint-disable-next-line max-lines-per-function
(() => {
    const killRecursive = copy => {
        copy.kill = true;
        if (copy.onDestroy) {
            ct.templates.onDestroy.apply(copy);
            copy.onDestroy.apply(copy);
        }
        for (const child of copy.children) {
            if (child[copyTypeSymbol]) {
                killRecursive(child);
            }
        }
        const stackIndex = ct.stack.indexOf(copy);
        if (stackIndex !== -1) {
            ct.stack.splice(stackIndex, 1);
        }
        if (copy.template) {
            const templatelistIndex = ct.templates.list[copy.template].indexOf(copy);
            if (templatelistIndex !== -1) {
                ct.templates.list[copy.template].splice(templatelistIndex, 1);
            }
        }
        deadPool.push(copy);
    };
    const manageCamera = () => {
        if (ct.camera) {
            ct.camera.update(ct.delta);
            ct.camera.manageStage();
        }
    };

    ct.loop = function loop(delta) {
        ct.delta = delta;
        ct.deltaUi = ct.pixiApp.ticker.elapsedMS / (1000 / (ct.pixiApp.ticker.maxFPS || 60));
        ct.inputs.updateActions();
        ct.timer.updateTimers();
        ct.place.debugTraceGraphics.clear();

        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.templates.beforeStep.apply(ct.stack[i]);
            ct.stack[i].onStep.apply(ct.stack[i]);
            ct.templates.afterStep.apply(ct.stack[i]);
        }
        // There may be a number of rooms stacked on top of each other.
        // Loop through them and filter out everything that is not a room.
        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeStep.apply(item);
            item.onStep.apply(item);
            ct.rooms.afterStep.apply(item);
        }
        // copies
        for (const copy of ct.stack) {
            // eslint-disable-next-line no-underscore-dangle
            if (copy.kill && !copy._destroyed) {
                killRecursive(copy); // This will also allow a parent to eject children
                                     // to a new container before they are destroyed as well
                copy.destroy({
                    children: true
                });
            }
        }

        for (const cont of ct.stage.children) {
            cont.children.sort((a, b) =>
                ((a.depth || 0) - (b.depth || 0)) || ((a.uid || 0) - (b.uid || 0)) || 0);
        }

        manageCamera();

        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.templates.beforeDraw.apply(ct.stack[i]);
            ct.stack[i].onDraw.apply(ct.stack[i]);
            ct.templates.afterDraw.apply(ct.stack[i]);
            ct.stack[i].xprev = ct.stack[i].x;
            ct.stack[i].yprev = ct.stack[i].y;
        }

        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeDraw.apply(item);
            item.onDraw.apply(item);
            ct.rooms.afterDraw.apply(item);
        }
        /*%afterframe%*/
        if (ct.rooms.switching) {
            ct.rooms.forceSwitch();
        }
    };
})();




/**
 * @property {number} value The current value of an action. It is always in the range from -1 to 1.
 * @property {string} name The name of the action.
 */
class CtAction {
    /**
     * This is a custom action defined in the Settings tab → Edit actions section.
     * Actions are used to abstract different input methods into one gameplay-related interface:
     * for example, joystick movement, WASD keys and arrows can be turned into two actions:
     * `MoveHorizontally` and `MoveVertically`.
     * @param {string} name The name of the new action.
     */
    constructor(name) {
        this.name = name;
        this.methodCodes = [];
        this.methodMultipliers = [];
        this.prevValue = 0;
        this.value = 0;
        return this;
    }
    /**
     * Checks whether the current action listens to a given input method.
     * This *does not* check whether this input method is supported by ct.
     *
     * @param {string} code The code to look up.
     * @returns {boolean} `true` if it exists, `false` otherwise.
     */
    methodExists(code) {
        return this.methodCodes.indexOf(code) !== -1;
    }
    /**
     * Adds a new input method to listen.
     *
     * @param {string} code The input method's code to listen to. Must be unique per action.
     * @param {number} [multiplier] An optional multiplier, e.g. to flip its value.
     * Often used with two buttons to combine them into a scalar input identical to joysticks.
     * @returns {void}
     */
    addMethod(code, multiplier) {
        if (this.methodCodes.indexOf(code) === -1) {
            this.methodCodes.push(code);
            this.methodMultipliers.push(multiplier !== void 0 ? multiplier : 1);
        } else {
            throw new Error(`[ct.inputs] An attempt to add an already added input "${code}" to an action "${name}".`);
        }
    }
    /**
     * Removes the provided input method for an action.
     *
     * @param {string} code The input method to remove.
     * @returns {void}
     */
    removeMethod(code) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodCodes.splice(ind, 1);
            this.methodMultipliers.splice(ind, 1);
        }
    }
    /**
     * Changes the multiplier for an input method with the provided code.
     * This method will produce a warning if one is trying to change an input method
     * that is not listened by this action.
     *
     * @param {string} code The input method's code to change
     * @param {number} multiplier The new value
     * @returns {void}
     */
    setMultiplier(code, multiplier) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodMultipliers[ind] = multiplier;
        } else {
            // eslint-disable-next-line no-console
            console.warning(`[ct.inputs] An attempt to change multiplier of a non-existent method "${code}" at event ${this.name}`);
            // eslint-disable-next-line no-console
            console.trace();
        }
    }
    /**
     * Recalculates the digital value of an action.
     *
     * @returns {number} A scalar value between -1 and 1.
     */
    update() {
        this.prevValue = this.value;
        this.value = 0;
        for (let i = 0, l = this.methodCodes.length; i < l; i++) {
            const rawValue = ct.inputs.registry[this.methodCodes[i]] || 0;
            this.value += rawValue * this.methodMultipliers[i];
        }
        this.value = Math.max(-1, Math.min(this.value, 1));
    }
    /**
     * Resets the state of this action, setting its value to `0`
     * and its pressed, down, released states to `false`.
     *
     * @returns {void}
     */
    reset() {
        this.prevValue = this.value = 0;
    }
    /**
     * Returns whether the action became active in the current frame,
     * either by a button just pressed or by using a scalar input.
     *
     * `true` for being pressed and `false` otherwise
     * @type {boolean}
     */
    get pressed() {
        return this.prevValue === 0 && this.value !== 0;
    }
    /**
     * Returns whether the action became inactive in the current frame,
     * either by releasing all buttons or by resting all scalar inputs.
     *
     * `true` for being released and `false` otherwise
     * @type {boolean}
     */
    get released() {
        return this.prevValue !== 0 && this.value === 0;
    }
    /**
     * Returns whether the action is active, e.g. by a pressed button
     * or a currently used scalar input.
     *
     * `true` for being active and `false` otherwise
     * @type {boolean}
     */
    get down() {
        return this.value !== 0;
    }
    /* In case you need to be hated for the rest of your life, uncomment this */
    /*
    valueOf() {
        return this.value;
    }
    */
}

/**
 * A list of custom Actions. They are defined in the Settings tab → Edit actions section.
 * @type {Object.<string,CtAction>}
 */
ct.actions = {};
/**
 * @namespace
 */
ct.inputs = {
    registry: {},
    /**
     * Adds a new action and puts it into `ct.actions`.
     *
     * @param {string} name The name of an action, as it will be used in `ct.actions`.
     * @param {Array<Object>} methods A list of input methods. This list can be changed later.
     * @returns {CtAction} The created action
     */
    addAction(name, methods) {
        if (name in ct.actions) {
            throw new Error(`[ct.inputs] An action "${name}" already exists, can't add a new one with the same name.`);
        }
        const action = new CtAction(name);
        for (const method of methods) {
            action.addMethod(method.code, method.multiplier);
        }
        ct.actions[name] = action;
        return action;
    },
    /**
     * Removes an action with a given name.
     * @param {string} name The name of an action
     * @returns {void}
     */
    removeAction(name) {
        delete ct.actions[name];
    },
    /**
     * Recalculates values for every action in a game.
     * @returns {void}
     */
    updateActions() {
        for (const i in ct.actions) {
            ct.actions[i].update();
        }
    }
};

ct.inputs.addAction('MoveRight', [{"code":"keyboard.KeyD"},{"code":"keyboard.ArrowRight"}]);
ct.inputs.addAction('MoveLeft', [{"code":"keyboard.ArrowLeft"},{"code":"keyboard.KeyA"}]);
ct.inputs.addAction('Jump', [{"code":"keyboard.ArrowUp"},{"code":"keyboard.KeyW"}]);
ct.inputs.addAction('Pause', [{"code":"keyboard.Escape"}]);
ct.inputs.addAction('Restart', [{"code":"keyboard.KeyR"}]);
ct.inputs.addAction('NextLvl', [{"code":"keyboard.Digit0"}]);
ct.inputs.addAction('Shoot', [{"code":"keyboard.Space"}]);
ct.inputs.addAction('PrevLvl', [{"code":"keyboard.Digit9"}]);


/**
 * @typedef IRoomMergeResult
 *
 * @property {Array<Copy>} copies
 * @property {Array<Tilemap>} tileLayers
 * @property {Array<Background>} backgrounds
 */

class Room extends PIXI.Container {
    static getNewId() {
        this.roomId++;
        return this.roomId;
    }

    constructor(template) {
        super();
        this.x = this.y = 0;
        this.uid = Room.getNewId();
        this.tileLayers = [];
        this.backgrounds = [];
        if (!ct.room) {
            ct.room = ct.rooms.current = this;
        }
        if (template) {
            if (template.extends) {
                ct.u.ext(this, template.extends);
            }
            this.onCreate = template.onCreate;
            this.onStep = template.onStep;
            this.onDraw = template.onDraw;
            this.onLeave = template.onLeave;
            this.template = template;
            this.name = template.name;
            if (this === ct.room) {
                ct.pixiApp.renderer.backgroundColor = ct.u.hexToPixi(this.template.backgroundColor);
            }
            if (this === ct.room) {
    ct.place.tileGrid = {};
}
ct.fittoscreen();

            for (let i = 0, li = template.bgs.length; i < li; i++) {
                // Need to put extensions here, so we don't use ct.backgrounds.add
                const bg = new ct.templates.Background(
                    template.bgs[i].texture,
                    null,
                    template.bgs[i].depth,
                    template.bgs[i].extends
                );
                this.addChild(bg);
            }
            for (let i = 0, li = template.tiles.length; i < li; i++) {
                const tl = new Tilemap(template.tiles[i]);
                tl.cache();
                this.tileLayers.push(tl);
                this.addChild(tl);
            }
            for (let i = 0, li = template.objects.length; i < li; i++) {
                const exts = template.objects[i].exts || {};
                ct.templates.copyIntoRoom(
                    template.objects[i].template,
                    template.objects[i].x,
                    template.objects[i].y,
                    this,
                    {
                        tx: template.objects[i].tx,
                        ty: template.objects[i].ty,
                        tr: template.objects[i].tr,
                        ...exts
                    }
                );
            }
        }
        return this;
    }
    get x() {
        return -this.position.x;
    }
    set x(value) {
        this.position.x = -value;
        return value;
    }
    get y() {
        return -this.position.y;
    }
    set y(value) {
        this.position.y = -value;
        return value;
    }
}
Room.roomId = 0;

(function roomsAddon() {
    /* global deadPool */
    var nextRoom;
    /**
     * @namespace
     */
    ct.rooms = {
        templates: {},
        /**
         * An object that contains arrays of currently present rooms.
         * These include the current room (`ct.room`), as well as any rooms
         * appended or prepended through `ct.rooms.append` and `ct.rooms.prepend`.
         * @type {Object.<string,Array<Room>>}
         */
        list: {},
        /**
         * Creates and adds a background to the current room, at the given depth.
         * @param {string} texture The name of the texture to use
         * @param {number} depth The depth of the new background
         * @returns {Background} The created background
         */
        addBg(texture, depth) {
            const bg = new ct.templates.Background(texture, null, depth);
            ct.room.addChild(bg);
            return bg;
        },
        /**
         * Adds a new empty tile layer to the room, at the given depth
         * @param {number} layer The depth of the layer
         * @returns {Tileset} The created tile layer
         * @deprecated Use ct.tilemaps.create instead.
         */
        addTileLayer(layer) {
            return ct.tilemaps.create(layer);
        },
        /**
         * Clears the current stage, removing all rooms with copies, tile layers, backgrounds,
         * and other potential entities.
         * @returns {void}
         */
        clear() {
            ct.stage.children = [];
            ct.stack = [];
            for (const i in ct.templates.list) {
                ct.templates.list[i] = [];
            }
            for (const i in ct.backgrounds.list) {
                ct.backgrounds.list[i] = [];
            }
            ct.rooms.list = {};
            for (const name in ct.rooms.templates) {
                ct.rooms.list[name] = [];
            }
        },
        /**
         * This method safely removes a previously appended/prepended room from the stage.
         * It will trigger "On Leave" for a room and "On Destroy" event
         * for all the copies of the removed room.
         * The room will also have `this.kill` set to `true` in its event, if it comes in handy.
         * This method cannot remove `ct.room`, the main room.
         * @param {Room} room The `room` argument must be a reference
         * to the previously created room.
         * @returns {void}
         */
        remove(room) {
            if (!(room instanceof Room)) {
                if (typeof room === 'string') {
                    throw new Error('[ct.rooms] To remove a room, you should provide a reference to it (to an object), not its name. Provided value:', room);
                }
                throw new Error('[ct.rooms] An attempt to remove a room that is not actually a room! Provided value:', room);
            }
            const ind = ct.rooms.list[room.name];
            if (ind !== -1) {
                ct.rooms.list[room.name].splice(ind, 1);
            } else {
                // eslint-disable-next-line no-console
                console.warn('[ct.rooms] Removing a room that was not found in ct.rooms.list. This is strange…');
            }
            room.kill = true;
            ct.stage.removeChild(room);
            for (const copy of room.children) {
                copy.kill = true;
            }
            room.onLeave();
            ct.rooms.onLeave.apply(room);
        },
        /*
         * Switches to the given room. Note that this transition happens at the end
         * of the frame, so the name of a new room may be overridden.
         */
        'switch'(roomName) {
            if (ct.rooms.templates[roomName]) {
                nextRoom = roomName;
                ct.rooms.switching = true;
            } else {
                console.error('[ct.rooms] The room "' + roomName + '" does not exist!');
            }
        },
        switching: false,
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` after all the other rooms.
         * @param {string} roomName The name of the room to be appended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        append(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] append failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChild(room);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` before all the other rooms.
         * @param {string} roomName The name of the room to be prepended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        prepend(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] prepend failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChildAt(room, 0);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Merges a given room into the current one. Skips room's OnCreate event.
         *
         * @param {string} roomName The name of the room that needs to be merged
         * @returns {IRoomMergeResult} Arrays of created copies, backgrounds, tile layers,
         * added to the current room (`ct.room`). Note: it does not get updated,
         * so beware of memory leaks if you keep a reference to this array for a long time!
         */
        merge(roomName) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] merge failed: the room ${roomName} does not exist!`);
                return false;
            }
            const generated = {
                copies: [],
                tileLayers: [],
                backgrounds: []
            };
            const template = ct.rooms.templates[roomName];
            const target = ct.room;
            for (const t of template.bgs) {
                const bg = new ct.templates.Background(t.texture, null, t.depth, t.extends);
                target.backgrounds.push(bg);
                target.addChild(bg);
                generated.backgrounds.push(bg);
            }
            for (const t of template.tiles) {
                const tl = new Tilemap(t);
                target.tileLayers.push(tl);
                target.addChild(tl);
                generated.tileLayers.push(tl);
                tl.cache();
            }
            for (const t of template.objects) {
                const c = ct.templates.copyIntoRoom(t.template, t.x, t.y, target, {
                    tx: t.tx || 1,
                    ty: t.ty || 1,
                    tr: t.tr || 0
                });
                generated.copies.push(c);
            }
            return generated;
        },
        forceSwitch(roomName) {
            if (nextRoom) {
                roomName = nextRoom;
            }
            if (ct.room) {
                ct.room.onLeave();
                ct.rooms.onLeave.apply(ct.room);
                ct.room = void 0;
            }
            ct.rooms.clear();
            deadPool.length = 0;
            var template = ct.rooms.templates[roomName];
            ct.roomWidth = template.width;
            ct.roomHeight = template.height;
            ct.camera = new Camera(
                ct.roomWidth / 2,
                ct.roomHeight / 2,
                ct.roomWidth,
                ct.roomHeight
            );
            if (template.cameraConstraints) {
                ct.camera.minX = template.cameraConstraints.x1;
                ct.camera.maxX = template.cameraConstraints.x2;
                ct.camera.minY = template.cameraConstraints.y1;
                ct.camera.maxY = template.cameraConstraints.y2;
            }
            ct.pixiApp.renderer.resize(template.width, template.height);
            ct.rooms.current = ct.room = new Room(template);
            ct.stage.addChild(ct.room);
            ct.room.onCreate();
            ct.rooms.onCreate.apply(ct.room);
            ct.rooms.list[roomName].push(ct.room);
            
            ct.camera.manageStage();
            ct.rooms.switching = false;
            nextRoom = void 0;
        },
        onCreate() {
            if (this === ct.room) {
    const debugTraceGraphics = new PIXI.Graphics();
    debugTraceGraphics.depth = 10000000; // Why not. Overlap everything.
    ct.room.addChild(debugTraceGraphics);
    ct.place.debugTraceGraphics = debugTraceGraphics;
}
for (const layer of this.tileLayers) {
    if (this.children.indexOf(layer) === -1) {
        continue;
    }
    ct.place.enableTilemapCollisions(layer);
}

        },
        onLeave() {
            if (this === ct.room) {
    ct.place.grid = {};
}

        },
        /**
         * The name of the starting room, as it was set in ct.IDE.
         * @type {string}
         */
        starting: 'Level_01'
    };
})();
/**
 * The current room
 * @type {Room}
 */
ct.room = null;

ct.rooms.beforeStep = function beforeStep() {
    ct.pointer.updateGestures();

};
ct.rooms.afterStep = function afterStep() {
    
};
ct.rooms.beforeDraw = function beforeDraw() {
    
};
ct.rooms.afterDraw = function afterDraw() {
    for (const pointer of ct.pointer.down) {
    pointer.xprev = pointer.x;
    pointer.yprev = pointer.y;
    pointer.xuiprev = pointer.x;
    pointer.yuiprev = pointer.y;
}
for (const pointer of ct.pointer.hover) {
    pointer.xprev = pointer.x;
    pointer.yprev = pointer.y;
    pointer.xuiprev = pointer.x;
    pointer.yuiprev = pointer.y;
}
ct.inputs.registry['pointer.Wheel'] = 0;
ct.pointer.clearReleased();
ct.pointer.xmovement = ct.pointer.ymovement = 0;
ct.keyboard.clear();
if (ct.sound.follow && !ct.sound.follow.kill) {
    ct.sound.howler.pos(
        ct.sound.follow.x,
        ct.sound.follow.y,
        ct.sound.useDepth ? ct.sound.follow.z : 0
    );
} else if (ct.sound.manageListenerPosition) {
    ct.sound.howler.pos(ct.camera.x, ct.camera.y, ct.camera.z || 0);
}

};


ct.rooms.templates['Level_01'] = {
    name: 'Level_01',
    width: 1248,
    height: 702,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":448,"y":512,"exts":{},"template":"Rocks"},{"x":448,"y":448,"exts":{},"template":"Rocks"},{"x":448,"y":384,"exts":{},"template":"Rocks"},{"x":448,"y":320,"exts":{},"template":"Rocks"},{"x":448,"y":256,"exts":{},"template":"Rocks"},{"x":448,"y":192,"exts":{},"template":"Rocks"},{"x":192,"y":576,"exts":{},"template":"Rocks_Top"},{"x":192,"y":448,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":256,"y":448,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":320,"y":448,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":448,"y":128,"exts":{},"template":"Rocks_Top"},{"x":320,"y":576,"exts":{},"template":"Rocks_Top"},{"x":448,"y":576,"exts":{},"template":"Rocks"},{"x":384,"y":576,"exts":{},"template":"Rocks_Top"},{"x":64,"y":320,"exts":{},"template":"Rocks"},{"x":128,"y":320,"exts":{},"template":"Rocks"},{"x":192,"y":320,"exts":{},"template":"Rocks"},{"x":256,"y":320,"exts":{},"template":"Rocks"},{"x":256,"y":256,"exts":{},"template":"Rocks"},{"x":256,"y":192,"exts":{},"template":"Rocks"},{"x":256,"y":128,"exts":{},"template":"Rocks"},{"x":256,"y":64,"exts":{},"template":"Rocks"},{"x":256,"y":-128,"exts":{},"template":"Rocks"},{"x":64,"y":64,"exts":{},"template":"Rocks"},{"x":64,"y":128,"exts":{},"template":"Rocks"},{"x":64,"y":256,"exts":{},"template":"Rocks"},{"x":64,"y":256,"exts":{},"template":"Rocks"},{"x":192,"y":64,"exts":{},"template":"Rocks"},{"x":192,"y":128,"exts":{},"template":"Rocks"},{"x":192,"y":192,"exts":{},"template":"Rocks"},{"x":192,"y":256,"exts":{},"template":"Rocks"},{"x":192,"y":256,"exts":{},"template":"Rocks"},{"x":128,"y":192,"exts":{},"template":"Rocks"},{"x":128,"y":128,"exts":{},"template":"Rocks"},{"x":128,"y":256,"exts":{},"template":"Rocks"},{"x":384,"y":-64,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":448,"y":-64,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":512,"y":-128,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":576,"y":-192,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":640,"y":-192,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":704,"y":-192,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":768,"y":-256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":832,"y":-256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":896,"y":-256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":960,"y":-256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1024,"y":-256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1088,"y":-256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1152,"y":-320,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1216,"y":-384,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":320,"y":416,"exts":{},"template":"Rocks_Platform"},{"x":384,"y":256,"exts":{},"template":"Rocks_Platform"},{"x":384,"y":490,"exts":{},"template":"Rocks_Platform"},{"x":352,"y":416,"exts":{},"template":"shroom"},{"x":416,"y":256,"exts":{},"template":"shroom"},{"x":160,"y":32,"exts":{},"template":"GreenCrystal"},{"x":512,"y":704,"exts":{},"template":"waterAnim"},{"x":512,"y":672,"exts":{},"template":"waterAnim"},{"x":512,"y":640,"exts":{},"template":"waterAnim"},{"x":512,"y":608,"exts":{},"template":"waterAnim"},{"x":576,"y":704,"exts":{},"template":"waterAnim"},{"x":576,"y":672,"exts":{},"template":"waterAnim"},{"x":576,"y":640,"exts":{},"template":"waterAnim"},{"x":576,"y":608,"exts":{},"template":"waterAnim"},{"x":640,"y":704,"exts":{},"template":"waterAnim"},{"x":640,"y":672,"exts":{},"template":"waterAnim"},{"x":640,"y":640,"exts":{},"template":"waterAnim"},{"x":640,"y":608,"exts":{},"template":"waterAnim"},{"x":704,"y":704,"exts":{},"template":"waterAnim"},{"x":704,"y":672,"exts":{},"template":"waterAnim"},{"x":704,"y":640,"exts":{},"template":"waterAnim"},{"x":704,"y":608,"exts":{},"template":"waterAnim"},{"x":128,"y":0,"exts":{},"template":"rockMossAlt"},{"x":128,"y":64,"exts":{},"template":"Rocks"},{"x":960,"y":512,"exts":{},"template":"Rocks_Top"},{"x":1024,"y":416,"exts":{},"template":"Rocks_Top"},{"x":1088,"y":416,"exts":{},"template":"Rocks_Top"},{"x":1120,"y":416,"exts":{},"template":"shroom"},{"x":1344,"y":192,"exts":{},"template":"Rocks_Top"},{"x":1408,"y":192,"exts":{},"template":"Rocks_Top"},{"x":1472,"y":192,"exts":{},"template":"Rocks_Top"},{"x":832,"y":512,"exts":{},"template":"stoneCaveBR"},{"x":896,"y":512,"exts":{},"template":"Rocks_Top"},{"x":832,"y":576,"exts":{},"template":"Rocks_Top"},{"x":900,"y":512,"exts":{"textValue":"Используй отскок от стены! 💃"},"tx":0.5,"ty":0.5,"template":"sign"},{"x":1600,"y":192,"exts":{},"template":"Rocks"},{"x":1664,"y":192,"exts":{},"template":"Rocks"},{"x":1664,"y":128,"exts":{},"template":"Rocks"},{"x":1600,"y":128,"exts":{},"template":"Rocks"},{"x":1664,"y":64,"exts":{},"template":"Rocks_Platform"},{"x":768,"y":576,"exts":{},"template":"Rocks_Top"},{"x":1536,"y":-32,"exts":{},"template":"Rocks_Platform"},{"x":1152,"y":192,"exts":{},"template":"Checkpoint"},{"x":1152,"y":256,"exts":{},"template":"Rocks_Top"},{"x":2304,"y":-96,"exts":{},"template":"sova"},{"x":1536,"y":-256,"exts":{},"template":"GreenCrystal"},{"x":1728,"y":128,"exts":{},"template":"Rocks"},{"x":1728,"y":192,"exts":{},"template":"Rocks"},{"x":1728,"y":256,"exts":{},"template":"Rocks"},{"x":1728,"y":64,"exts":{},"template":"Rocks"},{"x":1728,"y":0,"exts":{},"template":"Rocks"},{"x":1696,"y":-64,"exts":{},"template":"Rocks_Platform"},{"x":1728,"y":-64,"exts":{},"template":"Rocks_Top"},{"x":1792,"y":-64,"exts":{},"template":"Rocks_Top"},{"x":1984,"y":192,"exts":{},"template":"Rocks_Top"},{"x":1920,"y":192,"exts":{},"template":"Rocks"},{"x":1856,"y":192,"exts":{},"template":"Rocks"},{"x":1792,"y":192,"exts":{},"template":"Rocks"},{"x":1888,"y":64,"exts":{"cgroup":""},"template":"GreenCrystal"},{"x":1856,"y":-32,"exts":{},"template":"Rocks_Top"},{"x":1856,"y":0,"exts":{},"template":"rockMossAlt"},{"x":2112,"y":192,"exts":{},"template":"waterAnim"},{"x":2176,"y":192,"exts":{},"template":"waterAnim"},{"x":2240,"y":192,"exts":{},"template":"waterAnim"},{"x":2304,"y":192,"exts":{},"template":"waterAnim"},{"x":2368,"y":192,"exts":{},"template":"waterAnim"},{"x":2432,"y":192,"exts":{},"template":"waterAnim"},{"x":2496,"y":192,"exts":{},"template":"waterAnim"},{"x":2560,"y":192,"exts":{},"template":"waterAnim"},{"x":2624,"y":192,"exts":{},"template":"waterAnim"},{"x":2688,"y":192,"exts":{},"template":"waterAnim"},{"x":2272,"y":160,"exts":{},"template":"Rocks_Platform"},{"x":2432,"y":128,"exts":{},"template":"Rocks_Platform"},{"x":2784,"y":128,"exts":{},"template":"Platform"},{"x":2752,"y":192,"exts":{},"template":"waterAnim"},{"x":2816,"y":192,"exts":{},"template":"waterAnim"},{"x":2880,"y":192,"exts":{},"template":"waterAnim"},{"x":2944,"y":192,"exts":{},"template":"waterAnim"},{"x":3008,"y":192,"exts":{},"template":"waterAnim"},{"x":3072,"y":192,"exts":{},"template":"waterAnim"},{"x":3136,"y":192,"exts":{},"template":"waterAnim"},{"x":3200,"y":192,"exts":{},"template":"waterAnim"},{"x":3264,"y":192,"exts":{},"template":"waterAnim"},{"x":3328,"y":192,"exts":{},"template":"waterAnim"},{"x":3392,"y":128,"exts":{},"template":"Rocks_Platform"},{"x":3392,"y":192,"exts":{},"template":"Rocks_Top"},{"x":3456,"y":192,"exts":{},"template":"Rocks_Top"},{"x":2080,"y":128,"exts":{},"template":"Checkpoint"},{"x":2464,"y":32,"exts":{},"template":"Heart"},{"x":2048,"y":192,"exts":{},"template":"Rocks_Top"},{"x":2112,"y":192,"exts":{},"template":"Rocks_Top"},{"x":3820,"y":97,"exts":{},"template":"sova"},{"x":3616,"y":192,"exts":{},"template":"shroom"},{"x":2304,"y":160,"exts":{"textValue":"😱 Прячься! 🙀"},"tx":0.5,"ty":0.5,"template":"sign"},{"x":3424,"y":96,"exts":{},"template":"Heart"},{"x":3584,"y":192,"exts":{},"template":"Rocks_Top"},{"x":3520,"y":192,"exts":{},"template":"Rocks_Top"},{"x":3744,"y":256,"exts":{},"template":"Rocks"},{"x":3744,"y":320,"exts":{},"template":"Rocks"},{"x":3584,"y":256,"exts":{},"template":"Rocks"},{"x":3584,"y":320,"exts":{},"template":"Rocks"},{"x":3584,"y":384,"exts":{},"template":"Rocks"},{"x":3584,"y":448,"exts":{},"template":"Rocks"},{"x":3584,"y":512,"exts":{},"template":"Rocks"},{"x":3584,"y":576,"exts":{},"template":"Rocks"},{"x":3744,"y":384,"exts":{},"template":"Rocks"},{"x":3744,"y":448,"exts":{},"template":"Rocks"},{"x":3744,"y":512,"exts":{},"template":"Rocks"},{"x":3584,"y":640,"exts":{},"template":"Rocks"},{"x":3584,"y":704,"exts":{},"template":"Rocks"},{"x":3584,"y":768,"exts":{},"template":"Rocks"},{"x":3648,"y":768,"exts":{},"template":"Rocks_Top"},{"x":3840,"y":768,"exts":{},"template":"Rocks_Top"},{"x":3904,"y":768,"exts":{},"template":"Rocks_Top"},{"x":3968,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4032,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4096,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4096,"y":768,"exts":{},"template":"wolf"},{"x":4160,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4224,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4288,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4352,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4416,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4480,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4544,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4608,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4608,"y":768,"exts":{},"template":"wolf2"},{"x":3776,"y":768,"exts":{},"template":"Rocks_Top"},{"x":4288,"y":544,"exts":{},"template":"GreenCrystal"},{"x":4672,"y":736,"exts":{},"template":"Rocks_Top"},{"x":4736,"y":736,"exts":{},"template":"Rocks_Top"},{"x":4800,"y":736,"exts":{},"template":"Rocks_Top"},{"x":4864,"y":736,"exts":{},"template":"Rocks_Top"},{"x":4896,"y":736,"exts":{},"template":"shroom"},{"x":4960,"y":544,"exts":{},"template":"Rocks_Platform"},{"x":5024,"y":544,"exts":{},"template":"Rocks_Platform"},{"x":5152,"y":480,"exts":{},"template":"Rocks_Platform"},{"x":5312,"y":544,"exts":{},"template":"Rocks_Platform"},{"x":5376,"y":544,"exts":{},"template":"Rocks_Platform"},{"x":5536,"y":480,"exts":{},"template":"Rocks_Platform"},{"x":5600,"y":480,"exts":{},"template":"Rocks_Platform"},{"x":5664,"y":480,"exts":{},"template":"Rocks_Platform"},{"x":5728,"y":480,"exts":{},"template":"Rocks_Platform"},{"x":5792,"y":480,"exts":{},"template":"Rocks_Platform"},{"x":5856,"y":480,"exts":{},"template":"Rocks_Platform"},{"x":5792,"y":480,"exts":{},"template":"wolf"},{"x":6016,"y":416,"exts":{},"template":"Rocks_Platform"},{"x":6112,"y":384,"exts":{},"template":"Rocks_Platform"},{"x":6272,"y":352,"exts":{},"template":"Rocks_Platform"},{"x":6336,"y":352,"exts":{},"template":"Rocks_Platform"},{"x":6400,"y":352,"exts":{},"template":"Rocks_Platform"},{"x":6464,"y":352,"exts":{},"template":"Rocks_Platform"},{"x":6240,"y":320,"exts":{},"template":"sova"},{"x":6464,"y":320,"exts":{},"template":"GreenCrystal"},{"x":6528,"y":352,"exts":{},"template":"Rocks_Platform"},{"x":6592,"y":352,"exts":{},"template":"Rocks_Platform"},{"x":6656,"y":736,"exts":{},"template":"Rocks_Top"},{"x":6656,"y":800,"exts":{},"template":"Rocks"},{"x":6656,"y":864,"exts":{},"template":"Rocks"},{"x":6656,"y":928,"exts":{},"template":"Rocks"},{"x":6656,"y":992,"exts":{},"template":"Rocks"},{"x":6720,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":6784,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":6848,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":6912,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":6976,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":7104,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":7360,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":7424,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":6880,"y":960,"exts":{},"template":"Exit"},{"x":7360,"y":928,"exts":{},"template":"ring"},{"x":6688,"y":288,"exts":{},"template":"Checkpoint"},{"x":6656,"y":352,"exts":{},"template":"Rocks_Platform"},{"x":2432,"y":-128,"exts":{},"template":"Rocks_Platform"},{"x":1216,"y":192,"exts":{},"template":"stoneCaveBR"},{"x":1248,"y":256,"exts":{"textValue":"Прыгни на врага сверху чтобы убить ☠️"},"tx":0.5,"ty":0.5,"template":"sign"},{"x":1216,"y":256,"exts":{},"template":"Rocks_Top"},{"x":1280,"y":192,"exts":{},"template":"Rocks_Top"},{"x":1088,"y":-448,"exts":{},"template":"Rocks"},{"x":640,"y":-320,"exts":{},"template":"Rocks"},{"x":576,"y":-320,"exts":{},"template":"Rocks"},{"x":1024,"y":-384,"exts":{},"template":"Rocks"},{"x":448,"y":-256,"exts":{},"template":"Rocks"},{"x":1152,"y":320,"exts":{},"template":"Rocks"},{"x":1152,"y":384,"exts":{},"template":"Rocks"},{"x":1024,"y":512,"exts":{},"template":"Rocks"},{"x":896,"y":576,"exts":{},"template":"Rocks"},{"x":1216,"y":320,"exts":{},"template":"Rocks"},{"x":1280,"y":320,"exts":{},"template":"Rocks"},{"x":1280,"y":256,"exts":{},"template":"Rocks"},{"x":1344,"y":256,"exts":{},"template":"Rocks"},{"x":1408,"y":256,"exts":{},"template":"Rocks"},{"x":1472,"y":256,"exts":{},"template":"Rocks"},{"x":1536,"y":256,"exts":{},"template":"Rocks"},{"x":1600,"y":256,"exts":{},"template":"Rocks"},{"x":1664,"y":256,"exts":{},"template":"Rocks"},{"x":1216,"y":384,"exts":{},"template":"Rocks"},{"x":1024,"y":480,"exts":{},"template":"Rocks"},{"x":128,"y":448,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":128,"y":576,"exts":{},"template":"Rocks_Top"},{"x":64,"y":576,"exts":{},"template":"Rocks_Top"},{"x":96,"y":512,"exts":{},"template":"start"},{"x":3840,"y":128,"exts":{},"template":"Rocks"},{"x":3808,"y":160,"exts":{},"template":"Rocks"},{"x":3904,"y":128,"exts":{},"template":"Rocks"},{"x":3904,"y":192,"exts":{},"template":"Rocks"},{"x":3840,"y":192,"exts":{},"template":"Rocks"},{"x":3808,"y":288,"exts":{},"template":"Rocks"},{"x":3872,"y":256,"exts":{},"template":"Rocks"},{"x":3808,"y":352,"exts":{},"template":"Rocks"},{"x":3936,"y":256,"exts":{},"template":"Rocks"},{"x":3872,"y":320,"exts":{},"template":"Rocks"},{"x":3808,"y":416,"exts":{},"template":"Rocks"},{"x":3840,"y":448,"exts":{},"template":"Rocks"},{"x":3808,"y":480,"exts":{},"template":"Rocks"},{"x":3872,"y":512,"exts":{},"template":"Rocks"},{"x":3840,"y":544,"exts":{},"template":"Rocks"},{"x":3808,"y":544,"exts":{},"template":"Rocks"},{"x":3520,"y":256,"exts":{},"template":"Rocks"},{"x":3456,"y":256,"exts":{},"template":"Rocks"},{"x":3328,"y":256,"exts":{},"template":"Rocks"},{"x":3264,"y":256,"exts":{},"template":"Rocks"},{"x":3200,"y":256,"exts":{},"template":"Rocks"},{"x":3136,"y":256,"exts":{},"template":"Rocks"},{"x":3072,"y":256,"exts":{},"template":"Rocks"},{"x":3008,"y":256,"exts":{},"template":"Rocks"},{"x":2944,"y":256,"exts":{},"template":"Rocks"},{"x":2880,"y":256,"exts":{},"template":"Rocks"},{"x":2816,"y":256,"exts":{},"template":"Rocks"},{"x":2752,"y":256,"exts":{},"template":"Rocks"},{"x":2688,"y":256,"exts":{},"template":"Rocks"},{"x":2624,"y":256,"exts":{},"template":"Rocks"},{"x":2560,"y":256,"exts":{},"template":"Rocks"},{"x":2496,"y":256,"exts":{},"template":"Rocks"},{"x":2432,"y":256,"exts":{},"template":"Rocks"},{"x":2368,"y":256,"exts":{},"template":"Rocks"},{"x":2304,"y":256,"exts":{},"template":"Rocks"},{"x":2240,"y":256,"exts":{},"template":"Rocks"},{"x":2176,"y":256,"exts":{},"template":"Rocks"},{"x":2112,"y":256,"exts":{},"template":"Rocks"},{"x":2048,"y":256,"exts":{},"template":"Rocks"},{"x":1984,"y":256,"exts":{},"template":"Rocks"},{"x":1920,"y":256,"exts":{},"template":"Rocks"},{"x":1856,"y":256,"exts":{},"template":"Rocks"},{"x":1856,"y":256,"exts":{},"template":"Rocks"},{"x":1792,"y":256,"exts":{},"template":"Rocks"},{"x":3392,"y":256,"exts":{},"template":"Rocks"},{"x":3520,"y":448,"exts":{},"template":"Rocks"},{"x":3520,"y":512,"exts":{},"template":"Rocks"},{"x":3520,"y":576,"exts":{},"template":"Rocks"},{"x":3520,"y":640,"exts":{},"template":"Rocks"},{"x":3520,"y":704,"exts":{},"template":"Rocks"},{"x":3520,"y":768,"exts":{},"template":"Rocks"},{"x":3520,"y":768,"exts":{},"template":"Rocks"},{"x":3520,"y":320,"exts":{},"template":"Rocks"},{"x":3520,"y":384,"exts":{},"template":"Rocks"},{"x":3872,"y":64,"exts":{},"template":"Rocks_Top"},{"x":3744,"y":160,"exts":{},"template":"Rocks_Top"},{"x":3808,"y":224,"exts":{},"template":"Rocks"},{"x":3744,"y":224,"exts":{},"template":"Rocks"},{"x":4672,"y":1856,"exts":{},"template":"DieBlock"},{"x":4736,"y":1856,"exts":{},"template":"DieBlock"},{"x":4800,"y":1856,"exts":{},"template":"DieBlock"},{"x":4928,"y":1920,"exts":{},"template":"DieBlock"},{"x":4992,"y":1920,"exts":{},"template":"DieBlock"},{"x":5056,"y":1856,"exts":{},"template":"DieBlock"},{"x":5120,"y":1856,"exts":{},"template":"DieBlock"},{"x":5184,"y":1856,"exts":{},"template":"DieBlock"},{"x":5248,"y":1856,"exts":{},"template":"DieBlock"},{"x":5312,"y":1856,"exts":{},"template":"DieBlock"},{"x":5376,"y":1856,"exts":{},"template":"DieBlock"},{"x":5504,"y":1856,"exts":{},"template":"DieBlock"},{"x":5568,"y":1856,"exts":{},"template":"DieBlock"},{"x":5632,"y":1856,"exts":{},"template":"DieBlock"},{"x":5696,"y":1856,"exts":{},"template":"DieBlock"},{"x":5760,"y":1856,"exts":{},"template":"DieBlock"},{"x":5824,"y":1856,"exts":{},"template":"DieBlock"},{"x":5952,"y":1856,"exts":{},"template":"DieBlock"},{"x":6016,"y":1856,"exts":{},"template":"DieBlock"},{"x":6144,"y":1920,"exts":{},"template":"DieBlock"},{"x":6208,"y":1920,"exts":{},"template":"DieBlock"},{"x":6272,"y":1920,"exts":{},"template":"DieBlock"},{"x":6336,"y":1920,"exts":{},"template":"DieBlock"},{"x":6400,"y":1920,"exts":{},"template":"DieBlock"},{"x":6464,"y":1920,"exts":{},"template":"DieBlock"},{"x":6528,"y":1856,"exts":{},"template":"DieBlock"},{"x":6592,"y":1856,"exts":{},"template":"DieBlock"},{"x":6656,"y":1856,"exts":{},"template":"DieBlock"},{"x":6720,"y":1856,"exts":{},"template":"DieBlock"},{"x":6784,"y":1856,"exts":{},"template":"DieBlock"},{"x":6848,"y":1856,"exts":{},"template":"DieBlock"},{"x":6912,"y":1856,"exts":{},"template":"DieBlock"},{"x":6976,"y":1856,"exts":{},"template":"DieBlock"},{"x":6080,"y":1920,"exts":{},"template":"DieBlock"},{"x":5888,"y":1856,"exts":{},"template":"DieBlock"},{"x":5440,"y":1856,"exts":{},"template":"DieBlock"},{"x":4864,"y":1920,"exts":{},"template":"DieBlock"},{"x":4608,"y":1856,"exts":{},"template":"DieBlock"},{"x":64,"y":768,"exts":{},"template":"bgH"},{"x":-384,"y":-64,"exts":{},"template":"bgW"},{"x":-384,"y":-1344,"exts":{},"template":"bgW"},{"x":64,"y":640,"exts":{},"template":"bgW"},{"x":0,"y":-896,"exts":{},"template":"bgH"},{"x":64,"y":192,"exts":{},"template":"Rocks"},{"x":2240,"y":320,"exts":{},"template":"bgH"},{"x":1216,"y":320,"exts":{},"template":"bgH"},{"x":6656,"y":1024,"exts":{},"template":"Rocks"},{"x":6656,"y":1088,"exts":{},"template":"bgH"},{"x":7936,"y":256,"exts":{},"template":"bgW"},{"x":768,"y":640,"exts":{},"template":"bgW"},{"x":1152,"y":448,"exts":{},"template":"Rocks"},{"x":1152,"y":512,"exts":{},"template":"Rocks"},{"x":1088,"y":512,"exts":{},"template":"Rocks"},{"x":1088,"y":448,"exts":{},"template":"Rocks"},{"x":960,"y":576,"exts":{},"template":"Rocks"},{"x":1024,"y":576,"exts":{},"template":"Rocks"},{"x":1088,"y":576,"exts":{},"template":"Rocks"},{"x":1152,"y":576,"exts":{},"template":"Rocks"},{"x":0,"y":-1408,"exts":{},"template":"bgW"},{"x":-192,"y":-768,"exts":{},"template":"bgH"},{"x":448,"y":-320,"exts":{},"template":"Rocks"},{"x":512,"y":-320,"exts":{},"template":"Rocks"},{"x":192,"y":-128,"exts":{},"template":"Rocks"},{"x":128,"y":-128,"exts":{},"template":"Rocks"},{"x":64,"y":-128,"exts":{},"template":"Rocks"},{"x":-832,"y":-64,"exts":{},"template":"bgW"},{"x":-832,"y":-1344,"exts":{},"template":"bgW"},{"x":1344,"y":768,"exts":{},"template":"bgH"},{"x":2304,"y":768,"exts":{},"template":"bgH"},{"x":3584,"y":832,"exts":{},"template":"bgH"},{"x":4800,"y":832,"exts":{},"template":"Rocks"},{"x":4800,"y":768,"exts":{},"template":"Rocks"},{"x":4736,"y":768,"exts":{},"template":"Rocks"},{"x":4672,"y":768,"exts":{},"template":"Rocks"},{"x":4544,"y":1792,"exts":{},"template":"DieBlock"},{"x":4544,"y":1728,"exts":{},"template":"DieBlock"},{"x":4544,"y":1664,"exts":{},"template":"DieBlock"},{"x":4544,"y":1600,"exts":{},"template":"DieBlock"},{"x":4544,"y":1536,"exts":{},"template":"DieBlock"},{"x":4544,"y":1472,"exts":{},"template":"DieBlock"},{"x":1536,"y":192,"exts":{},"template":"Rocks_Top"},{"x":1536,"y":192,"exts":{},"template":"wolf2"},{"x":3712,"y":704,"exts":{},"template":"Checkpoint"},{"x":3712,"y":768,"exts":{},"template":"Rocks_Top"},{"x":128,"y":576,"exts":{},"template":"Katya"},{"x":128,"y":-64,"exts":{"cgroup":""},"template":"Rocks"},{"x":192,"y":-64,"exts":{"cgroup":""},"template":"Rocks"},{"x":256,"y":-64,"exts":{"cgroup":""},"template":"Rocks"},{"x":192,"y":0,"exts":{"cgroup":""},"template":"Rocks"},{"x":256,"y":0,"exts":{"cgroup":""},"template":"Rocks"},{"x":1856,"y":64,"exts":{"cgroup":""},"template":"Rocks"},{"x":1920,"y":64,"exts":{"cgroup":""},"template":"Rocks"},{"x":1920,"y":128,"exts":{"cgroup":""},"template":"Rocks"},{"x":64,"y":-64,"exts":{},"template":"Rocks"},{"x":64,"y":0,"exts":{},"template":"Rocks"},{"x":1856,"y":128,"exts":{"cgroup":""},"template":"Rocks"},{"x":1792,"y":0,"exts":{},"template":"Rocks"},{"x":1792,"y":64,"exts":{},"template":"Rocks"},{"x":1792,"y":128,"exts":{},"template":"Rocks"},{"x":1920,"y":0,"exts":{},"template":"Rocks_Top"},{"x":256,"y":576,"exts":{},"template":"Rocks_Top"},{"x":425,"y":577,"exts":{"textValue":"Нажми R чтобы начать уровень сначала ♻️"},"tx":0.5,"ty":0.5,"template":"sign"},{"x":512,"y":128,"exts":{},"template":"Rocks_Top"},{"x":7043,"y":1024,"exts":{},"template":"rat"},{"x":7168,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":7232,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":350,"y":100,"exts":{"textValue":"Собери все кристаллы на уровне и получишь +1 жизнь в следующем ✅"},"tx":0.5,"ty":0.5,"template":"sign"},{"x":320,"y":96,"exts":{},"template":"Rocks_Platform"},{"x":7296,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":7488,"y":96,"exts":{},"template":"bgW"},{"x":5728,"y":256,"exts":{},"template":"Heart"},{"x":6656,"y":1536,"exts":{},"template":"bgH"},{"x":3168,"y":1216,"exts":{},"template":"bgH"},{"x":1888,"y":1216,"exts":{},"template":"bgH"},{"x":7040,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":8320,"y":-192,"exts":{},"template":"DieBlock"},{"x":8320,"y":-128,"exts":{},"template":"DieBlock"},{"x":8320,"y":-64,"exts":{},"template":"DieBlock"},{"x":8320,"y":0,"exts":{},"template":"DieBlock"},{"x":8320,"y":64,"exts":{},"template":"DieBlock"},{"x":8320,"y":128,"exts":{},"template":"DieBlock"},{"x":8320,"y":192,"exts":{},"template":"DieBlock"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"BG","extends":{}},{"depth":0,"texture":"cloud","extends":{"repeat":"no-repeat","shiftX":1800,"movementX":1,"parallaxX":1.17,"shiftY":-350}},{"depth":0,"texture":"cloud","extends":{"repeat":"no-repeat","scaleX":0.4,"shiftX":700,"shiftY":320,"scaleY":0.4}},{"depth":0,"texture":"cloud","extends":{"repeat":"no-repeat","shiftX":1000,"scaleX":0.8,"scaleY":0.8,"shiftY":-200}},{"depth":0,"texture":"cloud","extends":{"repeat":"no-repeat","shiftX":5000}},{"depth":0,"texture":"cloud","extends":{"repeat":"no-repeat","shiftX":5700,"shiftY":100}},{"depth":0,"texture":"cloud","extends":{"repeat":"no-repeat","movementX":0,"shiftX":6950,"shiftY":500}},{"depth":0,"texture":"cloud","extends":{"repeat":"no-repeat","scaleX":0.7,"scaleY":0.7,"shiftX":3000,"shiftY":-120}},{"depth":0,"texture":"cloud","extends":{"repeat":"no-repeat","scaleX":0.6,"scaleY":0.6,"shiftX":4200,"shiftY":300}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        PauseHandler()
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.rings = 0;
this.countRings = 1;
this.nextRoom = 'Level_02';
this.sound='lvl1';
ct.sound.stop(this.sound)
ct.sound.spawn(this.sound, {volume:0.2})
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['Level_02'] = {
    name: 'Level_02',
    width: 1248,
    height: 702,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":192,"y":448,"exts":{},"template":"castleRight"},{"x":384,"y":-592,"exts":{"Depth":-10},"template":"bgW"},{"x":320,"y":224,"exts":{},"template":"castleLeft"},{"x":320,"y":384,"exts":{},"template":"castleLeft"},{"x":320,"y":624,"exts":{},"template":"Spikes"},{"x":256,"y":624,"exts":{},"template":"Spikes"},{"x":192,"y":624,"exts":{},"template":"Spikes"},{"x":128,"y":448,"exts":{},"template":"castleMid"},{"x":64,"y":448,"exts":{},"template":"castleMid"},{"x":-448,"y":688,"exts":{},"template":"bgH"},{"x":-1728,"y":688,"exts":{},"template":"bgH"},{"x":128,"y":624,"exts":{},"template":"Spikes"},{"x":64,"y":624,"exts":{},"template":"Spikes"},{"x":0,"y":624,"exts":{},"template":"Spikes"},{"x":-64,"y":624,"exts":{},"template":"Spikes"},{"x":-128,"y":624,"exts":{},"template":"Spikes"},{"x":-192,"y":624,"exts":{},"template":"Spikes"},{"x":-256,"y":624,"exts":{},"template":"Spikes"},{"x":-320,"y":624,"exts":{},"template":"Spikes"},{"x":-384,"y":624,"exts":{},"template":"Spikes"},{"x":320,"y":64,"exts":{},"template":"castleLeft"},{"x":144,"y":144,"exts":{},"template":"castleHalf"},{"x":144,"y":-16,"exts":{},"template":"castleHalf"},{"x":144,"y":304,"exts":{},"template":"castleHalf"},{"x":400,"y":304,"exts":{},"template":"fire"},{"x":400,"y":-32,"exts":{},"template":"fire"},{"x":32,"y":80,"exts":{},"template":"start"},{"x":320,"y":-96,"exts":{},"template":"castleLeft"},{"x":144,"y":-176,"exts":{},"template":"castleHalf"},{"x":320,"y":-256,"exts":{},"template":"castleLeft"},{"x":400,"y":-352,"exts":{},"template":"fire"},{"x":144,"y":-320,"exts":{},"template":"castleHalf"},{"x":-32,"y":-368,"exts":{},"template":"castleHalf"},{"x":64,"y":-352,"exts":{},"template":"fire"},{"x":-832,"y":400,"exts":{},"template":"bgW"},{"x":-390,"y":400,"exts":{},"template":"castleRight"},{"x":-448,"y":400,"exts":{"param":"ratsBirth"},"template":"rat"},{"x":-448,"y":240,"exts":{},"template":"Rocks"},{"x":-704,"y":240,"exts":{},"template":"Rocks"},{"x":-832,"y":240,"exts":{},"template":"Rocks"},{"x":-576,"y":240,"exts":{},"template":"Rocks"},{"x":-832,"y":-1040,"exts":{},"template":"bgW"},{"x":-672,"y":128,"exts":{"alpha":0.1},"template":"GreenCrystal"},{"x":-1632,"y":688,"exts":{},"template":"sliz"},{"x":-768,"y":400,"exts":{"param":"ratsBirth"},"template":"rat"},{"x":-336,"y":400,"exts":{"textValue":"Осторожно! Мыши плодятся 😾"},"tx":0.5,"ty":0.5,"template":"sign"},{"x":-4992,"y":672,"exts":{},"template":"bgH"},{"x":-3712,"y":1056,"exts":{},"template":"Spikes"},{"x":-3648,"y":1056,"exts":{},"template":"Spikes"},{"x":-3584,"y":1056,"exts":{},"template":"Spikes"},{"x":-3520,"y":1056,"exts":{},"template":"Spikes"},{"x":-3456,"y":1056,"exts":{},"template":"Spikes"},{"x":-3392,"y":1056,"exts":{},"template":"Spikes"},{"x":-3328,"y":1056,"exts":{},"template":"Spikes"},{"x":-3264,"y":1056,"exts":{},"template":"Spikes"},{"x":-3200,"y":1056,"exts":{},"template":"Spikes"},{"x":-3136,"y":1056,"exts":{},"template":"Spikes"},{"x":-3072,"y":1056,"exts":{},"template":"Spikes"},{"x":-3008,"y":1056,"exts":{},"template":"Spikes"},{"x":-2944,"y":1056,"exts":{},"template":"Spikes"},{"x":-2880,"y":1056,"exts":{},"template":"Spikes"},{"x":-2816,"y":1056,"exts":{},"template":"Spikes"},{"x":-2752,"y":1056,"exts":{},"template":"Spikes"},{"x":-2688,"y":1056,"exts":{},"template":"Spikes"},{"x":-2624,"y":1056,"exts":{},"template":"Spikes"},{"x":-2560,"y":1056,"exts":{},"template":"Spikes"},{"x":-2496,"y":1056,"exts":{},"template":"Spikes"},{"x":-2432,"y":1056,"exts":{},"template":"Spikes"},{"x":-2368,"y":1056,"exts":{},"template":"Spikes"},{"x":-2304,"y":1056,"exts":{},"template":"Spikes"},{"x":-2240,"y":1056,"exts":{},"template":"Spikes"},{"x":-2176,"y":1056,"exts":{},"template":"Spikes"},{"x":-2112,"y":1056,"exts":{},"template":"Spikes"},{"x":-2048,"y":1056,"exts":{},"template":"Spikes"},{"x":-1984,"y":1056,"exts":{},"template":"Spikes"},{"x":-1920,"y":1056,"exts":{},"template":"Spikes"},{"x":-1856,"y":1056,"exts":{},"template":"Spikes"},{"x":-1792,"y":1056,"exts":{},"template":"Spikes"},{"x":-3200,"y":736,"exts":{},"template":"fire"},{"x":-2176,"y":736,"exts":{"depth":"0"},"template":"fire"},{"x":-2048,"y":768,"exts":{},"template":"Platform"},{"x":-4384,"y":448,"exts":{},"template":"fire"},{"x":-4448,"y":672,"exts":{},"template":"sliz"},{"x":-4992,"y":608,"exts":{},"template":"castleRight"},{"x":-5088,"y":544,"exts":{},"template":"castleRight"},{"x":-5184,"y":480,"exts":{},"template":"castleRight"},{"x":-5280,"y":416,"exts":{},"template":"castleRight"},{"x":-5728,"y":-160,"exts":{},"template":"bgW"},{"x":-5056,"y":1056,"exts":{},"template":"Spikes"},{"x":-5120,"y":1056,"exts":{},"template":"Spikes"},{"x":-5184,"y":1056,"exts":{},"template":"Spikes"},{"x":-5248,"y":1056,"exts":{},"template":"Spikes"},{"x":-5280,"y":1056,"exts":{},"template":"Spikes"},{"x":-5152,"y":-960,"exts":{},"template":"bgW"},{"x":-5216,"y":-448,"exts":{},"template":"castleLeft"},{"x":-5216,"y":-480,"exts":{},"template":"fire"},{"x":-5696,"y":-160,"exts":{"param":"ratsBirth2"},"template":"rat"},{"x":-5312,"y":-160,"exts":{"param":"ratsBirth2"},"template":"rat"},{"x":-5490,"y":-230,"exts":{},"template":"Checkpoint"},{"x":-5792,"y":-160,"exts":{},"template":"castleHalf"},{"x":-5856,"y":-160,"exts":{},"template":"castleHalf"},{"x":-5920,"y":-160,"exts":{},"template":"castleHalf"},{"x":-6048,"y":-160,"exts":{},"template":"castleRight"},{"x":-5792,"y":-96,"exts":{},"template":"waterAnim"},{"x":-5856,"y":-96,"exts":{},"template":"waterAnim"},{"x":-5920,"y":-96,"exts":{},"template":"waterAnim"},{"x":-5984,"y":-96,"exts":{},"template":"waterAnim"},{"x":-6048,"y":-96,"exts":{},"template":"waterAnim"},{"x":-6112,"y":-96,"exts":{},"template":"waterAnim"},{"x":-6176,"y":-96,"exts":{},"template":"waterAnim"},{"x":-6368,"y":-96,"exts":{},"template":"waterAnim"},{"x":-6432,"y":-96,"exts":{},"template":"waterAnim"},{"x":-6944,"y":-896,"exts":{},"template":"bgW"},{"x":-6290,"y":-96,"exts":{},"template":"castleHalf"},{"x":-6304,"y":-96,"exts":{},"template":"waterAnim"},{"x":-6240,"y":-96,"exts":{},"template":"waterAnim"},{"x":-6496,"y":-128,"exts":{},"template":"castleRight"},{"x":-6496,"y":-96,"exts":{},"template":"waterAnim"},{"x":-6976,"y":-32,"exts":{},"template":"bgH"},{"x":-6368,"y":-288,"exts":{},"template":"castleHalf"},{"x":-6368,"y":-448,"exts":{},"template":"castleHalf"},{"x":-6368,"y":-576,"exts":{},"template":"castleHalf"},{"x":-6208,"y":-640,"exts":{},"template":"castleHalf"},{"x":-6048,"y":-704,"exts":{},"template":"castleHalf"},{"x":-5888,"y":-768,"exts":{},"template":"castleHalf"},{"x":-384,"y":224,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":-320,"y":288,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":-5216,"y":-128,"exts":{"param":"ratsBirth2"},"template":"activeBlock"},{"x":-5280,"y":-128,"exts":{"param":"ratsBirth2"},"template":"activeBlock"},{"x":-5984,"y":-160,"exts":{},"template":"castleHalf"},{"x":-5680,"y":-864,"exts":{},"template":"skelet"},{"x":-5800,"y":416,"exts":{},"template":"skelet"},{"x":-5936,"y":-784,"exts":{},"template":"bat"},{"x":-5440,"y":-864,"exts":{},"template":"skelet"},{"x":-5280,"y":-784,"exts":{},"template":"castleHalf"},{"x":-5712,"y":-944,"exts":{},"template":"rockMossAlt"},{"x":-5472,"y":-944,"exts":{},"template":"rockMossAlt"},{"x":-4816,"y":-1024,"exts":{},"template":"Exit"},{"x":-7040,"y":336,"exts":{},"template":"DieBlock"},{"x":-7104,"y":336,"exts":{},"template":"DieBlock"},{"x":-7168,"y":336,"exts":{},"template":"DieBlock"},{"x":-7232,"y":336,"exts":{},"template":"DieBlock"},{"x":-7296,"y":336,"exts":{},"template":"DieBlock"},{"x":-7360,"y":336,"exts":{},"template":"DieBlock"},{"x":-7424,"y":336,"exts":{},"template":"DieBlock"},{"x":-7488,"y":336,"exts":{},"template":"DieBlock"},{"x":-7552,"y":336,"exts":{},"template":"DieBlock"},{"x":-6592,"y":-928,"exts":{},"template":"GreenCrystal"},{"x":-6976,"y":-64,"exts":{},"template":"Heart"},{"x":-4704,"y":-128,"exts":{},"template":"bgH"},{"x":-4704,"y":-960,"exts":{"cgroup":""},"template":"castleMid"},{"x":-4704,"y":-896,"exts":{"cgroup":""},"template":"castleCenter"},{"x":-3680,"y":-992,"exts":{},"template":"GreenCrystal"},{"x":-3616,"y":-1030,"exts":{},"template":"Checkpoint"},{"x":-4704,"y":-832,"exts":{"cgroup":""},"template":"castleCenter"},{"x":-4704,"y":-768,"exts":{"cgroup":""},"template":"castleCenter"},{"x":-4704,"y":-704,"exts":{"cgroup":""},"template":"castleCenter"},{"x":-4704,"y":-640,"exts":{"cgroup":""},"template":"castleCenter"},{"x":-4640,"y":-960,"exts":{},"template":"bgH"},{"x":-4496,"y":-400,"exts":{},"template":"fire"},{"x":-4080,"y":-400,"exts":{},"template":"fire"},{"x":-3648,"y":-400,"exts":{},"template":"fire"},{"x":-4336,"y":-128,"exts":{},"template":"sliz"},{"x":-3424,"y":-172,"exts":{},"template":"castleMid"},{"x":-3354,"y":-210,"exts":{},"template":"castleMid"},{"x":-3284,"y":-248,"exts":{},"template":"castleMid"},{"x":-3214,"y":-289,"exts":{},"template":"castleMid"},{"x":-3144,"y":-325,"exts":{},"template":"castleMid"},{"x":-3369,"y":-1792,"exts":{},"template":"bgW"},{"x":-3435,"y":-1401,"exts":{},"template":"castleLeft"},{"x":-3434,"y":-1443,"exts":{},"template":"fire"},{"x":-3074,"y":-352,"exts":{},"template":"castleMid"},{"x":-3008,"y":-352,"exts":{},"template":"castleMid"},{"x":-2944,"y":-352,"exts":{},"template":"castleMid"},{"x":-2880,"y":-352,"exts":{},"template":"shroom"},{"x":-3374,"y":-112,"exts":{},"template":"skelet"},{"x":-3232,"y":-192,"exts":{},"template":"skelet"},{"x":-3088,"y":-272,"exts":{},"template":"skelet"},{"x":-2928,"y":-1408,"exts":{},"template":"castleRight"},{"x":-2896,"y":-1440,"exts":{},"template":"fire"},{"x":-2438,"y":-721,"exts":{},"template":"skelet"},{"x":-2667,"y":-611,"exts":{},"template":"skelet"},{"x":-2702,"y":-688,"exts":{},"template":"rockMossAlt"},{"x":-2471,"y":-797,"exts":{},"template":"rockMossAlt"},{"x":-2254,"y":-819,"exts":{},"template":"skelet"},{"x":-2289,"y":-895,"exts":{},"template":"rockMossAlt"},{"x":-1920,"y":-640,"exts":{},"template":"castleMid"},{"x":-1792,"y":-640,"exts":{},"template":"castleMid"},{"x":-1600,"y":-640,"exts":{},"template":"castleMid"},{"x":-1536,"y":-640,"exts":{},"template":"castleMid"},{"x":-1408,"y":-640,"exts":{},"template":"castleRight"},{"x":-1472,"y":-640,"exts":{"param":"ratsBirth3"},"template":"rat"},{"x":-1984,"y":-640,"exts":{},"template":"castleMid"},{"x":-2048,"y":-640,"exts":{},"template":"castleLeft"},{"x":-1664,"y":-640,"exts":{"param":"ratsBirth3"},"template":"rat"},{"x":-1984,"y":-704,"exts":{"param":"ratsBirth3"},"template":"activeBlock"},{"x":-2048,"y":-768,"exts":{"param":"ratsBirth3"},"template":"activeBlock"},{"x":-1856,"y":-640,"exts":{},"template":"castleMid"},{"x":-1664,"y":-640,"exts":{},"template":"castleMid"},{"x":-1472,"y":-640,"exts":{},"template":"castleMid"},{"x":-1152,"y":-384,"exts":{},"template":"castleHalf"},{"x":-1216,"y":-384,"exts":{},"template":"castleLeft"},{"x":-1088,"y":-384,"exts":{},"template":"castleRight"},{"x":-1120,"y":-439,"exts":{},"template":"ring"},{"x":-179,"y":-82,"exts":{},"template":"bat"},{"x":-5061,"y":417,"exts":{},"template":"Heart"},{"x":-2885,"y":-554,"exts":{},"template":"Heart"},{"x":-2744,"y":-309,"exts":{},"template":"bat"},{"x":-1728,"y":-640,"exts":{"param":"ratsBirth3"},"template":"rat"},{"x":-1728,"y":-640,"exts":{},"template":"castleMid"},{"x":832,"y":1088,"exts":{},"template":"DieBlock"},{"x":960,"y":1088,"exts":{},"template":"DieBlock"},{"x":896,"y":1088,"exts":{},"template":"DieBlock"},{"x":1024,"y":1088,"exts":{},"template":"DieBlock"},{"x":1088,"y":1088,"exts":{},"template":"DieBlock"},{"x":1152,"y":1088,"exts":{},"template":"DieBlock"},{"x":1216,"y":1088,"exts":{},"template":"DieBlock"},{"x":1280,"y":1088,"exts":{},"template":"DieBlock"},{"x":1408,"y":1088,"exts":{},"template":"DieBlock"},{"x":1344,"y":1088,"exts":{},"template":"DieBlock"},{"x":1472,"y":1088,"exts":{},"template":"DieBlock"},{"x":1536,"y":1088,"exts":{},"template":"DieBlock"},{"x":1600,"y":1088,"exts":{},"template":"DieBlock"},{"x":1664,"y":1088,"exts":{},"template":"DieBlock"},{"x":-448,"y":128,"exts":{},"template":"Rocks"},{"x":-448,"y":64,"exts":{},"template":"Rocks"},{"x":-448,"y":0,"exts":{},"template":"Rocks"},{"x":-448,"y":-64,"exts":{},"template":"Rocks"},{"x":64,"y":0,"exts":{},"template":"Katya"},{"x":-896,"y":256,"exts":{},"template":"Heart"},{"x":-895,"y":400,"exts":{},"template":"Rocks"},{"x":-959,"y":400,"exts":{},"template":"Rocks"},{"x":-1023,"y":400,"exts":{},"template":"castleLeft"},{"x":-1016,"y":331,"exts":{},"template":"Checkpoint"},{"x":-900,"y":620,"exts":{},"template":"castleMid"},{"x":-3520,"y":768,"exts":{},"template":"Platform"},{"x":-3648,"y":704,"exts":{},"template":"castleRight"},{"x":-3712,"y":704,"exts":{},"template":"castleHalf"},{"x":0,"y":448,"exts":{},"template":"castleLeft"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"bg_castle","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        PauseHandler()
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.rings = 1;
this.countRings = 2;
this.prevRoom = 'Level_01';
this.nextRoom = 'Level_03';
this.sound = 'lvl2';
ct.sound.stop(this.sound)
ct.sound.spawn(this.sound, {volume:0.2})
inGameRoomStart(this);
this.activeFlags = [];
this.soundFlag = true;
    },
    extends: {}
}
ct.rooms.templates['Level_03'] = {
    name: 'Level_03',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":-448,"y":-576,"exts":{},"template":"bgW"},{"x":-448,"y":704,"exts":{},"template":"bgW"},{"x":-704,"y":576,"exts":{},"template":"bgH"},{"x":576,"y":512,"exts":{},"template":"Rocks_Top"},{"x":640,"y":512,"exts":{},"template":"Rocks_Top"},{"x":704,"y":512,"exts":{},"template":"Rocks_Top"},{"x":768,"y":512,"exts":{},"template":"Rocks_Top"},{"x":832,"y":512,"exts":{},"template":"Rocks_Top"},{"x":512,"y":512,"exts":{},"template":"Rocks_Top"},{"x":448,"y":512,"exts":{},"template":"Rocks_Top"},{"x":384,"y":512,"exts":{},"template":"Rocks_Top"},{"x":320,"y":512,"exts":{},"template":"Rocks_Top"},{"x":256,"y":512,"exts":{},"template":"Rocks_Top"},{"x":192,"y":512,"exts":{},"template":"Rocks_Top"},{"x":128,"y":512,"exts":{},"template":"Rocks_Top"},{"x":64,"y":512,"exts":{},"template":"Rocks_Top"},{"x":0,"y":512,"exts":{},"template":"Rocks_Top"},{"x":896,"y":448,"exts":{},"template":"Rocks"},{"x":896,"y":512,"exts":{},"template":"Rocks"},{"x":960,"y":512,"exts":{},"template":"Rocks"},{"x":1024,"y":512,"exts":{},"template":"Rocks"},{"x":1088,"y":512,"exts":{},"template":"Rocks"},{"x":1152,"y":512,"exts":{},"template":"Rocks"},{"x":1152,"y":448,"exts":{},"template":"Rocks"},{"x":1216,"y":448,"exts":{},"template":"Rocks"},{"x":1280,"y":448,"exts":{},"template":"Rocks"},{"x":1344,"y":448,"exts":{},"template":"Rocks"},{"x":960,"y":448,"exts":{},"template":"Rocks_Top"},{"x":1024,"y":448,"exts":{},"template":"Rocks_Top"},{"x":1088,"y":448,"exts":{},"template":"Rocks_Top"},{"x":1152,"y":384,"exts":{},"template":"Rocks_Top"},{"x":1216,"y":384,"exts":{},"template":"Rocks_Top"},{"x":1280,"y":384,"exts":{},"template":"Rocks_Top"},{"x":1344,"y":320,"exts":{},"template":"Rocks_Top"},{"x":1408,"y":320,"exts":{},"template":"Rocks_Top"},{"x":1344,"y":384,"exts":{},"template":"Rocks"},{"x":1472,"y":256,"exts":{},"template":"Rocks"},{"x":1472,"y":192,"exts":{},"template":"Rocks"},{"x":1472,"y":128,"exts":{},"template":"Rocks_Top"},{"x":1472,"y":320,"exts":{},"template":"Rocks"},{"x":1408,"y":384,"exts":{},"template":"Rocks"},{"x":1472,"y":384,"exts":{},"template":"Rocks"},{"x":1536,"y":192,"exts":{},"template":"Rocks"},{"x":1536,"y":256,"exts":{},"template":"Rocks"},{"x":1536,"y":320,"exts":{},"template":"Rocks"},{"x":1536,"y":384,"exts":{},"template":"Rocks"},{"x":1536,"y":128,"exts":{},"template":"Rocks"},{"x":1536,"y":64,"exts":{},"template":"Rocks"},{"x":1536,"y":0,"exts":{},"template":"Rocks"},{"x":1600,"y":0,"exts":{},"template":"Rocks"},{"x":1664,"y":0,"exts":{},"template":"Rocks"},{"x":1536,"y":-64,"exts":{},"template":"Rocks_Top"},{"x":1600,"y":-64,"exts":{},"template":"Rocks_Top"},{"x":1664,"y":-64,"exts":{},"template":"Rocks_Top"},{"x":1728,"y":0,"exts":{},"template":"Rocks_Top"},{"x":1856,"y":0,"exts":{},"template":"Rocks_Top"},{"x":1920,"y":0,"exts":{},"template":"Rocks_Top"},{"x":1024,"y":-64,"exts":{},"template":"castleRight"},{"x":576,"y":-1152,"exts":{},"template":"bgW"},{"x":-512,"y":-256,"exts":{},"template":"bgH"},{"x":64,"y":256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":128,"y":256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":192,"y":256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":256,"y":256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":320,"y":256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":384,"y":256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":448,"y":256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":512,"y":256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":576,"y":256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":640,"y":256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":704,"y":256,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":832,"y":192,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":896,"y":192,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":960,"y":192,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1024,"y":192,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1408,"y":320,"exts":{},"template":"shroom"},{"x":2560,"y":-704,"exts":{},"template":"bgW"},{"x":1971,"y":0,"exts":{},"template":"shroom"},{"x":903,"y":-868,"exts":{},"template":"bgH"},{"x":1946,"y":-297,"exts":{},"template":"Platform"},{"x":1505,"y":129,"exts":{},"template":"shroom"},{"x":1053,"y":-92,"exts":{},"template":"GreenCrystal"},{"x":2496,"y":-128,"exts":{},"template":"Rocks_Platform"},{"x":2509,"y":-128,"exts":{},"template":"shroom"},{"x":2496,"y":-640,"exts":{},"tr":180,"template":"Spikes"},{"x":2560,"y":-640,"exts":{},"tr":180,"template":"Spikes"},{"x":2432,"y":-640,"exts":{},"tr":180,"template":"Spikes"},{"x":2368,"y":-640,"exts":{},"tr":180,"template":"Spikes"},{"x":2304,"y":-640,"exts":{},"tr":180,"template":"Spikes"},{"x":2240,"y":-640,"exts":{},"tr":180,"template":"Spikes"},{"x":2171,"y":-774,"exts":{},"template":"rockMossAlt"},{"x":2221,"y":-773,"exts":{},"template":"rockMossAlt"},{"x":2273,"y":-772,"exts":{},"template":"rockMossAlt"},{"x":2327,"y":-774,"exts":{},"template":"rockMossAlt"},{"x":2378,"y":-774,"exts":{},"template":"rockMossAlt"},{"x":2430,"y":-774,"exts":{},"template":"rockMossAlt"},{"x":2484,"y":-774,"exts":{},"template":"rockMossAlt"},{"x":2536,"y":-773,"exts":{},"template":"rockMossAlt"},{"x":1600,"y":-64,"exts":{},"template":"rat"},{"x":1790,"y":-1,"exts":{},"template":"rat"},{"x":1792,"y":0,"exts":{},"template":"Rocks_Top"},{"x":1792,"y":64,"exts":{},"template":"skelet"},{"x":1600,"y":320,"exts":{},"template":"waterAnim"},{"x":1664,"y":320,"exts":{},"template":"waterAnim"},{"x":1728,"y":320,"exts":{},"template":"waterAnim"},{"x":1792,"y":320,"exts":{},"template":"waterAnim"},{"x":1856,"y":320,"exts":{},"template":"waterAnim"},{"x":1664,"y":128,"exts":{},"template":"GreenCrystal"},{"x":1984,"y":256,"exts":{},"template":"Rocks_Platform"},{"x":1920,"y":64,"exts":{"cgroup":""},"template":"Rocks"},{"x":1920,"y":128,"exts":{"cgroup":""},"template":"Rocks"},{"x":1920,"y":192,"exts":{"cgroup":""},"template":"Rocks"},{"x":1920,"y":320,"exts":{},"template":"Rocks"},{"x":1920,"y":256,"exts":{},"template":"Rocks"},{"x":704,"y":128,"exts":{},"template":"castleCenter"},{"x":896,"y":448,"exts":{},"template":"castleCenter"},{"x":1920,"y":384,"exts":{},"template":"Rocks"},{"x":1856,"y":384,"exts":{},"template":"Rocks"},{"x":1792,"y":384,"exts":{},"template":"Rocks"},{"x":1728,"y":384,"exts":{},"template":"Rocks"},{"x":1664,"y":384,"exts":{},"template":"Rocks"},{"x":1600,"y":384,"exts":{},"template":"Rocks"},{"x":576,"y":576,"exts":{},"template":"castleCenter"},{"x":576,"y":704,"exts":{},"template":"castleCenter"},{"x":576,"y":640,"exts":{},"template":"castleCenter"},{"x":640,"y":640,"exts":{},"template":"Rocks"},{"x":704,"y":640,"exts":{},"template":"Rocks"},{"x":640,"y":576,"exts":{},"template":"Rocks"},{"x":704,"y":576,"exts":{},"template":"Rocks"},{"x":768,"y":576,"exts":{},"template":"Rocks"},{"x":832,"y":576,"exts":{},"template":"Rocks"},{"x":896,"y":576,"exts":{},"template":"Rocks"},{"x":640,"y":832,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":704,"y":832,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":640,"y":704,"exts":{},"template":"Rocks"},{"x":896,"y":704,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":960,"y":704,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1024,"y":640,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1088,"y":640,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1216,"y":640,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1152,"y":640,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1280,"y":576,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1344,"y":576,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":1472,"y":512,"exts":{},"tr":180,"template":"Spikes"},{"x":1536,"y":512,"exts":{},"tr":180,"template":"Spikes"},{"x":1600,"y":512,"exts":{},"tr":180,"template":"Spikes"},{"x":1664,"y":512,"exts":{},"tr":180,"template":"Spikes"},{"x":1728,"y":512,"exts":{},"tr":180,"template":"Spikes"},{"x":1792,"y":512,"exts":{},"tr":180,"template":"Spikes"},{"x":1856,"y":512,"exts":{},"tr":180,"template":"Spikes"},{"x":1920,"y":512,"exts":{},"tr":180,"template":"Spikes"},{"x":1984,"y":512,"exts":{},"tr":180,"template":"Spikes"},{"x":2368,"y":64,"exts":{},"template":"Rocks_Platform"},{"x":2399,"y":65,"exts":{},"template":"shroom"},{"x":2240,"y":128,"exts":{},"template":"Rocks_Platform"},{"x":2112,"y":576,"exts":{},"template":"bgH"},{"x":2496,"y":512,"exts":{},"template":"Rocks_Top"},{"x":2432,"y":512,"exts":{},"template":"Rocks_Top"},{"x":2368,"y":512,"exts":{},"template":"Rocks_Top"},{"x":2304,"y":512,"exts":{},"template":"Rocks_Top"},{"x":2240,"y":512,"exts":{},"template":"Rocks_Top"},{"x":2176,"y":512,"exts":{},"template":"Rocks_Top"},{"x":2112,"y":512,"exts":{},"template":"Rocks_Top"},{"x":2048,"y":576,"exts":{},"template":"Rocks_Top"},{"x":1984,"y":640,"exts":{},"template":"Rocks_Top"},{"x":1920,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1856,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1792,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1728,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1664,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1600,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1536,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1472,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1408,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1344,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1280,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1600,"y":704,"exts":{},"template":"wolf"},{"x":576,"y":954,"exts":{},"template":"castleCenter"},{"x":609,"y":910,"exts":{},"template":"GreenCrystal"},{"x":1216,"y":768,"exts":{},"template":"Rocks_Top"},{"x":1152,"y":768,"exts":{},"template":"Rocks_Top"},{"x":1088,"y":832,"exts":{},"template":"Rocks_Top"},{"x":1024,"y":832,"exts":{},"template":"Rocks_Top"},{"x":960,"y":896,"exts":{},"template":"Rocks_Top"},{"x":704,"y":1152,"exts":{},"template":"shroom"},{"x":768,"y":768,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":512,"y":1024,"exts":{"cgroup":""},"template":"castleCenter"},{"x":512,"y":1088,"exts":{"cgroup":""},"template":"castleCenter"},{"x":512,"y":1152,"exts":{},"template":"castleCenter"},{"x":576,"y":1152,"exts":{},"template":"castleCenter"},{"x":640,"y":1152,"exts":{},"template":"castleRight"},{"x":768,"y":640,"exts":{},"template":"Rocks"},{"x":832,"y":768,"exts":{},"tr":180,"template":"Rocks_Top"},{"x":0,"y":1536,"exts":{},"template":"bgH"},{"x":384,"y":1024,"exts":{},"template":"skelet"},{"x":0,"y":1408,"exts":{},"template":"castleRight"},{"x":192,"y":1344,"exts":{},"template":"Rocks_Platform"},{"x":235,"y":1344,"exts":{},"template":"shroom"},{"x":0,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":64,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":128,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":192,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":256,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":320,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":384,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":448,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":512,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":576,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":640,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":704,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":768,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":832,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":896,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":960,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":1024,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":1088,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":1152,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":1216,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":576,"y":1472,"exts":{},"template":"wolf2"},{"x":70,"y":1094,"exts":{},"tr":180,"template":"stoneCaveBR"},{"x":2048,"y":640,"exts":{},"template":"Rocks"},{"x":2048,"y":704,"exts":{},"template":"Rocks"},{"x":1984,"y":704,"exts":{},"template":"Rocks"},{"x":1280,"y":768,"exts":{},"template":"Rocks"},{"x":1344,"y":768,"exts":{},"template":"Rocks"},{"x":1472,"y":768,"exts":{},"template":"Rocks"},{"x":1408,"y":768,"exts":{},"template":"Rocks"},{"x":1600,"y":768,"exts":{},"template":"Rocks"},{"x":1536,"y":768,"exts":{},"template":"Rocks"},{"x":1664,"y":768,"exts":{},"template":"Rocks"},{"x":1728,"y":768,"exts":{},"template":"Rocks"},{"x":1792,"y":768,"exts":{},"template":"Rocks"},{"x":1920,"y":768,"exts":{},"template":"Rocks"},{"x":1856,"y":768,"exts":{},"template":"Rocks"},{"x":2048,"y":768,"exts":{},"template":"Rocks"},{"x":1984,"y":768,"exts":{},"template":"Rocks"},{"x":1152,"y":832,"exts":{},"template":"bgH"},{"x":1088,"y":896,"exts":{},"template":"Rocks"},{"x":1024,"y":896,"exts":{},"template":"Rocks"},{"x":1024,"y":960,"exts":{},"template":"Rocks"},{"x":1088,"y":960,"exts":{},"template":"Rocks"},{"x":1088,"y":1024,"exts":{},"template":"Rocks"},{"x":1024,"y":1024,"exts":{},"template":"Rocks"},{"x":960,"y":960,"exts":{},"template":"Rocks"},{"x":-896,"y":1024,"exts":{},"template":"bgW"},{"x":0,"y":1984,"exts":{},"template":"bgH"},{"x":1280,"y":2048,"exts":{},"template":"bgH"},{"x":2560,"y":2048,"exts":{},"template":"waterAnim"},{"x":2624,"y":2048,"exts":{},"template":"waterAnim"},{"x":2688,"y":2048,"exts":{},"template":"waterAnim"},{"x":2752,"y":2048,"exts":{},"template":"waterAnim"},{"x":2816,"y":2048,"exts":{},"template":"waterAnim"},{"x":2880,"y":2048,"exts":{},"template":"waterAnim"},{"x":2944,"y":2048,"exts":{},"template":"waterAnim"},{"x":3008,"y":2048,"exts":{},"template":"waterAnim"},{"x":3072,"y":2048,"exts":{},"template":"waterAnim"},{"x":3136,"y":2048,"exts":{},"template":"waterAnim"},{"x":2560,"y":2096,"exts":{},"template":"waterAnim"},{"x":2624,"y":2096,"exts":{},"template":"waterAnim"},{"x":2688,"y":2096,"exts":{},"template":"waterAnim"},{"x":2752,"y":2096,"exts":{},"template":"waterAnim"},{"x":2816,"y":2096,"exts":{},"template":"waterAnim"},{"x":2880,"y":2096,"exts":{},"template":"waterAnim"},{"x":2944,"y":2096,"exts":{},"template":"waterAnim"},{"x":3008,"y":2096,"exts":{},"template":"waterAnim"},{"x":3072,"y":2096,"exts":{},"template":"waterAnim"},{"x":3136,"y":2096,"exts":{},"template":"waterAnim"},{"x":2560,"y":2144,"exts":{},"template":"waterAnim"},{"x":2624,"y":2144,"exts":{},"template":"waterAnim"},{"x":2688,"y":2144,"exts":{},"template":"waterAnim"},{"x":2752,"y":2144,"exts":{},"template":"waterAnim"},{"x":2816,"y":2144,"exts":{},"template":"waterAnim"},{"x":2880,"y":2144,"exts":{},"template":"waterAnim"},{"x":2944,"y":2144,"exts":{},"template":"waterAnim"},{"x":3008,"y":2144,"exts":{},"template":"waterAnim"},{"x":3072,"y":2144,"exts":{},"template":"waterAnim"},{"x":3136,"y":2144,"exts":{},"template":"waterAnim"},{"x":2560,"y":2192,"exts":{},"template":"waterAnim"},{"x":2624,"y":2192,"exts":{},"template":"waterAnim"},{"x":2688,"y":2192,"exts":{},"template":"waterAnim"},{"x":2752,"y":2192,"exts":{},"template":"waterAnim"},{"x":2816,"y":2192,"exts":{},"template":"waterAnim"},{"x":2880,"y":2192,"exts":{},"template":"waterAnim"},{"x":2944,"y":2192,"exts":{},"template":"waterAnim"},{"x":3008,"y":2192,"exts":{},"template":"waterAnim"},{"x":1280,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":1344,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":1408,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":1472,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":1536,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":1600,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":1664,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":1728,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":1792,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":1856,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":1920,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":1984,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":2048,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":2112,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":2176,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":2240,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":2304,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":2368,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":2432,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":3072,"y":2192,"exts":{},"template":"waterAnim"},{"x":3136,"y":2192,"exts":{},"template":"waterAnim"},{"x":2544,"y":2240,"exts":{},"template":"bgH"},{"x":2496,"y":1984,"exts":{},"template":"Rocks"},{"x":2496,"y":1920,"exts":{},"template":"Rocks"},{"x":2496,"y":1856,"exts":{},"template":"Rocks_Top"},{"x":2624,"y":1728,"exts":{},"template":"Rocks_Top"},{"x":2624,"y":1792,"exts":{},"template":"Rocks"},{"x":2432,"y":1984,"exts":{},"template":"shroom"},{"x":2688,"y":1728,"exts":{},"template":"Rocks"},{"x":2688,"y":1600,"exts":{},"template":"Rocks_Top"},{"x":2752,"y":1472,"exts":{},"template":"Rocks_Top"},{"x":2816,"y":1344,"exts":{},"template":"Rocks_Top"},{"x":2880,"y":1216,"exts":{},"template":"Rocks_Top"},{"x":2944,"y":1216,"exts":{},"template":"Rocks_Top"},{"x":64,"y":448,"exts":{},"template":"start"},{"x":3008,"y":512,"exts":{},"template":"Rocks_Top"},{"x":3072,"y":448,"exts":{},"template":"Rocks_Top"},{"x":3136,"y":448,"exts":{},"template":"Rocks_Top"},{"x":3200,"y":512,"exts":{},"template":"Rocks_Top"},{"x":3136,"y":512,"exts":{},"template":"Rocks"},{"x":3072,"y":512,"exts":{},"template":"Rocks"},{"x":3264,"y":512,"exts":{},"template":"Rocks_Top"},{"x":3328,"y":512,"exts":{},"template":"Rocks_Top"},{"x":3103,"y":384,"exts":{},"template":"Exit"},{"x":1984,"y":1664,"exts":{},"template":"sova"},{"x":3008,"y":1280,"exts":{},"template":"Rocks_Top"},{"x":3072,"y":1280,"exts":{},"template":"Rocks_Top"},{"x":3200,"y":2192,"exts":{},"template":"Rocks"},{"x":3200,"y":2128,"exts":{},"template":"Rocks"},{"x":3200,"y":2064,"exts":{},"template":"Rocks"},{"x":3200,"y":2000,"exts":{},"template":"Rocks_Top"},{"x":3264,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":3328,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":3392,"y":1984,"exts":{},"template":"Rocks_Top"},{"x":3328,"y":2048,"exts":{},"template":"castleCenter"},{"x":3328,"y":2112,"exts":{},"template":"castleCenter"},{"x":3392,"y":2176,"exts":{},"template":"castleCenter"},{"x":3456,"y":2176,"exts":{},"template":"castleCenter"},{"x":3264,"y":2048,"exts":{},"template":"Rocks"},{"x":3264,"y":2112,"exts":{},"template":"Rocks"},{"x":3264,"y":2176,"exts":{},"template":"Rocks"},{"x":3328,"y":2176,"exts":{},"template":"Rocks"},{"x":3392,"y":2048,"exts":{},"template":"Rocks"},{"x":3392,"y":2112,"exts":{},"template":"Rocks"},{"x":3456,"y":2112,"exts":{},"template":"Rocks"},{"x":3520,"y":2176,"exts":{},"template":"Rocks"},{"x":3520,"y":2112,"exts":{},"template":"Rocks"},{"x":3456,"y":2068,"exts":{},"template":"waterAnim"},{"x":3520,"y":2068,"exts":{},"template":"waterAnim"},{"x":3584,"y":2068,"exts":{},"template":"waterAnim"},{"x":3648,"y":2068,"exts":{},"template":"waterAnim"},{"x":3712,"y":2068,"exts":{},"template":"waterAnim"},{"x":3776,"y":2068,"exts":{},"template":"waterAnim"},{"x":3584,"y":2112,"exts":{},"template":"waterAnim"},{"x":3648,"y":2112,"exts":{},"template":"waterAnim"},{"x":3712,"y":2112,"exts":{},"template":"waterAnim"},{"x":3776,"y":2112,"exts":{},"template":"waterAnim"},{"x":3584,"y":2160,"exts":{},"template":"waterAnim"},{"x":3648,"y":2160,"exts":{},"template":"waterAnim"},{"x":3712,"y":2160,"exts":{},"template":"waterAnim"},{"x":3776,"y":2160,"exts":{},"template":"waterAnim"},{"x":3584,"y":2224,"exts":{},"template":"castleCenter"},{"x":3648,"y":2224,"exts":{},"template":"castleCenter"},{"x":3712,"y":2224,"exts":{},"template":"castleCenter"},{"x":3776,"y":2224,"exts":{},"template":"castleCenter"},{"x":3712,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":3776,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":3840,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":3904,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":3840,"y":2240,"exts":{},"template":"Rocks"},{"x":3840,"y":2176,"exts":{},"template":"Rocks"},{"x":3840,"y":2112,"exts":{},"template":"Rocks"},{"x":3840,"y":2048,"exts":{},"template":"Rocks_Top"},{"x":3968,"y":1984,"exts":{"param":"ratsBirth"},"template":"rat"},{"x":3648,"y":1984,"exts":{"param":"ratsBirth"},"template":"rat"},{"x":3392,"y":1920,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":3392,"y":1856,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":3648,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":3584,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":3968,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":4032,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":2688,"y":1664,"exts":{},"template":"Rocks"},{"x":2752,"y":1536,"exts":{},"template":"Rocks"},{"x":2752,"y":1600,"exts":{},"template":"Rocks"},{"x":2816,"y":1472,"exts":{},"template":"Rocks"},{"x":2816,"y":1408,"exts":{},"template":"Rocks"},{"x":2880,"y":1280,"exts":{},"template":"Rocks"},{"x":2880,"y":1344,"exts":{},"template":"Rocks"},{"x":2944,"y":1280,"exts":{},"template":"Rocks"},{"x":2944,"y":1344,"exts":{},"template":"Rocks"},{"x":3008,"y":1344,"exts":{},"template":"Rocks"},{"x":3072,"y":1344,"exts":{},"template":"Rocks"},{"x":3008,"y":1408,"exts":{},"template":"Rocks"},{"x":2944,"y":1408,"exts":{},"template":"Rocks"},{"x":2880,"y":1408,"exts":{},"template":"Rocks"},{"x":2880,"y":1472,"exts":{},"template":"Rocks"},{"x":2880,"y":1536,"exts":{},"template":"Rocks"},{"x":2816,"y":1536,"exts":{},"template":"Rocks"},{"x":2816,"y":1600,"exts":{},"template":"Rocks"},{"x":2816,"y":1664,"exts":{},"template":"Rocks"},{"x":2752,"y":1664,"exts":{},"template":"Rocks"},{"x":2688,"y":1792,"exts":{},"template":"Rocks"},{"x":2752,"y":1728,"exts":{},"template":"Rocks"},{"x":3328,"y":1216,"exts":{},"template":"Rocks_Platform"},{"x":3392,"y":896,"exts":{},"template":"Rocks_Platform"},{"x":3520,"y":1152,"exts":{},"template":"Rocks_Platform"},{"x":3648,"y":1024,"exts":{},"template":"Rocks_Platform"},{"x":3521,"y":925,"exts":{},"template":"Rocks_Platform"},{"x":3488,"y":736,"exts":{},"template":"Rocks_Platform"},{"x":3392,"y":608,"exts":{},"template":"Rocks_Platform"},{"x":3136,"y":1280,"exts":{},"template":"Rocks_Platform"},{"x":3520,"y":2240,"exts":{},"template":"bgW"},{"x":3968,"y":2816,"exts":{},"template":"bgH"},{"x":3968,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4032,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4096,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4160,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4224,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4288,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4416,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4352,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4480,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4544,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4608,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4672,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4736,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4800,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4928,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4864,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4992,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":5056,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":5120,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":5184,"y":2752,"exts":{},"template":"Rocks_Top"},{"x":4864,"y":2752,"exts":{},"template":"bear"},{"x":4160,"y":2240,"exts":{},"template":"Rocks_Platform"},{"x":4608,"y":2560,"exts":{},"template":"Rocks_Platform"},{"x":4544,"y":2560,"exts":{},"template":"Rocks_Platform"},{"x":4480,"y":2560,"exts":{},"template":"Rocks_Platform"},{"x":3968,"y":2624,"exts":{},"template":"Rocks_Platform"},{"x":4096,"y":2496,"exts":{},"template":"Rocks_Platform"},{"x":4160,"y":2496,"exts":{},"template":"Rocks_Platform"},{"x":3904,"y":2176,"exts":{},"template":"rockMossAlt"},{"x":4928,"y":2496,"exts":{},"template":"Rocks_Platform"},{"x":4992,"y":2496,"exts":{},"template":"Rocks_Platform"},{"x":5120,"y":2752,"exts":{},"template":"shroom"},{"x":4187,"y":2170,"exts":{},"template":"Checkpoint"},{"x":5248,"y":2752,"exts":{},"template":"bgH"},{"x":6528,"y":1920,"exts":{},"template":"bgW"},{"x":6528,"y":640,"exts":{},"template":"bgW"},{"x":6464,"y":2624,"exts":{},"template":"castleLeft"},{"x":6272,"y":2560,"exts":{},"template":"castleHalf"},{"x":6208,"y":2560,"exts":{},"template":"castleHalf"},{"x":6080,"y":2496,"exts":{},"template":"Rocks_Platform"},{"x":6016,"y":2496,"exts":{},"template":"Rocks_Platform"},{"x":5846,"y":2205,"exts":{},"template":"skelet"},{"x":6016,"y":2304,"exts":{},"template":"Rocks_Platform"},{"x":6080,"y":2304,"exts":{},"template":"Rocks_Platform"},{"x":6400,"y":2752,"exts":{},"template":"shroom"},{"x":5696,"y":2750,"exts":{},"template":"sliz"},{"x":5760,"y":2176,"exts":{},"template":"castleHalf"},{"x":5184,"y":1216,"exts":{},"template":"bgW"},{"x":6033,"y":2304,"exts":{},"template":"shroom"},{"x":5632,"y":2048,"exts":{},"template":"castleRight"},{"x":5824,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":5888,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":5952,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":6016,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":6080,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":6144,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":6272,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":6208,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":6336,"y":1984,"exts":{},"template":"Rocks_Platform"},{"x":5824,"y":1472,"exts":{},"template":"castleHalf"},{"x":5888,"y":1472,"exts":{},"template":"castleHalf"},{"x":5952,"y":1472,"exts":{},"template":"castleHalf"},{"x":6016,"y":1472,"exts":{},"template":"castleHalf"},{"x":6080,"y":1472,"exts":{},"template":"castleHalf"},{"x":6144,"y":1472,"exts":{},"template":"castleHalf"},{"x":6208,"y":1472,"exts":{},"template":"castleHalf"},{"x":6272,"y":1472,"exts":{},"template":"castleHalf"},{"x":6464,"y":1856,"exts":{},"template":"castleLeft"},{"x":6272,"y":1792,"exts":{},"template":"castleHalf"},{"x":6208,"y":1792,"exts":{},"template":"castleHalf"},{"x":6016,"y":1728,"exts":{},"template":"Rocks_Platform"},{"x":5952,"y":1728,"exts":{},"template":"Rocks_Platform"},{"x":5888,"y":1728,"exts":{},"template":"Rocks_Platform"},{"x":5632,"y":1600,"exts":{},"template":"castleHalf"},{"x":5696,"y":1600,"exts":{},"template":"castleRight"},{"x":5901,"y":1728,"exts":{},"template":"shroom"},{"x":6400,"y":1408,"exts":{},"template":"Rocks_Platform"},{"x":6272,"y":1344,"exts":{},"template":"Rocks_Platform"},{"x":6144,"y":1280,"exts":{},"template":"Rocks_Platform"},{"x":6080,"y":1280,"exts":{},"template":"Rocks_Platform"},{"x":6016,"y":1280,"exts":{},"template":"Rocks_Platform"},{"x":5952,"y":1280,"exts":{},"template":"Rocks_Platform"},{"x":5824,"y":1216,"exts":{},"template":"Rocks_Platform"},{"x":5760,"y":1216,"exts":{},"template":"Rocks_Platform"},{"x":5696,"y":1216,"exts":{},"template":"Rocks_Platform"},{"x":5632,"y":1216,"exts":{},"template":"Rocks_Platform"},{"x":5568,"y":1152,"exts":{},"template":"Rocks_Top"},{"x":5504,"y":1152,"exts":{},"template":"Rocks_Top"},{"x":5440,"y":1152,"exts":{},"template":"Rocks_Top"},{"x":5376,"y":1152,"exts":{},"template":"Rocks_Top"},{"x":5312,"y":1152,"exts":{},"template":"Rocks_Top"},{"x":5248,"y":1152,"exts":{},"template":"Rocks_Top"},{"x":5184,"y":1152,"exts":{},"template":"Rocks_Top"},{"x":3683,"y":1024,"exts":{},"template":"shroom"},{"x":4160,"y":1216,"exts":{},"template":"bgH"},{"x":3904,"y":768,"exts":{},"template":"Rocks_Platform"},{"x":4096,"y":832,"exts":{},"template":"Rocks_Top"},{"x":4160,"y":896,"exts":{},"template":"Rocks_Top"},{"x":4224,"y":960,"exts":{},"template":"Rocks_Top"},{"x":4288,"y":1024,"exts":{},"template":"Rocks_Top"},{"x":4352,"y":1088,"exts":{},"template":"Rocks_Top"},{"x":4416,"y":1152,"exts":{},"template":"Rocks_Top"},{"x":4096,"y":896,"exts":{},"template":"Rocks"},{"x":4096,"y":960,"exts":{},"template":"Rocks"},{"x":4160,"y":960,"exts":{},"template":"Rocks"},{"x":4160,"y":1088,"exts":{},"template":"Rocks"},{"x":4160,"y":1024,"exts":{},"template":"Rocks"},{"x":4224,"y":1024,"exts":{},"template":"Rocks"},{"x":4224,"y":1088,"exts":{},"template":"Rocks"},{"x":4288,"y":1088,"exts":{},"template":"Rocks"},{"x":4352,"y":1152,"exts":{},"template":"Rocks"},{"x":4288,"y":1152,"exts":{},"template":"Rocks"},{"x":4224,"y":1152,"exts":{},"template":"Rocks"},{"x":4160,"y":1152,"exts":{},"template":"Rocks"},{"x":4114,"y":832,"exts":{},"template":"shroom"},{"x":6528,"y":576,"exts":{},"template":"Spikes"},{"x":3520,"y":704,"exts":{},"template":"bat"},{"x":4544,"y":1216,"exts":{"param":"ratsBirth2"},"template":"rat"},{"x":4992,"y":1216,"exts":{"param":"ratsBirth2"},"template":"rat"},{"x":4768,"y":1216,"exts":{"param":"ratsBirth2"},"template":"rat"},{"x":5184,"y":960,"exts":{"param":"ratsBirth2"},"template":"activeBlock"},{"x":5184,"y":1024,"exts":{"param":"ratsBirth2"},"template":"activeBlock"},{"x":5184,"y":1088,"exts":{"param":"ratsBirth2"},"template":"activeBlock"},{"x":4640,"y":1216,"exts":{},"template":"sliz"},{"x":4128,"y":640,"exts":{},"template":"ring"},{"x":5184,"y":2688,"exts":{},"template":"boxAlt"},{"x":5184,"y":2624,"exts":{},"template":"boxAlt"},{"x":5184,"y":2560,"exts":{},"template":"boxAlt"},{"x":5184,"y":2496,"exts":{},"template":"boxAlt"},{"x":5248,"y":2496,"exts":{},"template":"boxAlt"},{"x":5248,"y":2560,"exts":{},"template":"boxAlt"},{"x":5248,"y":2624,"exts":{},"template":"boxAlt"},{"x":5248,"y":2688,"exts":{},"template":"boxAlt"},{"x":5312,"y":2496,"exts":{},"template":"boxAlt"},{"x":5312,"y":2560,"exts":{},"template":"boxAlt"},{"x":5312,"y":2624,"exts":{},"template":"boxAlt"},{"x":5312,"y":2688,"exts":{},"template":"boxAlt"},{"x":5376,"y":2496,"exts":{},"template":"boxAlt"},{"x":5376,"y":2560,"exts":{},"template":"boxAlt"},{"x":5376,"y":2624,"exts":{},"template":"boxAlt"},{"x":5376,"y":2688,"exts":{},"template":"boxAlt"},{"x":5568,"y":2496,"exts":{},"template":"boxAlt"},{"x":5504,"y":2496,"exts":{},"template":"boxAlt"},{"x":5440,"y":2496,"exts":{},"template":"boxAlt"},{"x":5440,"y":2560,"exts":{},"template":"boxAlt"},{"x":5504,"y":2560,"exts":{},"template":"boxAlt"},{"x":5568,"y":2560,"exts":{},"template":"boxAlt"},{"x":5568,"y":2624,"exts":{},"template":"boxAlt"},{"x":5504,"y":2624,"exts":{},"template":"boxAlt"},{"x":5440,"y":2624,"exts":{},"template":"boxAlt"},{"x":5440,"y":2688,"exts":{},"template":"boxAlt"},{"x":5504,"y":2688,"exts":{},"template":"boxAlt"},{"x":5568,"y":2688,"exts":{},"template":"boxAlt"},{"x":3840,"y":704,"exts":{},"template":"Rocks_Platform"},{"x":3840,"y":640,"exts":{},"template":"boxAlt"},{"x":3840,"y":576,"exts":{},"template":"boxAlt"},{"x":3840,"y":512,"exts":{},"template":"boxAlt"},{"x":3840,"y":448,"exts":{},"template":"boxAlt"},{"x":3840,"y":384,"exts":{},"template":"boxAlt"},{"x":3584,"y":1728,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":3648,"y":1728,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":3712,"y":1728,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":3776,"y":1792,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":3840,"y":1728,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":3904,"y":1728,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":3968,"y":1728,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":4032,"y":1792,"exts":{"param":"ratsBirth"},"template":"activeBlock"},{"x":6080,"y":2112,"exts":{},"template":"sova"},{"x":6208,"y":1984,"exts":{},"template":"wolf"},{"x":6208,"y":1472,"exts":{},"template":"wolf2"},{"x":5760,"y":1216,"exts":{},"template":"sliz"},{"x":4096,"y":1984,"exts":{"param":"fight"},"template":"activeBlock"},{"x":4160,"y":1984,"exts":{"param":"fight"},"template":"activeBlock"},{"x":4224,"y":1984,"exts":{"param":"fight"},"template":"activeBlock"},{"x":4288,"y":1984,"exts":{"param":"fight"},"template":"activeBlock"},{"x":6144,"y":2752,"exts":{},"template":"wolf2"},{"x":5888,"y":2752,"exts":{},"template":"wolf"},{"x":960,"y":1344,"exts":{},"template":"Heart"},{"x":4189,"y":2115,"exts":{},"template":"Heart"},{"x":3309,"y":1411,"exts":{},"template":"Heart"},{"x":3039,"y":413,"exts":{},"template":"GreenCrystal"},{"x":4979,"y":2392,"exts":{},"template":"Heart"},{"x":5726,"y":2297,"exts":{},"template":"Heart"},{"x":2747,"y":1256,"exts":{},"template":"Heart"},{"x":2240,"y":1984,"exts":{},"template":"wolf"},{"x":832,"y":1536,"exts":{},"template":"bgW"},{"x":2030,"y":188,"exts":{},"template":"Checkpoint"},{"x":2941,"y":1147,"exts":{},"template":"Checkpoint"},{"x":5808,"y":2146,"exts":{},"template":"rockMossAlt"},{"x":4336,"y":941,"exts":{},"template":"Heart"},{"x":163,"y":450,"exts":{},"template":"Katya"},{"x":5312,"y":1082,"exts":{},"template":"Checkpoint"},{"x":-832,"y":-512,"exts":{},"template":"bgW"},{"x":3072,"y":2496,"exts":{},"template":"bgW"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"bg_shroom","extends":{"repeat":"repeat","scaleX":1.25,"scaleY":1.41}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        PauseHandler()

if(this.activeFlags['fight'] == true) {
    ct.sound.stop(this.sound)
    this.sound='lvl3_fight';
    ct.sound.spawn(this.sound, {volume:0.3})
    this.activeFlags['fight'] = false;
}
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.rings = 2;
this.countRings = 3;
this.prevRoom = 'Level_02';
this.nextRoom = 'Level_04';
this.sound='lvl3';
ct.sound.stop(this.sound)
ct.sound.spawn(this.sound, {volume:0.2})
inGameRoomStart(this);
this.activeFlags = [];
    },
    extends: {}
}
ct.rooms.templates['Level_04'] = {
    name: 'Level_04',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":-448,"y":-512,"exts":{},"template":"bgW"},{"x":-448,"y":-1792,"exts":{},"template":"bgW"},{"x":-448,"y":-3072,"exts":{},"template":"bgW"},{"x":-448,"y":768,"exts":{},"template":"bgH"},{"x":1664,"y":768,"exts":{},"template":"bgH"},{"x":2624,"y":768,"exts":{},"template":"bgH"},{"x":3904,"y":-64,"exts":{},"template":"bgW"},{"x":3904,"y":-1344,"exts":{},"template":"bgW"},{"x":3904,"y":-2624,"exts":{},"template":"bgW"},{"x":832,"y":768,"exts":{},"template":"bgH"},{"x":128,"y":704,"exts":{},"template":"Rocks_Top"},{"x":256,"y":704,"exts":{},"template":"Rocks_Top"},{"x":384,"y":704,"exts":{},"template":"Rocks_Top"},{"x":512,"y":704,"exts":{},"template":"Rocks_Top"},{"x":640,"y":704,"exts":{},"template":"Rocks_Top"},{"x":768,"y":704,"exts":{},"template":"Rocks_Top"},{"x":832,"y":704,"exts":{},"template":"Rocks_Top"},{"x":896,"y":704,"exts":{},"template":"Spikes"},{"x":960,"y":704,"exts":{},"template":"Spikes"},{"x":1024,"y":704,"exts":{},"template":"Spikes"},{"x":1088,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1152,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1216,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1280,"y":704,"exts":{},"template":"Rocks_Top"},{"x":832,"y":640,"exts":{},"template":"boxAlt"},{"x":768,"y":640,"exts":{},"template":"boxAlt"},{"x":832,"y":576,"exts":{},"template":"boxAlt"},{"x":768,"y":576,"exts":{},"template":"boxAlt"},{"x":1344,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1408,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1472,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1536,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1600,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1664,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1728,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1792,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1856,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1920,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1984,"y":704,"exts":{},"template":"Rocks_Top"},{"x":2048,"y":704,"exts":{},"template":"Rocks_Top"},{"x":2112,"y":640,"exts":{},"template":"Rocks_Platform"},{"x":2240,"y":576,"exts":{},"template":"Rocks_Platform"},{"x":2112,"y":704,"exts":{},"template":"waterAnim"},{"x":2176,"y":704,"exts":{},"template":"waterAnim"},{"x":2240,"y":704,"exts":{},"template":"waterAnim"},{"x":2304,"y":704,"exts":{},"template":"waterAnim"},{"x":2368,"y":704,"exts":{},"template":"Rocks_Top"},{"x":2432,"y":704,"exts":{},"template":"Rocks_Top"},{"x":2496,"y":704,"exts":{},"template":"Rocks_Top"},{"x":2560,"y":704,"exts":{},"template":"Rocks_Top"},{"x":2688,"y":704,"exts":{},"template":"Rocks_Top"},{"x":2624,"y":704,"exts":{},"template":"Rocks_Top"},{"x":2752,"y":704,"exts":{},"template":"Rocks_Top"},{"x":2816,"y":704,"exts":{},"template":"Rocks_Top"},{"x":2880,"y":704,"exts":{},"template":"Rocks_Top"},{"x":2944,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3008,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3136,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3072,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3200,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3264,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3328,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3840,"y":768,"exts":{},"tx":1,"ty":1,"template":"springboard"},{"x":3712,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3648,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3584,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3520,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3456,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3392,"y":704,"exts":{},"template":"Rocks_Top"},{"x":3712,"y":640,"exts":{},"template":"boxAlt"},{"x":3840,"y":640,"exts":{},"template":"boxAlt"},{"x":3776,"y":640,"exts":{},"template":"boxAlt"},{"x":704,"y":704,"exts":{"param":"ratBirth"},"template":"rat"},{"x":576,"y":704,"exts":{"param":"ratBirth"},"template":"rat"},{"x":448,"y":704,"exts":{"param":"ratBirth"},"template":"rat"},{"x":320,"y":704,"exts":{"param":"ratBirth"},"template":"rat"},{"x":64,"y":704,"exts":{},"template":"Rocks_Top"},{"x":0,"y":704,"exts":{},"template":"Rocks_Top"},{"x":192,"y":704,"exts":{},"template":"Rocks_Top"},{"x":320,"y":704,"exts":{},"template":"Rocks_Top"},{"x":448,"y":704,"exts":{},"template":"Rocks_Top"},{"x":576,"y":704,"exts":{},"template":"Rocks_Top"},{"x":704,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1984,"y":576,"exts":{},"template":"sova"},{"x":704,"y":576,"exts":{},"template":"sova"},{"x":50,"y":640,"exts":{},"template":"start"},{"x":1856,"y":704,"exts":{},"template":"wolf"},{"x":1344,"y":704,"exts":{},"template":"wolf"},{"x":2240,"y":576,"exts":{},"template":"wolf2"},{"x":2048,"y":640,"exts":{},"template":"Spikes"},{"x":2331,"y":626,"exts":{},"template":"Rocks_Platform"},{"x":2880,"y":512,"exts":{},"template":"sova"},{"x":3456,"y":704,"exts":{},"template":"bear"},{"x":3072,"y":704,"exts":{},"template":"wolf"},{"x":3584,"y":704,"exts":{},"template":"wolf2"},{"x":2560,"y":704,"exts":{},"template":"bear"},{"x":3264,"y":576,"exts":{},"template":"sova"},{"x":1280,"y":-192,"exts":{},"template":"bgH"},{"x":2432,"y":-192,"exts":{},"template":"bgH"},{"x":3845,"y":704,"exts":{},"template":"rockMossAlt"},{"x":3830,"y":704,"exts":{},"tx":-1,"ty":1,"template":"rockMossAlt"},{"x":-320,"y":-192,"exts":{},"template":"bgH"},{"x":3648,"y":-256,"exts":{},"template":"boxAlt"},{"x":3648,"y":-320,"exts":{},"template":"boxAlt"},{"x":3648,"y":-384,"exts":{},"template":"boxAlt"},{"x":3648,"y":-448,"exts":{},"template":"boxAlt"},{"x":3648,"y":-512,"exts":{},"template":"boxAlt"},{"x":3648,"y":-576,"exts":{},"template":"boxAlt"},{"x":3648,"y":-640,"exts":{},"template":"boxAlt"},{"x":3648,"y":-704,"exts":{},"template":"boxAlt"},{"x":196,"y":-195,"exts":{},"template":"sliz"},{"x":653,"y":-195,"exts":{},"template":"sliz"},{"x":1143,"y":-195,"exts":{},"template":"sliz"},{"x":1485,"y":-196,"exts":{},"template":"sliz"},{"x":2226,"y":-197,"exts":{},"template":"sliz"},{"x":2861,"y":-198,"exts":{},"template":"sliz"},{"x":3855,"y":-848,"exts":{},"template":"castleLeft"},{"x":3857,"y":-879,"exts":{},"template":"fire"},{"x":1152,"y":-384,"exts":{},"template":"bat"},{"x":384,"y":-320,"exts":{},"template":"bat"},{"x":3392,"y":-192,"exts":{},"template":"wolf"},{"x":2496,"y":-192,"exts":{},"template":"wolf"},{"x":896,"y":-192,"exts":{},"template":"wolf"},{"x":1920,"y":-192,"exts":{"param":"ratBirth2"},"template":"rat"},{"x":1600,"y":-192,"exts":{"prarm":"ratBirth2"},"template":"rat"},{"x":2624,"y":-512,"exts":{},"template":"fire"},{"x":1408,"y":-512,"exts":{},"template":"fire"},{"x":576,"y":-512,"exts":{},"template":"fire"},{"x":2643,"y":-448,"exts":{},"template":"skelet"},{"x":1424,"y":-459,"exts":{},"template":"skelet"},{"x":592,"y":-455,"exts":{},"template":"skelet"},{"x":3840,"y":0,"exts":{},"template":"Heart"},{"x":3840,"y":-128,"exts":{},"template":"Heart"},{"x":3840,"y":-256,"exts":{},"template":"Heart"},{"x":3564,"y":-261,"exts":{},"template":"Checkpoint"},{"x":3072,"y":-192,"exts":{"param":"ratBirth2"},"template":"rat"},{"x":768,"y":-192,"exts":{},"template":"bgH"},{"x":384,"y":-192,"exts":{"param":"ratBirth2"},"template":"rat"},{"x":1728,"y":-192,"exts":{},"template":"wolf2"},{"x":512,"y":-192,"exts":{},"template":"wolf2"},{"x":704,"y":-1215,"exts":{},"template":"Platform"},{"x":1728,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":1792,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":1856,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":1920,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":1856,"y":-1216,"exts":{},"template":"bear"},{"x":3840,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3776,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3840,"y":-1216,"exts":{},"template":"springboard"},{"x":1664,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":1984,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":1664,"y":-1280,"exts":{},"template":"boxAlt"},{"x":1984,"y":-1280,"exts":{},"template":"boxAlt"},{"x":-14,"y":-1285,"exts":{},"template":"castleRight"},{"x":24,"y":-1353,"exts":{},"template":"Checkpoint"},{"x":64,"y":-768,"exts":{},"template":"Heart"},{"x":64,"y":-896,"exts":{},"template":"Heart"},{"x":64,"y":-1024,"exts":{},"template":"Heart"},{"x":576,"y":-1280,"exts":{},"template":"sova"},{"x":2752,"y":-1280,"exts":{},"template":"sova"},{"x":3264,"y":-1280,"exts":{},"template":"sova"},{"x":960,"y":-1408,"exts":{},"template":"sova"},{"x":294,"y":-1246,"exts":{},"template":"bat"},{"x":2541,"y":-1257,"exts":{},"template":"bat"},{"x":3007,"y":-1249,"exts":{},"template":"bat"},{"x":3547,"y":-1245,"exts":{},"template":"bat"},{"x":1167,"y":-1278,"exts":{},"template":"sova"},{"x":-19,"y":-1741,"exts":{},"template":"castleRight"},{"x":15,"y":-1766,"exts":{},"template":"fire"},{"x":-448,"y":-4352,"exts":{},"template":"bgW"},{"x":3904,"y":-3904,"exts":{},"template":"bgW"},{"x":3904,"y":-5184,"exts":{},"template":"bgW"},{"x":2048,"y":-320,"exts":{},"template":"sova"},{"x":1024,"y":448,"exts":{},"template":"sova"},{"x":960,"y":256,"exts":{},"template":"skelet"},{"x":1280,"y":-1216,"exts":{},"template":"Platform"},{"x":128,"y":-192,"exts":{},"template":"springboard"},{"x":1433,"y":-1257,"exts":{},"template":"bat"},{"x":0,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":64,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":128,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":256,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":192,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":384,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":320,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":512,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":448,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":576,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":640,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":704,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":768,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":896,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":832,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":960,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":1344,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":1472,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":1408,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":1536,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":1600,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":1664,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":1792,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":1728,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":1856,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":1920,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":1984,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":2048,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":2112,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":2176,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":2496,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":2624,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":2560,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":2752,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":2688,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":2816,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":2880,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3008,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":2944,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3072,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3136,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3200,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3264,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3328,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3392,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3456,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3520,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3584,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3648,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3712,"y":-2176,"exts":{},"template":"Rocks_Platform"},{"x":3857,"y":-2752,"exts":{},"template":"castleLeft"},{"x":3861,"y":-2779,"exts":{},"template":"fire"},{"x":3712,"y":-2240,"exts":{},"template":"boxAlt"},{"x":3712,"y":-2304,"exts":{},"template":"boxAlt"},{"x":3712,"y":-2368,"exts":{},"template":"boxAlt"},{"x":3712,"y":-2432,"exts":{},"template":"boxAlt"},{"x":3712,"y":-2496,"exts":{},"template":"boxAlt"},{"x":3712,"y":-2560,"exts":{},"template":"boxAlt"},{"x":3712,"y":-2624,"exts":{},"template":"boxAlt"},{"x":3840,"y":-1856,"exts":{},"template":"Heart"},{"x":3840,"y":-2048,"exts":{},"template":"Heart"},{"x":3840,"y":-2240,"exts":{},"template":"Heart"},{"x":3620,"y":-2244,"exts":{},"template":"Checkpoint"},{"x":3392,"y":-2176,"exts":{},"template":"sliz"},{"x":2752,"y":-2176,"exts":{},"template":"sliz"},{"x":2176,"y":-2176,"exts":{},"template":"sliz"},{"x":1536,"y":-2176,"exts":{},"template":"sliz"},{"x":960,"y":-2176,"exts":{},"template":"sliz"},{"x":384,"y":-2176,"exts":{},"template":"sliz"},{"x":640,"y":-2240,"exts":{},"template":"bat"},{"x":1856,"y":-2240,"exts":{},"template":"bat"},{"x":2496,"y":-2240,"exts":{},"template":"bat"},{"x":3072,"y":-2240,"exts":{},"template":"bat"},{"x":2048,"y":-2432,"exts":{},"template":"fire"},{"x":2880,"y":-2432,"exts":{},"template":"fire"},{"x":1408,"y":-2432,"exts":{},"template":"fire"},{"x":832,"y":-2432,"exts":{},"template":"fire"},{"x":512,"y":-2176,"exts":{},"template":"bear"},{"x":1728,"y":-2176,"exts":{},"template":"bear"},{"x":2624,"y":-2176,"exts":{},"template":"bear"},{"x":2304,"y":-2240,"exts":{},"template":"boxAlt"},{"x":2304,"y":-2304,"exts":{},"template":"boxAlt"},{"x":2304,"y":-2368,"exts":{},"template":"boxAlt"},{"x":1088,"y":-2240,"exts":{},"template":"boxAlt"},{"x":1088,"y":-2304,"exts":{},"template":"boxAlt"},{"x":1088,"y":-2368,"exts":{},"template":"boxAlt"},{"x":2368,"y":-2176,"exts":{},"template":"boxAlt"},{"x":2368,"y":-2240,"exts":{},"template":"boxAlt"},{"x":2432,"y":-2176,"exts":{},"template":"boxAlt"},{"x":2304,"y":-2176,"exts":{},"template":"boxAlt"},{"x":2240,"y":-2176,"exts":{},"template":"boxAlt"},{"x":1088,"y":-2176,"exts":{},"template":"boxAlt"},{"x":1152,"y":-2176,"exts":{},"template":"boxAlt"},{"x":1216,"y":-2176,"exts":{},"template":"boxAlt"},{"x":1280,"y":-2176,"exts":{},"template":"boxAlt"},{"x":1024,"y":-2176,"exts":{},"template":"boxAlt"},{"x":1152,"y":-2240,"exts":{},"template":"boxAlt"},{"x":128,"y":-2176,"exts":{},"template":"springboard"},{"x":192,"y":-3136,"exts":{},"template":"boxAlt"},{"x":192,"y":-3200,"exts":{},"template":"boxAlt"},{"x":192,"y":-3264,"exts":{},"template":"boxAlt"},{"x":192,"y":-3328,"exts":{},"template":"boxAlt"},{"x":192,"y":-3392,"exts":{},"template":"boxAlt"},{"x":192,"y":-3456,"exts":{},"template":"boxAlt"},{"x":256,"y":-3264,"exts":{},"template":"boxAlt"},{"x":320,"y":-3264,"exts":{},"template":"boxAlt"},{"x":384,"y":-3264,"exts":{},"template":"boxAlt"},{"x":448,"y":-3264,"exts":{},"template":"boxAlt"},{"x":512,"y":-3264,"exts":{},"template":"boxAlt"},{"x":576,"y":-3264,"exts":{},"template":"boxAlt"},{"x":640,"y":-3264,"exts":{},"template":"boxAlt"},{"x":832,"y":-3264,"exts":{},"template":"boxAlt"},{"x":768,"y":-3264,"exts":{},"template":"boxAlt"},{"x":896,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1024,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1088,"y":-3264,"exts":{},"template":"boxAlt"},{"x":960,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1216,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1152,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1280,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1344,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1408,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1472,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1536,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1664,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1600,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1792,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1728,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1920,"y":-3264,"exts":{},"template":"boxAlt"},{"x":1856,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3520,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3328,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3072,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2880,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2688,"y":-3328,"exts":{},"template":"boxAlt"},{"x":2560,"y":-3328,"exts":{},"template":"boxAlt"},{"x":2432,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2368,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2304,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2240,"y":-3328,"exts":{},"template":"boxAlt"},{"x":2176,"y":-3328,"exts":{},"template":"boxAlt"},{"x":2112,"y":-3328,"exts":{},"template":"boxAlt"},{"x":2112,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2112,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2048,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2176,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2240,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2496,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2624,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2752,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2688,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2560,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2816,"y":-3264,"exts":{},"template":"boxAlt"},{"x":2944,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3008,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3136,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3200,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3264,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3392,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3456,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3584,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3648,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3712,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3840,"y":-3264,"exts":{},"template":"castleHalf"},{"x":3776,"y":-3264,"exts":{},"template":"castleHalf"},{"x":3840,"y":-3264,"exts":{},"template":"springboard"},{"x":640,"y":-3200,"exts":{},"template":"boxAlt"},{"x":704,"y":-3200,"exts":{},"template":"boxAlt"},{"x":832,"y":-3200,"exts":{},"template":"boxAlt"},{"x":1088,"y":-3200,"exts":{},"template":"boxAlt"},{"x":1024,"y":-3200,"exts":{},"template":"boxAlt"},{"x":1216,"y":-3200,"exts":{},"template":"boxAlt"},{"x":1344,"y":-3200,"exts":{},"template":"boxAlt"},{"x":1664,"y":-3200,"exts":{},"template":"boxAlt"},{"x":1536,"y":-3200,"exts":{},"template":"boxAlt"},{"x":2048,"y":-3200,"exts":{},"template":"boxAlt"},{"x":1856,"y":-3200,"exts":{},"template":"boxAlt"},{"x":2432,"y":-3200,"exts":{},"template":"boxAlt"},{"x":2624,"y":-3200,"exts":{},"template":"boxAlt"},{"x":3008,"y":-3200,"exts":{},"template":"boxAlt"},{"x":3328,"y":-3200,"exts":{},"template":"boxAlt"},{"x":3648,"y":-3200,"exts":{},"template":"boxAlt"},{"x":2816,"y":-3200,"exts":{},"template":"boxAlt"},{"x":3200,"y":-3200,"exts":{},"template":"boxAlt"},{"x":1920,"y":-3328,"exts":{},"template":"boxAlt"},{"x":1984,"y":-3264,"exts":{},"template":"boxAlt"},{"x":3520,"y":-3200,"exts":{},"template":"boxAlt"},{"x":448,"y":-3200,"exts":{},"template":"boxAlt"},{"x":384,"y":-3200,"exts":{},"template":"boxAlt"},{"x":384,"y":-3200,"exts":{},"template":"boxAlt"},{"x":2240,"y":-3200,"exts":{},"template":"boxAlt"},{"x":2176,"y":-3200,"exts":{},"template":"boxAlt"},{"x":3520,"y":-3456,"exts":{},"template":"sova"},{"x":2880,"y":-3456,"exts":{},"template":"sova"},{"x":832,"y":-3456,"exts":{},"template":"sova"},{"x":1280,"y":-3328,"exts":{},"template":"boxAlt"},{"x":1280,"y":-3392,"exts":{},"template":"boxAlt"},{"x":1280,"y":-3456,"exts":{},"template":"boxAlt"},{"x":1280,"y":-3520,"exts":{},"template":"boxAlt"},{"x":1344,"y":-3520,"exts":{},"template":"boxAlt"},{"x":1344,"y":-3456,"exts":{},"template":"boxAlt"},{"x":1344,"y":-3392,"exts":{},"template":"boxAlt"},{"x":1344,"y":-3328,"exts":{},"template":"boxAlt"},{"x":2432,"y":-3328,"exts":{},"template":"boxAlt"},{"x":2496,"y":-3328,"exts":{},"template":"boxAlt"},{"x":2496,"y":-3392,"exts":{},"template":"boxAlt"},{"x":2496,"y":-3456,"exts":{},"template":"boxAlt"},{"x":2496,"y":-3520,"exts":{},"template":"boxAlt"},{"x":1984,"y":-3328,"exts":{},"template":"boxAlt"},{"x":1856,"y":-3328,"exts":{},"template":"boxAlt"},{"x":1920,"y":-3392,"exts":{},"template":"boxAlt"},{"x":3200,"y":-3328,"exts":{},"template":"boxAlt"},{"x":3136,"y":-3392,"exts":{},"template":"boxAlt"},{"x":3136,"y":-3456,"exts":{},"template":"boxAlt"},{"x":3072,"y":-3456,"exts":{},"template":"boxAlt"},{"x":3072,"y":-3520,"exts":{},"template":"boxAlt"},{"x":3072,"y":-3328,"exts":{},"template":"boxAlt"},{"x":3136,"y":-3328,"exts":{},"template":"boxAlt"},{"x":3072,"y":-3392,"exts":{},"template":"boxAlt"},{"x":2624,"y":-3328,"exts":{},"template":"boxAlt"},{"x":1088,"y":-3264,"exts":{},"template":"wolf"},{"x":2313,"y":-3350,"exts":{},"template":"bat"},{"x":3520,"y":-3264,"exts":{},"template":"wolf2"},{"x":2688,"y":-3328,"exts":{},"template":"wolf2"},{"x":2176,"y":-3328,"exts":{},"template":"wolf2"},{"x":512,"y":-3264,"exts":{},"template":"rat"},{"x":896,"y":-3264,"exts":{},"template":"rat"},{"x":1600,"y":-3264,"exts":{},"template":"rat"},{"x":2368,"y":-3264,"exts":{},"template":"rat"},{"x":2944,"y":-3264,"exts":{},"template":"rat"},{"x":2816,"y":-3264,"exts":{},"template":"rat"},{"x":1728,"y":-3264,"exts":{},"template":"rat"},{"x":1472,"y":-3264,"exts":{},"template":"rat"},{"x":576,"y":-3392,"exts":{},"template":"bat"},{"x":1598,"y":-3372,"exts":{},"template":"bat"},{"x":1664,"y":-3264,"exts":{},"template":"sliz"},{"x":1984,"y":-3648,"exts":{},"template":"skelet"},{"x":1965,"y":-3708,"exts":{},"template":"fire"},{"x":-16,"y":-3398,"exts":{},"template":"castleRight"},{"x":31,"y":-3465,"exts":{},"template":"Checkpoint"},{"x":-12,"y":-3972,"exts":{},"template":"castleRight"},{"x":21,"y":-4005,"exts":{},"template":"fire"},{"x":2406,"y":-2451,"exts":{},"template":"skelet"},{"x":1189,"y":-2451,"exts":{},"template":"skelet"},{"x":1156,"y":-2518,"exts":{},"template":"rockMossAlt"},{"x":2370,"y":-2514,"exts":{},"template":"rockMossAlt"},{"x":3847,"y":-4790,"exts":{},"template":"castleLeft"},{"x":3850,"y":-4823,"exts":{},"template":"fire"},{"x":3847,"y":-4270,"exts":{},"template":"castleLeft"},{"x":3850,"y":-4337,"exts":{},"template":"Checkpoint"},{"x":3648,"y":-4480,"exts":{},"template":"skelet"},{"x":3392,"y":-4480,"exts":{},"template":"skelet"},{"x":3136,"y":-4480,"exts":{},"template":"skelet"},{"x":2624,"y":-4480,"exts":{},"template":"skelet"},{"x":2368,"y":-4416,"exts":{},"template":"skelet"},{"x":2176,"y":-4480,"exts":{},"template":"skelet"},{"x":1920,"y":-4416,"exts":{},"template":"skelet"},{"x":1728,"y":-4480,"exts":{},"template":"skelet"},{"x":1472,"y":-4352,"exts":{},"template":"Rocks_Platform"},{"x":1408,"y":-4352,"exts":{},"template":"Rocks_Platform"},{"x":1344,"y":-4352,"exts":{},"template":"Rocks_Platform"},{"x":1459,"y":-4420,"exts":{},"template":"Checkpoint"},{"x":1152,"y":-4480,"exts":{},"template":"skelet"},{"x":896,"y":-4480,"exts":{},"template":"skelet"},{"x":640,"y":-4352,"exts":{},"template":"skelet"},{"x":448,"y":-4416,"exts":{},"template":"skelet"},{"x":256,"y":-4480,"exts":{},"template":"skelet"},{"x":0,"y":-4352,"exts":{},"template":"castleRight"},{"x":-64,"y":-4416,"exts":{},"template":"Rocks_Top"},{"x":-128,"y":-4416,"exts":{},"template":"Rocks_Top"},{"x":-192,"y":-4416,"exts":{},"template":"Rocks_Top"},{"x":-256,"y":-4416,"exts":{},"template":"Rocks_Top"},{"x":-320,"y":-4416,"exts":{},"template":"Rocks_Top"},{"x":-384,"y":-4416,"exts":{},"template":"Rocks_Top"},{"x":-448,"y":-4416,"exts":{},"template":"Rocks_Top"},{"x":-64,"y":-4544,"exts":{},"template":"ring"},{"x":-320,"y":-4480,"exts":{},"template":"Exit"},{"x":-512,"y":-3264,"exts":{},"template":"DieBlock"},{"x":-640,"y":-3264,"exts":{},"template":"DieBlock"},{"x":-576,"y":-3264,"exts":{},"template":"DieBlock"},{"x":-704,"y":-3264,"exts":{},"template":"DieBlock"},{"x":-768,"y":-3264,"exts":{},"template":"DieBlock"},{"x":-832,"y":-3264,"exts":{},"template":"DieBlock"},{"x":-896,"y":-3264,"exts":{},"template":"DieBlock"},{"x":-960,"y":-3264,"exts":{},"template":"DieBlock"},{"x":-1024,"y":-3264,"exts":{},"template":"DieBlock"},{"x":2889,"y":-4465,"exts":{},"template":"skelet"},{"x":3647,"y":-4492,"exts":{},"template":"GreenCrystal"},{"x":3390,"y":-4494,"exts":{},"template":"GreenCrystal"},{"x":3133,"y":-4496,"exts":{},"template":"GreenCrystal"},{"x":2888,"y":-4485,"exts":{},"template":"GreenCrystal"},{"x":2622,"y":-4492,"exts":{},"template":"GreenCrystal"},{"x":2367,"y":-4432,"exts":{},"template":"GreenCrystal"},{"x":2174,"y":-4492,"exts":{},"template":"GreenCrystal"},{"x":1918,"y":-4428,"exts":{},"template":"GreenCrystal"},{"x":1727,"y":-4491,"exts":{},"template":"GreenCrystal"},{"x":1149,"y":-4491,"exts":{},"template":"GreenCrystal"},{"x":893,"y":-4486,"exts":{},"template":"GreenCrystal"},{"x":639,"y":-4364,"exts":{},"template":"GreenCrystal"},{"x":446,"y":-4430,"exts":{},"template":"GreenCrystal"},{"x":256,"y":-4492,"exts":{},"template":"GreenCrystal"},{"x":128,"y":-2624,"exts":{},"template":"Heart"},{"x":128,"y":-2944,"exts":{},"template":"Heart"},{"x":128,"y":-3200,"exts":{},"template":"Heart"},{"x":3840,"y":-4032,"exts":{},"template":"Heart"},{"x":3840,"y":-3904,"exts":{},"template":"Heart"},{"x":3840,"y":-3776,"exts":{},"template":"Heart"},{"x":3712,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3648,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3584,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3520,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3456,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3392,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3328,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3264,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3136,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3200,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3072,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":3008,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2944,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2880,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2816,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2688,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2752,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2624,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2560,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2496,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2432,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2368,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2304,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2240,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":2176,"y":-1216,"exts":{},"template":"Rocks_Platform"},{"x":-896,"y":-64,"exts":{},"template":"bgW"},{"x":-896,"y":-2304,"exts":{},"template":"bgW"},{"x":704,"y":-3264,"exts":{},"template":"boxAlt"},{"x":192,"y":-3520,"exts":{},"template":"boxAlt"},{"x":128,"y":-1280,"exts":{},"template":"Rocks_Platform"},{"x":128,"y":512,"exts":{},"template":"Katya"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"bg_castle","extends":{"repeat":"repeat","shiftY":0}},{"depth":-10,"texture":"bg_desert","extends":{"repeat":"repeat-x","shiftX":0,"shiftY":250,"parallaxX":1}},{"depth":-10,"texture":"bg_shroom","extends":{"repeat":"repeat-x","scaleY":0,"shiftY":-1650}},{"depth":-10,"texture":"bg_shroom","extends":{"repeat":"repeat-x","shiftY":-1636,"scaleY":-1}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        PauseHandler()
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.rings = 3;
this.countRings = 4;
this.prevRoom = 'Level_03';
this.nextRoom = 'Level_05';
this.sound='lvl4';
ct.sound.stop(this.sound)
ct.sound.spawn(this.sound, {volume:0.5})
inGameRoomStart(this);
this.activeFlags = [];
this.player.canShoot = true;
    },
    extends: {}
}
ct.rooms.templates['Level_05'] = {
    name: 'Level_05',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":704,"exts":{},"template":"bgH"},{"x":-448,"y":-128,"exts":{},"template":"bgW"},{"x":1060,"y":700,"exts":{},"template":"dragon"},{"x":960,"y":704,"exts":{},"template":"bgH"},{"x":1792,"y":-192,"exts":{},"template":"bgW"},{"x":64,"y":704,"exts":{},"template":"shroom"},{"x":1728,"y":704,"exts":{},"template":"shroom"},{"x":576,"y":640,"exts":{},"template":"platformSave"},{"x":512,"y":640,"exts":{},"template":"platformSave"},{"x":-16,"y":37,"exts":{},"template":"castleRight"},{"x":1744,"y":26,"exts":{},"template":"castleLeft"},{"x":576,"y":576,"exts":{},"template":"platformSave"},{"x":512,"y":576,"exts":{},"template":"platformSave"},{"x":576,"y":576,"exts":{},"template":"Katya"},{"x":1728,"y":640,"exts":{},"template":"boxAlt"},{"x":1664,"y":640,"exts":{},"template":"boxAlt"},{"x":1664,"y":576,"exts":{},"template":"boxAlt"},{"x":1728,"y":576,"exts":{},"template":"boxAlt"},{"x":1728,"y":512,"exts":{},"template":"boxAlt"},{"x":1664,"y":512,"exts":{},"template":"boxAlt"},{"x":1600,"y":640,"exts":{},"template":"boxAlt"},{"x":1600,"y":576,"exts":{},"template":"boxAlt"},{"x":1536,"y":640,"exts":{},"template":"boxAlt"},{"x":960,"y":640,"exts":{},"template":"Exit"},{"x":-896,"y":-128,"exts":{},"template":"bgW"},{"x":2240,"y":-128,"exts":{},"template":"bgW"},{"x":-896,"y":1152,"exts":{},"template":"bgH"},{"x":384,"y":1152,"exts":{},"template":"bgH"},{"x":1408,"y":1152,"exts":{},"template":"bgH"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"castlebg","extends":{"repeat":"no-repeat","scaleX":0.95,"scaleY":0.95,"shiftX":-32,"movementX":0,"shiftY":-160}},{"depth":0,"texture":"scull","extends":{"repeat":"no-repeat","scaleX":-0.25,"scaleY":0.25,"shiftX":692,"shiftY":578}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        PauseHandler()
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.rings = 4;
this.countRings = 4;
this.prevRoom = 'Level_04';
this.nextRoom = 'Level_06';
ct.sound.spawn('dragon');
this.sound='finalFight';
ct.sound.stop(this.sound)
ct.sound.spawn(this.sound, {volume:0.5})
inGameRoomStart(this);
this.activeFlags = [];
this.player.canShoot = true;
ct.camera.borderY = 200;

ct.room.exit.tex = 'exit_open';
this.posExitY = ct.room.exit.y;
ct.room.exit.y=-10000;
ct.room.exit.visible = false;
    },
    extends: {}
}
ct.rooms.templates['Level_06'] = {
    name: 'Level_06',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":704,"exts":{},"template":"Rocks_Top"},{"x":64,"y":704,"exts":{},"template":"Rocks_Top"},{"x":192,"y":704,"exts":{},"template":"Rocks_Top"},{"x":256,"y":704,"exts":{},"template":"Rocks_Top"},{"x":320,"y":704,"exts":{},"template":"Rocks_Top"},{"x":384,"y":704,"exts":{},"template":"Rocks_Top"},{"x":448,"y":704,"exts":{},"template":"Rocks_Top"},{"x":512,"y":704,"exts":{},"template":"Rocks_Top"},{"x":576,"y":704,"exts":{},"template":"Rocks_Top"},{"x":640,"y":704,"exts":{},"template":"Rocks_Top"},{"x":704,"y":704,"exts":{},"template":"Rocks_Top"},{"x":832,"y":704,"exts":{},"template":"Rocks_Top"},{"x":768,"y":704,"exts":{},"template":"Rocks_Top"},{"x":896,"y":704,"exts":{},"template":"Rocks_Top"},{"x":960,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1088,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1152,"y":704,"exts":{},"template":"Rocks_Top"},{"x":1216,"y":704,"exts":{},"template":"Rocks_Top"},{"x":-448,"y":-512,"exts":{},"template":"bgW"},{"x":1280,"y":-512,"exts":{},"template":"bgW"},{"x":-960,"y":704,"exts":{},"template":"DieBlock"},{"x":-896,"y":704,"exts":{},"template":"DieBlock"},{"x":-832,"y":704,"exts":{},"template":"DieBlock"},{"x":-768,"y":704,"exts":{},"template":"DieBlock"},{"x":-704,"y":704,"exts":{},"template":"DieBlock"},{"x":-640,"y":704,"exts":{},"template":"DieBlock"},{"x":-576,"y":704,"exts":{},"template":"DieBlock"},{"x":-512,"y":704,"exts":{},"template":"DieBlock"},{"x":1728,"y":704,"exts":{},"template":"DieBlock"},{"x":1792,"y":704,"exts":{},"template":"DieBlock"},{"x":1856,"y":704,"exts":{},"template":"DieBlock"},{"x":1920,"y":704,"exts":{},"template":"DieBlock"},{"x":2048,"y":704,"exts":{},"template":"DieBlock"},{"x":1984,"y":704,"exts":{},"template":"DieBlock"},{"x":2112,"y":704,"exts":{},"template":"DieBlock"},{"x":2176,"y":704,"exts":{},"template":"DieBlock"},{"x":-448,"y":768,"exts":{},"template":"bgH"},{"x":448,"y":768,"exts":{},"template":"bgH"},{"x":1243,"y":654,"exts":{},"template":"Prince"},{"x":163,"y":187,"exts":{},"template":"gameOver"},{"x":1024,"y":704,"exts":{},"template":"Rocks_Top"},{"x":704,"y":384,"exts":{},"template":"no"},{"x":500,"y":384,"exts":{},"template":"yes"},{"x":576,"y":320,"exts":{},"template":"win"},{"x":192,"y":128,"exts":{},"template":"MerryText"},{"x":128,"y":704,"exts":{},"template":"Rocks_Top"},{"x":128,"y":250,"exts":{},"template":"Katya"}]'),
    bgs: JSON.parse('[{"depth":-100,"texture":"zakatBG","extends":{"repeat":"no-repeat","scaleX":0.7,"scaleY":0.7}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#A63D26',
    
    onStep() {
        PauseHandler()

if(this.playerStay == true && this.yes.visible) { 
if (ct.actions.MoveLeft.pressed || ct.actions.MoveRight.pressed) {
    if(this.yes.blendMode != 2) {
        this.yes.blendMode = 2
    } else {
        this.yes.blendMode = 0
    }

    if(this.no.blendMode != 2) {
        this.no.blendMode = 2
    } else {
        this.no.blendMode = 0
    }
}

    if(ct.actions.Shoot.pressed && this.yes.blendMode == 0) {
        ct.room.gameWin.visible = true;
        this.prince.cgroup = undefined;
        this.playerStay = false;
    }

    if(ct.actions.Shoot.pressed && this.no.blendMode == 0) {
        ct.room.gameOver.visible = true;
        this.playerStay = false;
    }

}

if (ct.room.gameWin.visible || ct.room.gameOver.visible) {
        this.yes.visible = false;
        this.no.visible = false;
        this.yes.kill = true;
        this.no.kill = true;
        this.merryText.kill = true;       
}
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.rings = 4;
this.countRings = 4;
this.prevRoom = 'Level_05';

this.sound='lvl6';
ct.sound.stop(this.sound)
ct.sound.spawn(this.sound, {volume:0.5})
inGameRoomStart(this);

this.player.canShoot = true;
ct.camera.borderY = 30;
ct.camera.borderX = 50;
this.playerStay = false;

this.yes.visible = this.yes.visible = false;
    },
    extends: {}
}


/**
 * @namespace
 */
ct.styles = {
    types: { },
    /**
     * Creates a new style with a given name.
     * Technically, it just writes `data` to `ct.styles.types`
     */
    new(name, styleTemplate) {
        ct.styles.types[name] = styleTemplate;
        return styleTemplate;
    },
    /**
     * Returns a style of a given name. The actual behavior strongly depends on `copy` parameter.
     * @param {string} name The name of the style to load
     * @param {boolean|Object} [copy] If not set, returns the source style object.
     * Editing it will affect all new style calls.
     * When set to `true`, will create a new object, which you can safely modify
     * without affecting the source style.
     * When set to an object, this will create a new object as well,
     * augmenting it with given properties.
     * @returns {object} The resulting style
     */
    get(name, copy) {
        if (copy === true) {
            return ct.u.ext({}, ct.styles.types[name]);
        }
        if (copy) {
            return ct.u.ext(ct.u.ext({}, ct.styles.types[name]), copy);
        }
        return ct.styles.types[name];
    }
};

ct.styles.new(
    "CrystalStyle",
    {
    "fontFamily": "sans-serif",
    "fontSize": 24,
    "fontStyle": "normal",
    "fontWeight": "600",
    "align": "left",
    "lineJoin": "round",
    "lineHeight": 32,
    "fill": [
        "#2ECC71",
        "#28B463"
    ],
    "fillGradientType": 0,
    "strokeThickness": 5,
    "stroke": "#FFFFFF"
});

ct.styles.new(
    "HeartStyle",
    {
    "fontFamily": "sans-serif",
    "fontSize": 24,
    "fontStyle": "normal",
    "fontWeight": "600",
    "align": "left",
    "lineJoin": "round",
    "lineHeight": 32,
    "fill": "#E85017",
    "strokeThickness": 5,
    "stroke": "#FFFFFF"
});

ct.styles.new(
    "RingStyle",
    {
    "fontFamily": "sans-serif",
    "fontSize": 55,
    "fontStyle": "normal",
    "fontWeight": "600",
    "align": "left",
    "lineJoin": "round",
    "lineHeight": 32,
    "fill": "#CC8100",
    "strokeThickness": 5,
    "stroke": "#FFFFFF"
});

ct.styles.new(
    "infoText",
    {
    "fontFamily": "sans-serif",
    "fontSize": 30,
    "fontStyle": "normal",
    "fontWeight": "600",
    "align": "center",
    "lineJoin": "round",
    "lineHeight": 40.5,
    "strokeThickness": 5,
    "stroke": "#FFFFFF"
});



/**
 * @typedef ISimplePoint
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef ITandemSettings
 *
 * @property {ISimplePoint} [scale] Optional scaling object with `x` and `y` parameters.
 * @property {ISimplePoint} [position] Set this to additionally shift the emitter tandem relative
 * to the copy it was attached to, or relative to the copy it follows.
 * @property {number} [prewarmDelay] Optional; if less than 0, it will prewarm the emitter tandem,
 * meaning that it will simulate a given number of seconds before
 * showing particles in the world. If greater than 0, will postpone
 * the effect for the specified number of seconds.
 * @property {number} [tint] Optional tint to the whole effect.
 * @property {number} [alpha] Optional opacity set to the whole effect.
 * @property {number} [rotation] Optional rotation in radians.
 * @property {number} [angle] Optional rotation in degrees.
 * @property {boolean} [isUi] If set to true, will use the time scale of UI layers. This affects
 * how an effect is simulated during slowmo effects and game pause.
 * @property {number} [depth] The depth of the tandem. Defaults to Infinity
 * (will overlay everything).
 * @property {Room} [room] The room to attach the effect to.
 * Defaults to the current main room (ct.room); has no effect if attached to a copy.
 */

/**
 * A class for displaying and managing a collection of particle emitters.
 *
 * @property {boolean} frozen If set to true, the tandem will stop updating its emitters
 * @property {Copy|DisplayObject} follow A copy to follow
 * @extends PIXI.Container
 */
class EmitterTandem extends PIXI.Container {
    /**
     * Creates a new emitter tandem. This method should not be called directly;
     * better use the methods of `ct.emitters`.
     * @param {object} tandemData The template object of the tandem, as it was exported from ct.IDE.
     * @param {ITandemSettings} opts Additional settings applied to the tandem
     * @constructor
     */
    constructor(tandemData, opts) {
        super();
        this.emitters = [];
        this.delayed = [];

        for (const emt of tandemData) {
            const inst = new PIXI.particles.Emitter(
                this,
                ct.res.getTexture(emt.texture),
                emt.settings
            );
            const d = emt.settings.delay + opts.prewarmDelay;
            if (d > 0) {
                inst.emit = false;
                this.delayed.push({
                    value: d,
                    emitter: inst
                });
            } else if (d < 0) {
                inst.emit = true;
                inst.update(-d);
            } else {
                inst.emit = true;
            }
            inst.initialDeltaPos = {
                x: emt.settings.pos.x,
                y: emt.settings.pos.y
            };
            this.emitters.push(inst);
            inst.playOnce(() => {
                this.emitters.splice(this.emitters.indexOf(inst), 1);
            });
        }
        this.isUi = opts.isUi;
        this.scale.x = opts.scale.x;
        this.scale.y = opts.scale.y;
        if (opts.rotation) {
            this.rotation = opts.rotation;
        } else if (opts.angle) {
            this.angle = opts.angle;
        }
        this.deltaPosition = opts.position;
        this.depth = opts.depth;
        this.frozen = false;

        if (this.isUi) {
            ct.emitters.uiTandems.push(this);
        } else {
            ct.emitters.tandems.push(this);
        }
    }
    /**
     * A method for internal use; advances the particle simulation further
     * according to either a UI ticker or ct.delta.
     * @returns {void}
     */
    update() {
        if (this.stopped) {
            for (const emitter of this.emitters) {
                if (!emitter.particleCount) {
                    this.emitters.splice(this.emitters.indexOf(emitter), 1);
                }
            }
        }
        // eslint-disable-next-line no-underscore-dangle
        if ((this.appendant && this.appendant._destroyed) || this.kill || !this.emitters.length) {
            this.emit('done');
            if (this.isUi) {
                ct.emitters.uiTandems.splice(ct.emitters.uiTandems.indexOf(this), 1);
            } else {
                ct.emitters.tandems.splice(ct.emitters.tandems.indexOf(this), 1);
            }
            this.destroy();
            return;
        }
        if (this.frozen) {
            return;
        }
        const s = (this.isUi ? PIXI.Ticker.shared.elapsedMS : PIXI.Ticker.shared.deltaMS) / 1000;
        for (const delayed of this.delayed) {
            delayed.value -= s;
            if (delayed.value <= 0) {
                delayed.emitter.emit = true;
                this.delayed.splice(this.delayed.indexOf(delayed), 1);
            }
        }
        for (const emt of this.emitters) {
            if (this.delayed.find(delayed => delayed.emitter === emt)) {
                continue;
            }
            emt.update(s);
        }
        if (this.follow) {
            this.updateFollow();
        }
    }
    /**
     * Stops spawning new particles, then destroys itself.
     * Can be fired only once, otherwise it will log a warning.
     * @returns {void}
     */
    stop() {
        if (this.stopped) {
            // eslint-disable-next-line no-console
            console.trace('[ct.emitters] An attempt to stop an already stopped emitter tandem. Continuing…');
            return;
        }
        this.stopped = true;
        for (const emt of this.emitters) {
            emt.emit = false;
        }
        this.delayed = [];
    }
    /**
     * Stops spawning new particles, but continues simulation and allows to resume the effect later
     * with `emitter.resume();`
     * @returns {void}
     */
    pause() {
        for (const emt of this.emitters) {
            if (emt.maxParticles !== 0) {
                emt.oldMaxParticles = emt.maxParticles;
                emt.maxParticles = 0;
            }
        }
    }
    /**
     * Resumes previously paused effect.
     * @returns {void}
     */
    resume() {
        for (const emt of this.emitters) {
            emt.maxParticles = emt.oldMaxParticles || emt.maxParticles;
        }
    }
    /**
     * Removes all the particles from the tandem, but continues spawning new ones.
     * @returns {void}
     */
    clear() {
        for (const emt of this.emitters) {
            emt.cleanup();
        }
    }

    updateFollow() {
        if (!this.follow) {
            return;
        }
        if (this.follow.kill || !this.follow.scale) {
            this.follow = null;
            this.stop();
            return;
        }
        const delta = ct.u.rotate(
            this.deltaPosition.x * this.follow.scale.x,
            this.deltaPosition.y * this.follow.scale.y,
            -this.follow.angle
        );
        for (const emitter of this.emitters) {
            emitter.updateOwnerPos(this.follow.x + delta.x, this.follow.y + delta.y);
            const ownDelta = ct.u.rotate(
                emitter.initialDeltaPos.x * this.follow.scale.x,
                emitter.initialDeltaPos.y * this.follow.scale.y,
                -this.follow.angle
            );
            emitter.updateSpawnPos(ownDelta.x, ownDelta.y);
        }
    }
}

(function emittersAddon() {
    const defaultSettings = {
        prewarmDelay: 0,
        scale: {
            x: 1,
            y: 1
        },
        tint: 0xffffff,
        alpha: 1,
        position: {
            x: 0,
            y: 0
        },
        isUi: false,
        depth: Infinity
    };

    /**
     * @namespace
     */
    ct.emitters = {
        /**
         * A map of existing emitter templates.
         * @type Array<object>
         */
        templates: [{
    "RubinFx": [
        {
            "texture": "GreenCrystal",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0.99,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 0.5674603174603174
                        },
                        {
                            "value": 0.99,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 1,
                            "time": 0
                        },
                        {
                            "value": 0.1200000000000001,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "ffffff",
                            "time": 0
                        },
                        {
                            "value": "ffffff",
                            "time": 0.5674603174603174
                        },
                        {
                            "value": "ffffff",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "normal",
                "speed": {
                    "list": [
                        {
                            "value": 500,
                            "time": 0
                        },
                        {
                            "value": 100,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.5,
                    "max": 0.5
                },
                "frequency": 0.001,
                "spawnChance": 0.98,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0.5,
                "maxParticles": 10,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "circle",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 32
                },
                "delay": 0,
                "minimumSpeedMultiplier": 0.48
            }
        }
    ],
    "HearthFX": [
        {
            "texture": "Heart",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0.99,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 0.5674603174603174
                        },
                        {
                            "value": 0.99,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 1,
                            "time": 0
                        },
                        {
                            "value": 0.1200000000000001,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "ffffff",
                            "time": 0
                        },
                        {
                            "value": "ffffff",
                            "time": 0.5674603174603174
                        },
                        {
                            "value": "ffffff",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "normal",
                "speed": {
                    "list": [
                        {
                            "value": 500,
                            "time": 0
                        },
                        {
                            "value": 100,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.5,
                    "max": 0.5
                },
                "frequency": 0.001,
                "spawnChance": 0.98,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0.5,
                "maxParticles": 10,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "circle",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 32
                },
                "delay": 0,
                "minimumSpeedMultiplier": 0.48
            }
        }
    ],
    "fire": [
        {
            "texture": "fireball",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 0.5
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 1,
                            "time": 0
                        },
                        {
                            "value": 0.3,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "ffffff",
                            "time": 0
                        },
                        {
                            "value": "ffffff",
                            "time": 0.5
                        },
                        {
                            "value": "ffffff",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "normal",
                "speed": {
                    "list": [
                        {
                            "value": 500,
                            "time": 0
                        },
                        {
                            "value": 100,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.5,
                    "max": 0.5
                },
                "frequency": 0.001,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0.5,
                "maxParticles": 20,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "circle",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 32
                },
                "delay": 0
            }
        }
    ],
    "win": [
        {
            "texture": "win",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0.665,
                            "time": 0
                        },
                        {
                            "time": 0.5119047619047619,
                            "value": 0.505
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": true
                },
                "scale": {
                    "list": [
                        {
                            "value": 1,
                            "time": 0
                        },
                        {
                            "value": 0.8899999999999999,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "C8FF8C",
                            "time": 0
                        },
                        {
                            "time": 0.5119047619047619,
                            "value": "FFFFFF"
                        },
                        {
                            "value": "ffffff",
                            "time": 1
                        }
                    ],
                    "isStepped": true
                },
                "blendMode": "add",
                "speed": {
                    "list": [
                        {
                            "value": 10,
                            "time": 0
                        },
                        {
                            "value": 1437.5,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 360
                },
                "rotationAcceleration": 360,
                "lifetime": {
                    "min": 1,
                    "max": 1
                },
                "frequency": 0.1,
                "spawnChance": 0.51,
                "particlesPerWave": 100,
                "angleStart": 0,
                "emitterLifetime": 0,
                "maxParticles": 100,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "ring",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 360,
                    "minR": 0
                },
                "delay": 0,
                "particleSpacing": 3.6,
                "spawnRect": {
                    "x": -100,
                    "y": -100,
                    "w": 200,
                    "h": 200
                },
                "noRotation": false,
                "minimumSpeedMultiplier": 0.01
            }
        },
        {
            "texture": "ring",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 0.5
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 1,
                            "time": 0
                        },
                        {
                            "value": 0.3,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "ffffff",
                            "time": 0
                        },
                        {
                            "value": "ffffff",
                            "time": 0.5
                        },
                        {
                            "value": "ffffff",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "normal",
                "speed": {
                    "list": [
                        {
                            "value": 500,
                            "time": 0
                        },
                        {
                            "value": 100,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.5,
                    "max": 0.5
                },
                "frequency": 0.008,
                "spawnChance": 1,
                "particlesPerWave": 10,
                "angleStart": 270,
                "emitterLifetime": 0,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "ring",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 200,
                    "minR": 100
                },
                "delay": 0,
                "particleSpacing": 36
            }
        }
    ]
}][0] || {},
        /**
         * A list of all the emitters that are simulated in UI time scale.
         * @type Array<EmitterTandem>
         */
        uiTandems: [],
        /**
         * A list of all the emitters that are simulated in a regular game loop.
         * @type Array<EmitterTandem>
         */
        tandems: [],
        /**
         * Creates a new emitter tandem in the world at the given position.
         * @param {string} name The name of the tandem template, as it was named in ct.IDE.
         * @param {number} x The x coordinate of the new tandem.
         * @param {number} y The y coordinate of the new tandem.
         * @param {ITandemSettings} [settings] Additional configs for the created tandem.
         * @return {EmitterTandem} The newly created tandem.
         */
        fire(name, x, y, settings) {
            if (!(name in ct.emitters.templates)) {
                throw new Error(`[ct.emitters] An attempt to create a non-existent emitter ${name}.`);
            }
            const opts = Object.assign({}, defaultSettings, settings);
            const tandem = new EmitterTandem(ct.emitters.templates[name], opts);
            tandem.x = x;
            tandem.y = y;
            if (!opts.room) {
                ct.room.addChild(tandem);
                tandem.isUi = ct.room.isUi;
            } else {
                opts.room.addChild(tandem);
                tandem.isUi = opts.room.isUi;
            }
            return tandem;
        },
        /**
         * Creates a new emitter tandem and attaches it to the given copy
         * (or to any other DisplayObject).
         * @param {Copy|PIXI.DisplayObject} parent The parent of the created tandem.
         * @param {string} name The name of the tandem template.
         * @param {ITandemSettings} [settings] Additional options for the created tandem.
         * @returns {EmitterTandem} The newly created emitter tandem.
         */
        append(parent, name, settings) {
            if (!(name in ct.emitters.templates)) {
                throw new Error(`[ct.emitters] An attempt to create a non-existent emitter ${name}.`);
            }
            const opts = Object.assign({}, defaultSettings, settings);
            const tandem = new EmitterTandem(ct.emitters.templates[name], opts);
            if (opts.position) {
                tandem.x = opts.position.x;
                tandem.y = opts.position.y;
            }
            tandem.appendant = parent;
            parent.addChild(tandem);
            return tandem;
        },
        /**
         * Creates a new emitter tandem in the world, and configs it so it will follow a given copy.
         * This includes handling position, scale, and rotation.
         * @param {Copy|PIXI.DisplayObject} parent The copy to follow.
         * @param {string} name The name of the tandem template.
         * @param {ITandemSettings} [settings] Additional options for the created tandem.
         * @returns {EmitterTandem} The newly created emitter tandem.
         */
        follow(parent, name, settings) {
            if (!(name in ct.emitters.templates)) {
                throw new Error(`[ct.emitters] An attempt to create a non-existent emitter ${name}.`);
            }
            const opts = Object.assign({}, defaultSettings, settings);
            const tandem = new EmitterTandem(ct.emitters.templates[name], opts);
            tandem.follow = parent;
            tandem.updateFollow();
            if (!('getRoom' in parent)) {
                ct.room.addChild(tandem);
            } else {
                parent.getRoom().addChild(tandem);
            }
            return tandem;
        }
    };

    PIXI.Ticker.shared.add(() => {
        for (const tandem of ct.emitters.uiTandems) {
            tandem.update();
        }
        for (const tandem of ct.emitters.tandems) {
            tandem.update();
        }
    });
})();
/**
 * @extends {PIXI.AnimatedSprite}
 * @class
 * @property {string} template The name of the template from which the copy was created
 * @property {IShapeTemplate} shape The collision shape of a copy
 * @property {number} depth The relative position of a copy in a drawing stack.
 * Higher values will draw the copy on top of those with lower ones
 * @property {number} xprev The horizontal location of a copy in the previous frame
 * @property {number} yprev The vertical location of a copy in the previous frame
 * @property {number} xstart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.templates.copy`.
 * @property {number} ystart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.templates.copy`.
 * @property {number} hspeed The horizontal speed of a copy
 * @property {number} vspeed The vertical speed of a copy
 * @property {number} gravity The acceleration that pulls a copy at each frame
 * @property {number} gravityDir The direction of acceleration that pulls a copy at each frame
 * @property {number} depth The position of a copy in draw calls
 * @property {boolean} kill If set to `true`, the copy will be destroyed by the end of a frame.
 */
const Copy = (function Copy() {
    const textureAccessor = Symbol('texture');
    const zeroDirectionAccessor = Symbol('zeroDirection');
    const hspeedAccessor = Symbol('hspeed');
    const vspeedAccessor = Symbol('vspeed');
    let uid = 0;
    class Copy extends PIXI.AnimatedSprite {
        /**
         * Creates an instance of Copy.
         * @param {string} template The name of the template to copy
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object with additional properties
         * that will exist prior to a copy's OnCreate event
         * @param {PIXI.DisplayObject|Room} [container] A container to set as copy's parent
         * before its OnCreate event. Defaults to ct.room.
         * @memberof Copy
         */
        constructor(template, x, y, exts, container) {
            container = container || ct.room;
            var t;
            if (template) {
                if (!(template in ct.templates.templates)) {
                    throw new Error(`[ct.templates] An attempt to create a copy of a non-existent template \`${template}\` detected. A typo?`);
                }
                t = ct.templates.templates[template];
                if (t.texture && t.texture !== '-1') {
                    const textures = ct.res.getTexture(t.texture);
                    super(textures);
                    this[textureAccessor] = t.texture;
                    this.anchor.x = textures[0].defaultAnchor.x;
                    this.anchor.y = textures[0].defaultAnchor.y;
                } else {
                    super([PIXI.Texture.EMPTY]);
                }
                this.template = template;
                this.parent = container;
                this.blendMode = t.blendMode || PIXI.BLEND_MODES.NORMAL;
                if (t.playAnimationOnStart) {
                    this.play();
                }
                if (t.extends) {
                    ct.u.ext(this, t.extends);
                }
            } else {
                super([PIXI.Texture.EMPTY]);
            }
            // it is defined in main.js
            // eslint-disable-next-line no-undef
            this[copyTypeSymbol] = true;
            this.position.set(x || 0, y || 0);
            this.xprev = this.xstart = this.x;
            this.yprev = this.ystart = this.y;
            this[hspeedAccessor] = 0;
            this[vspeedAccessor] = 0;
            this[zeroDirectionAccessor] = 0;
            this.speed = this.direction = this.gravity = 0;
            this.gravityDir = 90;
            this.depth = 0;
            if (exts) {
                ct.u.ext(this, exts);
                if (exts.tx) {
                    this.scale.x = exts.tx;
                }
                if (exts.ty) {
                    this.scale.y = exts.ty;
                }
                if (exts.tr) {
                    this.angle = exts.tr;
                }
            }
            this.uid = ++uid;
            if (template) {
                ct.u.ext(this, {
                    template,
                    depth: t.depth,
                    onStep: t.onStep,
                    onDraw: t.onDraw,
                    onCreate: t.onCreate,
                    onDestroy: t.onDestroy,
                    shape: ct.res.getTextureShape(t.texture || -1)
                });
                if (exts && exts.depth !== void 0) {
                    this.depth = exts.depth;
                }
                if (ct.templates.list[template]) {
                    ct.templates.list[template].push(this);
                } else {
                    ct.templates.list[template] = [this];
                }
                this.onBeforeCreateModifier();
                ct.templates.templates[template].onCreate.apply(this);
            }
            return this;
        }

        /**
         * The name of the current copy's texture, or -1 for an empty texture.
         * @param {string} value The name of the new texture
         * @type {(string|number)}
         */
        set tex(value) {
            if (this[textureAccessor] === value) {
                return value;
            }
            var {playing} = this;
            this.textures = ct.res.getTexture(value);
            this[textureAccessor] = value;
            this.shape = ct.res.getTextureShape(value);
            this.anchor.x = this.textures[0].defaultAnchor.x;
            this.anchor.y = this.textures[0].defaultAnchor.y;
            if (playing) {
                this.play();
            }
            return value;
        }
        get tex() {
            return this[textureAccessor];
        }

        get speed() {
            return Math.hypot(this.hspeed, this.vspeed);
        }
        /**
         * The speed of a copy that is used in `this.move()` calls
         * @param {number} value The new speed value
         * @type {number}
         */
        set speed(value) {
            if (value === 0) {
                this[zeroDirectionAccessor] = this.direction;
                this.hspeed = this.vspeed = 0;
                return;
            }
            if (this.speed === 0) {
                const restoredDir = this[zeroDirectionAccessor];
                this[hspeedAccessor] = value * Math.cos(restoredDir * Math.PI / 180);
                this[vspeedAccessor] = value * Math.sin(restoredDir * Math.PI / 180);
                return;
            }
            var multiplier = value / this.speed;
            this.hspeed *= multiplier;
            this.vspeed *= multiplier;
        }
        get hspeed() {
            return this[hspeedAccessor];
        }
        set hspeed(value) {
            if (this.vspeed === 0 && value === 0) {
                this[zeroDirectionAccessor] = this.direction;
            }
            this[hspeedAccessor] = value;
            return value;
        }
        get vspeed() {
            return this[vspeedAccessor];
        }
        set vspeed(value) {
            if (this.hspeed === 0 && value === 0) {
                this[zeroDirectionAccessor] = this.direction;
            }
            this[vspeedAccessor] = value;
            return value;
        }
        get direction() {
            if (this.speed === 0) {
                return this[zeroDirectionAccessor];
            }
            return (Math.atan2(this.vspeed, this.hspeed) * 180 / Math.PI + 360) % 360;
        }
        /**
         * The moving direction of the copy, in degrees, starting with 0 at the right side
         * and going with 90 facing upwards, 180 facing left, 270 facing down.
         * This parameter is used by `this.move()` call.
         * @param {number} value New direction
         * @type {number}
         */
        set direction(value) {
            this[zeroDirectionAccessor] = value;
            if (this.speed > 0) {
                var speed = this.speed;
                this.hspeed = speed * Math.cos(value * Math.PI / 180);
                this.vspeed = speed * Math.sin(value * Math.PI / 180);
            }
            return value;
        }

        /**
         * Performs a movement step, reading such parameters as `gravity`, `speed`, `direction`.
         * @returns {void}
         */
        move() {
            if (this.gravity) {
                this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
                this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
            }
            this.x += this.hspeed * ct.delta;
            this.y += this.vspeed * ct.delta;
        }
        /**
         * Adds a speed vector to the copy, accelerating it by a given delta speed
         * in a given direction.
         * @param {number} spd Additive speed
         * @param {number} dir The direction in which to apply additional speed
         * @returns {void}
         */
        addSpeed(spd, dir) {
            this.hspeed += spd * Math.cos(dir * Math.PI / 180);
            this.vspeed += spd * Math.sin(dir * Math.PI / 180);
        }

        /**
         * Returns the room that owns the current copy
         * @returns {Room} The room that owns the current copy
         */
        getRoom() {
            let parent = this.parent;
            while (!(parent instanceof Room)) {
                parent = parent.parent;
            }
            return parent;
        }

        // eslint-disable-next-line class-methods-use-this
        onBeforeCreateModifier() {
            // Filled by ct.IDE and catmods
            
        }
    }
    return Copy;
})();

(function ctTemplateAddon(ct) {
    const onCreateModifier = function () {
        this.$chashes = ct.place.getHashes(this);
for (const hash of this.$chashes) {
    if (!(hash in ct.place.grid)) {
        ct.place.grid[hash] = [this];
    } else {
        ct.place.grid[hash].push(this);
    }
}
if ([false][0] && this instanceof ct.templates.Copy) {
    this.$cDebugText = new PIXI.Text('Not initialized', {
        fill: 0xffffff,
        dropShadow: true,
        dropShadowDistance: 2,
        fontSize: [][0] || 16
    });
    this.$cDebugCollision = new PIXI.Graphics();
    this.addChild(this.$cDebugCollision, this.$cDebugText);
}

    };

    /**
     * An object with properties and methods for manipulating templates and copies,
     * mainly for finding particular copies and creating new ones.
     * @namespace
     */
    ct.templates = {
        Copy,
        /**
         * An object that contains arrays of copies of all templates.
         * @type {Object.<string,Array<Copy>>}
         */
        list: {
            BACKGROUND: [],
            TILEMAP: []
        },
        /**
         * A map of all the templates of templates exported from ct.IDE.
         * @type {object}
         */
        templates: { },
        /**
         * Creates a new copy of a given template inside a specific room.
         * @param {string} template The name of the template to use
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {Room} [room] The room to which add the copy.
         * Defaults to the current room.
         * @param {object} [exts] An optional object which parameters will be applied
         * to the copy prior to its OnCreate event.
         * @returns {Copy} the created copy.
         */
        copyIntoRoom(template, x = 0, y = 0, room, exts) {
            // An advanced constructor. Returns a Copy
            if (!room || !(room instanceof Room)) {
                throw new Error(`Attempt to spawn a copy of template ${template} inside an invalid room. Room's value provided: ${room}`);
            }
            const obj = new Copy(template, x, y, exts);
            room.addChild(obj);
            ct.stack.push(obj);
            onCreateModifier.apply(obj);
            return obj;
        },
        /**
         * Creates a new copy of a given template inside the current root room.
         * A shorthand for `ct.templates.copyIntoRoom(template, x, y, ct.room, exts)`
         * @param {string} template The name of the template to use
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object which parameters will be applied
         * to the copy prior to its OnCreate event.
         * @returns {Copy} the created copy.
         */
        copy(template, x = 0, y = 0, exts) {
            return ct.templates.copyIntoRoom(template, x, y, ct.room, exts);
        },
        /**
         * Applies a function to each copy in the current room
         * @param {Function} func The function to apply
         * @returns {void}
         */
        each(func) {
            for (const copy of ct.stack) {
                if (!(copy instanceof Copy)) {
                    continue; // Skip backgrounds and tile layers
                }
                func.apply(copy, this);
            }
        },
        /**
         * Applies a function to a given object (e.g. to a copy)
         * @param {Copy} obj The copy to perform function upon.
         * @param {Function} function The function to be applied.
         */
        withCopy(obj, func) {
            func.apply(obj, this);
        },
        /**
         * Applies a function to every copy of the given template name
         * @param {string} template The name of the template to perform function upon.
         * @param {Function} function The function to be applied.
         */
        withTemplate(template, func) {
            for (const copy of ct.templates.list[template]) {
                func.apply(copy, this);
            }
        },
        /**
         * Checks whether there are any copies of this template's name.
         * Will throw an error if you pass an invalid template name.
         * @param {string} template The name of a template to check.
         * @returns {boolean} Returns `true` if at least one copy exists in a room;
         * `false` otherwise.
         */
        exists(template) {
            if (!(template in ct.templates.templates)) {
                throw new Error(`[ct.templates] ct.templates.exists: There is no such template ${template}.`);
            }
            return ct.templates.list[template].length > 0;
        },
        /*
         * Checks whether a given object exists in game's world.
         * Intended to be applied to copies, but may be used with other PIXI entities.
         * @param {Copy|PIXI.DisplayObject|any} obj The copy which existence needs to be checked.
         * @returns {boolean} Returns `true` if a copy exists; `false` otherwise.
         */
        valid(obj) {
            if (obj instanceof Copy) {
                return !obj.kill;
            }
            if (obj instanceof PIXI.DisplayObject) {
                return Boolean(obj.position);
            }
            return Boolean(obj);
        },
        /**
         * Checks whether a given object is a ct.js copy.
         * @param {any} obj The object which needs to be checked.
         * @returns {boolean} Returns `true` if the passed object is a copy; `false` otherwise.
         */
        isCopy(obj) {
            return obj instanceof Copy;
        }
    };

    
ct.templates.templates["Katya"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Katya_stay",
    onStep: function () {
        ct.room.kill = false;

if (ct.actions.Shoot.pressed && this.canShoot === true) {
   ct.templates.copy('fireball', this.x, this.y - 50);
}

if (ct.place.occupied(this, this.x, this.y, 'Deadly') ) {
    PlayerDead(this, ct);
}
var enemy = ct.place.occupied(this, this.x, this.y, 'Enemy');
if (enemy) {
    if( (enemy.getGlobalPosition().y - this.getGlobalPosition().y) <= enemy.height / 2) {    
        PlayerDead(this, ct);
    }
}

if(ct.room.playerStay != true) {

    if (ct.actions.MoveLeft.down) {
        this.direction=-180;
        // Если зажата клавиша A или стрелка влево, то двигаемся влево
        this.hspd = -this.speed;
        // Назначим анимацию ходьбы и отразим робота влево
        if (this.tex !== 'Katya_move' && ct.place.occupied(this, this.x, this.y + 1, 'Solid'))  {
            this.tex = 'Katya_move';
        }
        this.scale.x = -1;
    } else if (ct.actions.MoveRight.down) {
        this.direction=0;
        // Если зажата клавиша D или стрелка вправо, то двигаемся вправо
        this.hspd = this.speed;
        // Назначим анимацию ходьбы и отразим робота вправо
        if (this.tex !== 'Katya_move'  && ct.place.occupied(this, this.x, this.y + 1, 'Solid')) {
            this.tex = 'Katya_move';
        }
        
        this.scale.x = 1;    
    } else {
        // Если ничего не зажато, то не двигаемся
        this.hspd = 0;
        // Если есть почва под ногами…
        if (ct.place.occupied(this, this.x, this.y + 1, 'Solid')) {
            this.tex = 'Katya_stay';
        }
    }

} else {
   this.tex = 'Katya_stay';
   this.y = ct.room.prince.y + 50
}

// Если у робота есть почва под ногами…
if (ct.place.occupied(this, this.x, this.y + 1, 'Solid')) {
    // …и клавиша W зажата то прыгаем
    if (ct.actions.Jump.down) {
        ct.sound.spawn('jump', {volume:0.3});
        this.vspd = this.jumpSpeed;
    } else {
        // Иначе сбрасываем вертикальную скорость, чтобы не оказаться под землёй!
        this.vspd = 0;
    }
} else {
    // Если под ногами нет опоры  
    this.vspd += this.gravity;
    // Поставим анимацию прыжка!
    if (this.tex !== 'Katya_jump') {
        this.tex = 'Katya_jump';
    }
}

// Движение по горизонтали, пиксель за пикселем
for (var i = 0; i < Math.abs(this.hspd); i++) {
    if (ct.place.free(this, this.x + Math.sign(this.hspd), this.y, 'Solid')) {
        this.x += Math.sign(this.hspd);
    } else {
        break;
    }
}
// То же самое, но по вертикали
for (var i = 0; i < Math.abs(this.vspd); i++) {
    if (ct.place.free(this, this.x, this.y + Math.sign(this.vspd), 'Solid')) {
        this.y += Math.sign(this.vspd);
    } else {
        ct.camera.shake = 0.4;
        break;
    }
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        ct.room.player = this;
this.constSpeed = 4; // Максимальная скорость движения по горизонтали
this.speed = this.constSpeed;
this.jumpSpeed = -9;
this.gravity = 0.5;

this.hspd = 0; // Горизонтальная скорость
this.vspd = 0; // Вертикальная скорость

ct.camera.follow = this;

this.animationSpeed = 0.3;

//точка возрождения
this.savedX = this.x;
this.savedY = this.y;

this.play();

this.depth=-1;

this.direction = 0;
this.canShoot = false;
    },
    extends: {
    "cgroup": "Player"
}
};
ct.templates.list['Katya'] = [];
ct.templates.templates["Rocks"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Rocks",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['Rocks'] = [];
ct.templates.templates["Rocks_Top"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Rocks_Top",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['Rocks_Top'] = [];
ct.templates.templates["Rocks_Platform"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Rocks_Platform",
    onStep: function () {
        JumpBlock(this)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": ""
}
};
ct.templates.list['Rocks_Platform'] = [];
ct.templates.templates["Spikes"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Spikes",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['Spikes'] = [];
ct.templates.templates["Checkpoint"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "flagRedHanging",
    onStep: function () {
        var player = ct.place.meet(this, this.x, this.y, 'Katya');
if (player) {
    player.savedX = this.x + 32;
    player.savedY = this.y + 32;
     
    
    if (this.tex !== 'flagAnim')  {
        this.tex = 'flagAnim';
        this.animationSpeed = 0.1;
        ct.sound.spawn('checkpoint',{volume:0.4});
        this.play();
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Checkpoint'] = [];
ct.templates.templates["Exit"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Exit",
    onStep: function () {
        // Существует ли переменная со следующей комнатой?
if (ct.room.nextRoom && ct.room.rings == ct.room.countRings) {
    if (ct.place.meet(this, this.x, this.y, 'Katya')) {
        ct.sound.stop(ct.room.sound)
        if(!this.isSoundPlay) {
            this.isSoundPlay = true;
            ct.sound.spawn('round');
        }

        if(ct.room.crystals == ct.room.crystalsTotal && ct.room.crystalsTotal > 0) {
            ct.startLives++;
        }

        // Перейти в другую комнату
        ct.rooms.switch(ct.room.nextRoom);
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        ct.room.exit = this
this.depth=-2
this.isSoundPlay = false;
    },
    extends: {}
};
ct.templates.list['Exit'] = [];
ct.templates.templates["GreenCrystal"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "GreenCrystal",
    onStep: function () {
        if (ct.place.meet(this, this.x, this.y, 'Katya')) {
    ct.room.crystals ++;
    ct.emitters.fire('RubinFx', this.x, this.y);
    ct.sound.spawn('point');
    this.kill = true;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['GreenCrystal'] = [];
ct.templates.templates["CrystalCounter"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "GreenCrystal",
    onStep: function () {
        
    },
    onDraw: function () {
        var offset = 50;
this.x = ct.camera.x + ct.room.x + offset;
this.y = ct.camera.y + ct.room.y + offset+10;

this.text.text = ct.room.crystals + ' / ' + ct.room.crystalsTotal;
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text('0 / ' + ct.room.crystalsTotal, ct.styles.get('CrystalStyle'));
this.text.x = 32;
this.text.anchor.y = 0.5;

this.addChild(this.text);
    },
    extends: {}
};
ct.templates.list['CrystalCounter'] = [];
ct.templates.templates["Heart"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Heart",
    onStep: function () {
        if (ct.place.meet(this, this.x, this.y, 'Katya')) {
    if (ct.room.lives < ct.startLives) {
        ct.room.lives++;
        ct.emitters.fire('HearthFX', this.x, this.y);
        ct.sound.spawn('hearth');
        this.kill = true;
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Heart'] = [];
ct.templates.templates["HeartsWidget"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Heart",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        var offset = 50;
this.x = ct.camera.x + ct.room.x + offset;
this.y = ct.camera.y + ct.room.y + offset - 20;

this.text.text = ct.room.lives;
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text(ct.room.lives, ct.styles.get('HeartStyle'));
this.text.x = + 52;
this.text.anchor.y = 0.5;
this.text.anchor.x = 1;

this.addChild(this.text);
    },
    extends: {}
};
ct.templates.list['HeartsWidget'] = [];
ct.templates.templates["Platform"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Platform",
    onStep: function () {
        //столкновение с типом шаблона
var player = ct.place.meet(this, this.x, this.y, 'Katya');
if (player) {
    this.cgroup = undefined;
} else {
    this.cgroup='Solid';
    player = ct.place.meet(this, this.x, this.y - 1, 'Katya');
    if (player) {
        player.x += ct.u.ldx(this.speed, this.direction);
    }
}

//столкновение с группой коллизий
if (ct.place.occupied(this, this.x + this.speed * ct.delta, this.y, 'Solid')) {
    // Сменить направление
    if(this.direction == 0){
        this.direction = 180;
    } else {
        this.direction = 0;
    }
}
this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 2;
    },
    extends: {
    "cgroup": ""
}
};
ct.templates.list['Platform'] = [];
ct.templates.templates["PauseHint"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pause",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['PauseHint'] = [];
ct.templates.templates["DieBlock"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "DieBlock",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.visible=false;
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['DieBlock'] = [];
ct.templates.templates["Prince"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Prince_stay",
    onStep: function () {
        if(ct.place.occupied(this, this.x, this.y, 'Deadly')) {
    ct.room.gameOver.visible = true;
}

if ((!ct.place.meet(this, this.x, this.y, 'Katya') && ct.room.gameWin.visible!=true) || ct.room.gameOver.visible == true ) {
    this.isAnimate = true;
    
    //двигаемся влево
    this.hspd = -this.speed;
    
    if (this.tex !== 'Prince_walk')  {
        this.tex = 'Prince_walk';
    }
    ct.room.merryText.start = false;
} else {
    if (!ct.room.gameWin.visible && !ct.room.gameOver.visible) {
        ct.room.playerStay = true;
    }
    this.hspd = 0;
    this.tex = 'Prince_sit';
    ct.timer.add(600, 'merry').then(() => {
        this.isAnimate = false;
        this.stop()
        ct.room.merryText.visible = true;
        ct.room.merryText.start = true;
    })
}

if(ct.room.gameWin.visible === true){
    this.tex = 'Prince_stay';
}

if(this.isAnimate == true) {
    this.play(); 
}

 
// Движение по горизонтали, пиксель за пикселем
for (var i = 0; i < Math.abs(this.hspd); i++) {
    this.x += Math.sign(this.hspd);
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.scale.x=this.scale.y=2.1
this.gravity = 0.5;
this.speed = 1; // Максимальная скорость движения по горизонтали

this.hspd = 0; // Вертикальная скорость

this.animationSpeed = 0.15;

this.isAnimate = true;

ct.room.prince = this;
this.depth = 1;
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['Prince'] = [];
ct.templates.templates["MerryText"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        if (this.start && this.i < this.length) {
    if (this.i % this.speedK == 0) {
        this.messagePanel += this.message.charAt(this.i / this.speedK)
        this.text = new PIXI.Text(this.messagePanel, ct.styles.get('HeartStyle'));
        this.addChild(this.text);
        ct.sound.spawn('button', {volume:0.3});
     }
     this.i++;
}

if (this.i >= this.length) {
    ct.timer.add(1000, 'merryBtn').then(() => {
        ct.room.yes.visible = true;
        ct.room.no.visible = true;
    })
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text('', ct.styles.get('HeartStyle'));
this.text.x = + 52;
this.text.anchor.y = 0.5;
this.text.anchor.x = 1;

this.addChild(this.text);
this.visible = true;

ct.room.merryText = this;

this.message = 'Наконец-то ты нашла меня!🌟 Ты проделала огромный путь!\nОдолела кучу врагов! Дралась с медведем🐻 и даже с драконом 🐲\nВижу, что ты смогла собрать все кольца на пути😏\nЯ очень тебя люблю ❤️ и теперь я хочу предложить тебе своё 💍 и спросить:\n\nТЫ ВЫЙДЕШЬ ЗА МЕНЯ ЗАМУЖ ?';
this.messagePanel = ''
this.i = 0;
this.start = false;

this.speedK = 5;
this.length = this.message.length * this.speedK;

this.depth = 99
    },
    extends: {}
};
ct.templates.list['MerryText'] = [];
ct.templates.templates["sliz"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "sliz_run",
    onStep: function () {
        var freeBelow = ct.place.free(this, this.x + ct.u.ldx(70, this.direction), this.y + 35, 'Solid');

var occupiedInFront = ct.place.occupied(this, this.x + ct.u.ldx(7, this.direction), this.y, 'Solid');

if (freeBelow || occupiedInFront) {
    if (this.direction === 0) {
        this.direction = 180;
    } else {
        this.direction = 0;
    }
    this.scale.x *= -1;
}

var freePlayer = ct.place.free(this, this.x + ct.u.ldx(150, this.direction), this.y, 'Player');
if(!freePlayer) {
    ct.sound.spawn('sliz', {volume:0.1});
  
    if (this.scale.x < 3 && this.scale.x > 0) {
        this.scale.x+=0.03
    }
    if(this.scale.x > -3 && this.scale.x < 0) {
        this.scale.x-=0.03
    }
    if (this.scale.y < 3) {
        this.scale.y+=0.03
    }
} else {
    if(this.scale.x > 1) {
       this.scale.x-=0.01
    }
    if(this.scale.x < -1) {
       this.scale.x+=0.01
    }
    if(this.scale.y > 1) {
        this.scale.y-=0.01
    }
}

EnemyKill(this, ct, 'sliz_die')

this.move();

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.scale.x = -1;
this.speed = 1;
this.direction = -180;

this.animationSpeed = 4 / 60;
this.play();
    },
    extends: {
    "cgroup": "Enemy"
}
};
ct.templates.list['sliz'] = [];
ct.templates.templates["rat"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "rat_run",
    onStep: function () {
        var freeBelow = ct.place.free(this, this.x + ct.u.ldx(70, this.direction), this.y + 35, 'Solid');

var occupiedInFront = ct.place.occupied(this, this.x + ct.u.ldx(7, this.direction), this.y, 'Solid');

if (freeBelow || occupiedInFront) {
    if (this.direction === 0) {
        this.direction = 180;
        this.scale.x = -1;
    } else {
        this.direction = 0;
        this.scale.x = 1;
    }
}

EnemyKill(this, ct, 'rat_die')

this.move();

if (ct.place.meet(this, this.x, this.y, 'rat') 
    && !this.isBirth && this.countChilds <= 3 
    && ct.templates.list['rat'].length < 40
    && ct.room.activeFlags[this.param] == true) {
    this.isBirth = true;
    this.countChilds++;

    var child = ct.templates.copy('rat', this.x , this.y);
    child.speed = 0;
    child.direction = this.direction;
    child.scale.x = this.scale.x;
    child.isBirth = true;

    ct.timer.add(3000, 'birth').then(() => {
        child.speed = 1.1
        this.isBirth = false;
    })
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 1;

this.animationSpeed = 4 / 60;
this.play();

this.isBirth = false;
this.countChilds = 0;
    },
    extends: {
    "cgroup": "Enemy"
}
};
ct.templates.list['rat'] = [];
ct.templates.templates["sova"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "sova",
    onStep: function () {
        var occupiedInFront = ct.place.occupied(this, this.x + ct.u.ldx(7, this.direction), this.y, 'Solid');

if (occupiedInFront) {
    if (this.direction === 180) {
        this.direction = 0;
        this.scale.x = -1;
    } else {
        this.direction = -180;
        this.scale.x = 1;
    }
}

EnemyKill(this, ct, 'sova_die')

this.move();

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 2;
this.direction = 180;

this.animationSpeed = 10 / 60;
this.play();
    },
    extends: {
    "cgroup": "Enemy"
}
};
ct.templates.list['sova'] = [];
ct.templates.templates["ring"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "ring",
    onStep: function () {
        if (ct.place.meet(this, this.x, this.y, 'Katya')) {
    ct.room.rings++;
    if(ct.room.sound && ct.sound.playing(ct.room.sound)) {
        ct.sound.stop(ct.room.sound)
    }
    ct.sound.spawn('ring');
    this.kill = true;
    ct.room.exit.tex = 'exit_open';
}

this.play()
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['ring'] = [];
ct.templates.templates["RingWidget"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "ring",
    onStep: function () {
        
    },
    onDraw: function () {
        var offset = 50;
this.x = ct.camera.x + ct.room.x + offset;
this.y = ct.camera.y + ct.room.y + offset + 45;
this.scale.x = 0.5;
this.scale.y = 0.5;

this.text.text = ct.room.rings +' / 4';
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text(ct.room.rings + ' / 4', ct.styles.get('RingStyle'));
this.text.x = 64;
this.text.anchor.y = 0.5;

this.addChild(this.text);
this.play()
    },
    extends: {}
};
ct.templates.list['RingWidget'] = [];
ct.templates.templates["bear"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "bear",
    onStep: function () {
        var freeBelow = ct.place.free(this, this.x + ct.u.ldx(70, this.direction), this.y + 50, 'Solid');

var occupiedInFront = ct.place.occupied(this, this.x + ct.u.ldx(30, this.direction), this.y, 'Solid');

if (freeBelow || occupiedInFront) {
     if (this.direction === 180) {
        this.direction = 0;
        this.scale.x = -1;
    } else {
        this.direction = -180;
        this.scale.x = 1;
    }
}

var player = ct.place.meet(this, this.x, this.y, 'Katya')
if (player) {
    player.vspd = player.jumpSpeed * 1.3;
    if(ct.room.kill == false && (this.getGlobalPosition().y - player.getGlobalPosition().y) > this.height / 2) {
            this.cgroup = undefined;
            this.tex = 'bear_die';
            ct.sound.spawn('enemy_death');  
            ct.sound.spawn('bear_die');
            this.live--;
            if(this.live <= 5 ) {
                this.speed = 3;
                this.animationSpeed = 10 / 60;
            }
            if(this.live <= 0 ) {                
                ct.timer.add(500, 'kill').then(() => {
                   this.kill = true;
                   var fireballFlag = ct.templates.copy('fireballFlag', this.x - 200, this.y - 100);
                })    
            } else {
                ct.timer.add(500, 'kill').then(() => {
                    this.cgroup = 'Enemy';
                    this.tex = 'bear';
                })
            }
    }
}

var fireball = ct.place.meet(this, this.x, this.y, 'fireball')
    if (fireball) {
            this.cgroup = undefined;
            this.tex = 'bear_die';
            ct.sound.spawn('enemy_death');  
            this.live--;
            if(this.live <= 0 ) {
                ct.sound.spawn('bear_die');                
                ct.timer.add(500, 'kill').then(() => {
                   this.kill = true;
                })    
            } else {
                ct.timer.add(500, 'kill').then(() => {
                    this.cgroup = 'Enemy';
                    this.tex = 'bear';
                })
            }
       fireball.kill = true;
       ct.emitters.fire('fire', fireball.x, fireball.y);
    } 

this.move();

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 1.8;
this.direction = 180;
this.live = 10;

this.animationSpeed = 7 / 60;
this.play();
    },
    extends: {
    "cgroup": "Enemy"
}
};
ct.templates.list['bear'] = [];
ct.templates.templates["wolf2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "wolf2",
    onStep: function () {
        var freeBelow = ct.place.free(this, this.x + ct.u.ldx(70, this.direction), this.y + 50, 'Solid');

var occupiedInFront = ct.place.occupied(this, this.x + ct.u.ldx(7, this.direction), this.y, 'Solid');

if (freeBelow || occupiedInFront) {
     if (this.direction === 180) {
        this.direction = 0;
        this.scale.x = -1;
    } else {
        this.direction = -180;
        this.scale.x = 1;
    }
}

EnemyKill(this, ct, 'wolf2_die')

this.move();

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 1;
this.direction = 180;

this.animationSpeed = 7 / 60;
this.play();
    },
    extends: {
    "cgroup": "Enemy"
}
};
ct.templates.list['wolf2'] = [];
ct.templates.templates["wolf"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "wolf",
    onStep: function () {
        var freeBelow = ct.place.free(this, this.x + ct.u.ldx(100, this.direction), this.y + 50, 'Solid');

var occupiedInFront = ct.place.occupied(this, this.x + ct.u.ldx(30, this.direction), this.y, 'Solid');

if (freeBelow || occupiedInFront) {
     if (this.direction === 180) {
        this.direction = 0;
        this.scale.x = -1;
    } else {
        this.direction = -180;
        this.scale.x = 1;
    }
}

EnemyKill(this, ct, 'wolf_die')

this.move();

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 2.5;
this.direction = 180;

this.animationSpeed = 12 / 60;
this.play();
    },
    extends: {
    "cgroup": "Enemy"
}
};
ct.templates.list['wolf'] = [];
ct.templates.templates["waterAnim"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "waterAnim",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 7 / 60;
this.play()
this.scale.set(0.75,0.75)
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['waterAnim'] = [];
ct.templates.templates["shroom"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "shroom",
    onStep: function () {
        var player = ct.place.meet(this, this.x, this.y, 'Katya')
if (player) {
    ct.sound.spawn('shroom');
    player.y -=10 
    player.vspd = player.jumpSpeed * 1.3;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": ""
}
};
ct.templates.list['shroom'] = [];
ct.templates.templates["rockMossAlt"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "rockMossAlt",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['rockMossAlt'] = [];
ct.templates.templates["stoneCaveBR"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "stoneCaveBR",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['stoneCaveBR'] = [];
ct.templates.templates["sign"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "sign",
    onStep: function () {
        var player = ct.place.meet(this, this.x, this.y, 'Katya')
if (player) {
    if(this.textValue) {
        this.text = new PIXI.Text(this.textValue, ct.styles.get('infoText'));
        this.text.x = + 52;
        this.text.anchor.y = 7;
        this.text.anchor.x = 0.5;

        this.addChild(this.text);
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['sign'] = [];
ct.templates.templates["start"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "start",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth=-2
    },
    extends: {}
};
ct.templates.list['start'] = [];
ct.templates.templates["bgH"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "bg",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['bgH'] = [];
ct.templates.templates["bgW"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "bg_(копия)",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['bgW'] = [];
ct.templates.templates["castleCenter"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "castleCenter",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['castleCenter'] = [];
ct.templates.templates["castleLeft"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "castleLeft",
    onStep: function () {
        JumpBlock(this)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['castleLeft'] = [];
ct.templates.templates["castleRight"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "castleRight",
    onStep: function () {
        JumpBlock(this)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['castleRight'] = [];
ct.templates.templates["castleMid"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "castleMid",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['castleMid'] = [];
ct.templates.templates["castleHalf"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "castleHalf",
    onStep: function () {
        JumpBlock(this)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['castleHalf'] = [];
ct.templates.templates["fire"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "fire",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 6 / 60;
this.play()
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['fire'] = [];
ct.templates.templates["bat"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "bat",
    onStep: function () {
        var occupiedInFront = ct.place.occupied(this, this.x + ct.u.ldx(7, this.direction), this.y, 'Solid');

if (occupiedInFront) {
    if (this.direction === 180) {
        this.direction = 0;
        this.scale.x = 1;
    } else {
        this.direction = -180;
        this.scale.x = -1;
    }
}

EnemyKill(this, ct, 'bat_die')

this.move();

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 3;
this.direction = 0;

this.animationSpeed = 10 / 60;
this.play();
    },
    extends: {
    "cgroup": "Enemy"
}
};
ct.templates.list['bat'] = [];
ct.templates.templates["activeBlock"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "activeBlock",
    onStep: function () {
        if (ct.place.meet(this, this.x, this.y, 'Katya')) {
    ct.room.activeFlags[this.param] = true;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.visible=false;
    },
    extends: {}
};
ct.templates.list['activeBlock'] = [];
ct.templates.templates["skelet"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "skelet",
    onStep: function () {
        var player = ct.place.meet(this, this.x, this.y+100, 'Katya')
if(player) {
   this.isMove = true;
   this.cgroup='Solid'
} else {
   this.cgroup=undefined
}
if (this.isMove) {
   this.play()
   
   if(player) {
      player.x += ct.u.ldx(1, this.direction);
   }
   if (this.rotation >= -0.5 && this.direction == 0) {
      this.rotation -= 0.015;
      this.direction = 0;
   } else { 
      if(this.rotation <= 0.5) {
         this.rotation += 0.015;
         this.direction = 180
      } else {
         this.rotation -= 0.015;
         this.direction = 0;
      }
   }   
} else {

   // if(this.rotation != 0) {
   //    if (this.rotation >= 0) {
   //       this.rotation -= 0.015;
   //    } else { 
   //       this.rotation += 0.015;
   //    }   
   // }
}

 if (ct.actions.Jump.down && player) {
      this.cgroup=undefined
      player.vspd = player.jumpSpeed;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 19 / 60;
this.isMove = false;
    },
    extends: {
    "cgroup": ""
}
};
ct.templates.list['skelet'] = [];
ct.templates.templates["fireball"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "fireball",
    onStep: function () {
        this.rotation += 0.2;
this.y += 1;
this.move()

if(this.x > (ct.room.player.x+this.distanceKill) || this.x < (ct.room.player.x-this.distanceKill)){
    this.kill = true;
}

var occupiedInFront = ct.place.occupied(this, this.x + ct.u.ldx(0, this.direction), this.y, 'Solid');
if(occupiedInFront) {
   this.kill = true; 
   ct.emitters.fire('fire', this.x, this.y);
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 7;
this.direction = ct.room.player.direction;
this.distanceKill=500;
ct.sound.spawn('fireball',{volume:0.4});
    },
    extends: {}
};
ct.templates.list['fireball'] = [];
ct.templates.templates["boxAlt"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "boxAlt",
    onStep: function () {
        if(ct.place.meet(this, this.x, this.y, 'fireball')){
    ct.sound.spawn('broke',{volume:0.1});
    this.kill=true;
}

if(ct.place.meet(this, this.x, this.y, 'dragon')){
    ct.sound.spawn('broke',{volume:0.1});
    this.kill=true;
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['boxAlt'] = [];
ct.templates.templates["fireballFlag"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "fireball",
    onStep: function () {
        this.rotation += 0.05;
ct.emitters.fire('fire',this.x, this.y);

var player = ct.place.meet(this, this.x, this.y, 'Katya')
if (player) {
    player.canShoot = true;

    var sign = ct.templates.copy('sign', this.x, this.y + 100);
    sign.textValue = '😈 Для стрельбы 🔥 используй ПРОБЕЛ 😈';

    this.kill = true;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.scale.x = 2
this.scale.y = 2
    },
    extends: {}
};
ct.templates.list['fireballFlag'] = [];
ct.templates.templates["springboard"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "springboard",
    onStep: function () {
        var player = ct.place.meet(this, this.x, this.y, 'Katya')
if (player) {
    this.play()
    ct.sound.spawn('shroom');
    player.y -=10 
    player.vspd = player.jumpSpeed * 4;
} else {
    this.stop();
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['springboard'] = [];
ct.templates.templates["dragon"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "drRun",
    onStep: function () {
        var occupiedInFront = ct.place.occupied(this, this.x + ct.u.ldx(30, this.direction), this.y, 'Solid');

if (occupiedInFront) {
     if (this.direction === 0) {
        this.direction = -180;
    } else {
        this.direction = 0;
    }
    this.scale.x *= -1;
}

if (this.tex == 'drFly') {
    if(this.y >= this.currentY - 200){
        this.y -= 10;
    }
} else {
     if(this.y < this.currentY) {
        this.y += 10;
    }
}

if (this.tex == 'drAttack') {
    if(!this.isShoot) {
        ct.sound.spawn('drFire');
        this.isShoot = true;
        ct.timer.add(3000, 'fire').then(() => {
            this.isShoot = false;
        })
    }
}

if(!this.die) {
    ct.timer.add(5000, 'change').then(() => {
        this.currentTxt = ct.random.dice(
            'drRun',
            'drJump',
            'drFly',
            'drAttack'
        );
    })

    this.move();
} else {
    this.tex = 'drDie';
    this.cgroup = undefined
    
    this.gotoAndStop(4)    
    
    ct.templates.list['platformSave'].forEach(function(item,index){
        item.kill = true;
    })
    
    if(!ct.room.exit.visible) {
        ct.sound.stop(ct.room.sound)
        ct.room.exit.y = ct.room.posExitY;
        ct.sound.spawn('ring');
        ct.room.exit.visible = true;
    }    
}


var player = ct.place.meet(this, this.x, this.y, 'Katya')
if (player) {
    player.vspd = player.jumpSpeed * 1.3;
    if(ct.room.kill == false && (this.getGlobalPosition().y - player.getGlobalPosition().y) > this.height / 2) {
            this.cgroup = undefined;
            this.tex = 'drDie';
            ct.sound.spawn('enemy_death');  
            if(!this.die) {
              ct.sound.spawn('dragon');
            }
            this.live--;
            if(this.live % 25 == 0) {
                 ct.templates.copy('Heart', this.x , this.currentY);
            }
            if(this.live <= 0 ) {
                this.die = true;     
            } else {
                ct.timer.add(1000, 'kill').then(() => {
                    this.cgroup = 'Enemy';
                    this.tex = this.currentTxt;
                })
            }
    }
}

var fireball = ct.place.meet(this, this.x, this.y, 'fireball')
    if (fireball) {
         ct.sound.spawn('enemy_death');  
         this.live--;

            if(this.live % 25 == 0 && !this.die) {
                 ct.templates.copy('Heart', this.x , this.currentY);
                 ct.sound.spawn('dragon');
            }
            if(this.live <= 0 ) {
                if(!this.die){
                    ct.sound.spawn('dragon');
                }             
                this.die = true;
            } else {
                ct.timer.add(1000, 'kill').then(() => {
                    this.tex = this.currentTxt;
                })
            }
       fireball.kill = true;
       ct.emitters.fire('fire', fireball.x, fireball.y);
    } 

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 3;
this.direction = 0;
this.live = 100;
this.scale.x = this.scale.y = 3;

this.animationSpeed = 8 / 60;
this.play();

this.tex = 'drJump';
this.currentTxt = this.tex;
this.currentY = this.y;

this.isShoot = false;
ct.room.dragon = this;

this.die = false;
    },
    extends: {
    "cgroup": "Enemy"
}
};
ct.templates.list['dragon'] = [];
ct.templates.templates["platformSave"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "platformSave",
    onStep: function () {
        if (ct.place.meet(this, this.x, this.y, 'Katya')) {
    ct.room.dragon.cgroup=undefined
} else {
   ct.room.dragon.cgroup='Enemy'
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.visible = false;
    },
    extends: {}
};
ct.templates.list['platformSave'] = [];
ct.templates.templates["gameOver"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.MULTIPLY,
    playAnimationOnStart: false,
    texture: "gameOver",
    onStep: function () {
        if(this.visible && !this.soundPlay) {
    ct.sound.stop(ct.room.sound)
    this.soundPlay = true;
    ct.sound.spawn('gameOver',{volume:1.5});
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 100
this.scale.x = this.scale.y = 2
this.visible = false;
ct.room.gameOver = this;
this.soundPlay = false;
    },
    extends: {}
};
ct.templates.list['gameOver'] = [];
ct.templates.templates["yes"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "yes",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.scale.x = this.scale.y = 0.3
ct.room.yes = this
this.visible = false;
    },
    extends: {}
};
ct.templates.list['yes'] = [];
ct.templates.templates["no"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.MULTIPLY,
    playAnimationOnStart: false,
    texture: "no",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.scale.x = this.scale.y = 0.3
ct.room.no = this
this.visible = false;
    },
    extends: {}
};
ct.templates.list['no'] = [];
ct.templates.templates["win"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "win",
    onStep: function () {
        if(this.visible && !this.soundPlay) {
    ct.emitters.fire('win', this.width, this.height/1.3).depth = -1
    ct.sound.stop(ct.room.sound)
    ct.room.sound = 'dress'
    ct.sound.spawn(ct.room.sound,{volume:1.5});
    this.soundPlay = true;
}

if (this.scale.x <= 1) {
   this.sizeDo = true
}

if (this.scale.x >= 2) {
   this.sizeDo = false
}

    let step = 0.01
    if (!this.sizeDo) {
        this.scale.x -= step
        this.scale.y -= step
    } else {
        this.scale.x += step
        this.scale.y += step
    }

    if (this.rotation >= -0.5 && this.direction == 0) {
      this.rotation -= 0.015;
      this.direction = 0;
   } else { 
      if(this.rotation <= 0.5) {
         this.rotation += 0.015;
         this.direction = 180
      } else {
         this.rotation -= 0.015;
         this.direction = 0;
      }
   }   
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 100
this.scale.x = this.scale.y = 2
this.visible = false;
ct.room.gameWin = this;
this.soundPlay = false;
this.sizeDo = false;
    },
    extends: {}
};
ct.templates.list['win'] = [];
    

    ct.templates.beforeStep = function beforeStep() {
        
    };
    ct.templates.afterStep = function afterStep() {
        
    };
    ct.templates.beforeDraw = function beforeDraw() {
        if ([false][0] && this instanceof ct.templates.Copy) {
    this.$cDebugText.scale.x = this.$cDebugCollision.scale.x = 1 / this.scale.x;
    this.$cDebugText.scale.y = this.$cDebugCollision.scale.y = 1 / this.scale.y;
    this.$cDebugText.angle = this.$cDebugCollision.angle = -this.angle;

    const newtext = `Partitions: ${this.$chashes.join(', ')}
CGroup: ${this.cgroup || 'unset'}
Shape: ${(this._shape && this._shape.__type) || 'unused'}`;
    if (this.$cDebugText.text !== newtext) {
        this.$cDebugText.text = newtext;
    }
    this.$cDebugCollision
    .clear();
    ct.place.drawDebugGraphic.apply(this);
    this.$cHadCollision = false;
}

    };
    ct.templates.afterDraw = function afterDraw() {
        /* eslint-disable no-underscore-dangle */
if ((this.transform && (this.transform._localID !== this.transform._currentLocalID)) ||
    this.x !== this.xprev ||
    this.y !== this.yprev
) {
    delete this._shape;
    const oldHashes = this.$chashes || [];
    this.$chashes = ct.place.getHashes(this);
    for (const hash of oldHashes) {
        if (this.$chashes.indexOf(hash) === -1) {
            ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
        }
    }
    for (const hash of this.$chashes) {
        if (oldHashes.indexOf(hash) === -1) {
            if (!(hash in ct.place.grid)) {
                ct.place.grid[hash] = [this];
            } else {
                ct.place.grid[hash].push(this);
            }
        }
    }
}

    };
    ct.templates.onDestroy = function onDestroy() {
        if (this.$chashes) {
    for (const hash of this.$chashes) {
        ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
    }
}

    };
})(ct);
/**
 * @extends {PIXI.TilingSprite}
 * @property {number} shiftX How much to shift the texture horizontally, in pixels.
 * @property {number} shiftY How much to shift the texture vertically, in pixels.
 * @property {number} movementX The speed at which the background's texture moves by X axis,
 * wrapping around its area. The value is measured in pixels per frame, and takes
 * `ct.delta` into account.
 * @property {number} movementY The speed at which the background's texture moves by Y axis,
 * wrapping around its area. The value is measured in pixels per frame, and takes
 * `ct.delta` into account.
 * @property {number} parallaxX A value that makes background move faster
 * or slower relative to other objects. It is often used to create an effect of depth.
 * `1` means regular movement, values smaller than 1
 * will make it move slower and make an effect that a background is placed farther away from camera;
 * values larger than 1 will do the opposite, making the background appear closer than the rest
 * of object.
 * This property is for horizontal movement.
 * @property {number} parallaxY A value that makes background move faster
 * or slower relative to other objects. It is often used to create an effect of depth.
 * `1` means regular movement, values smaller than 1
 * will make it move slower and make an effect that a background is placed farther away from camera;
 * values larger than 1 will do the opposite, making the background appear closer than the rest
 * of object.
 * This property is for vertical movement.
 * @class
 */
class Background extends PIXI.TilingSprite {
    constructor(texName, frame = 0, depth = 0, exts = {}) {
        var width = ct.camera.width,
            height = ct.camera.height;
        const texture = texName instanceof PIXI.Texture ?
            texName :
            ct.res.getTexture(texName, frame || 0);
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-x') {
            height = texture.height * (exts.scaleY || 1);
        }
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-y') {
            width = texture.width * (exts.scaleX || 1);
        }
        super(texture, width, height);
        if (!ct.backgrounds.list[texName]) {
            ct.backgrounds.list[texName] = [];
        }
        ct.backgrounds.list[texName].push(this);
        ct.templates.list.BACKGROUND.push(this);
        ct.stack.push(this);
        this.anchor.x = this.anchor.y = 0;
        this.depth = depth;
        this.shiftX = this.shiftY = this.movementX = this.movementY = 0;
        this.parallaxX = this.parallaxY = 1;
        if (exts) {
            ct.u.extend(this, exts);
        }
        if (this.scaleX) {
            this.tileScale.x = Number(this.scaleX);
        }
        if (this.scaleY) {
            this.tileScale.y = Number(this.scaleY);
        }
        this.reposition();
    }
    onStep() {
        this.shiftX += ct.delta * this.movementX;
        this.shiftY += ct.delta * this.movementY;
    }
    /**
     * Updates the position of this background.
     */
    reposition() {
        const cameraBounds = this.isUi ?
            {
                x: 0, y: 0, width: ct.camera.width, height: ct.camera.height
            } :
            ct.camera.getBoundingBox();
        if (this.repeat !== 'repeat-x' && this.repeat !== 'no-repeat') {
            this.y = cameraBounds.y;
            this.tilePosition.y = -this.y * this.parallaxY + this.shiftY;
            this.height = cameraBounds.height + 1;
        } else {
            this.y = this.shiftY + cameraBounds.y * (this.parallaxY - 1);
        }
        if (this.repeat !== 'repeat-y' && this.repeat !== 'no-repeat') {
            this.x = cameraBounds.x;
            this.tilePosition.x = -this.x * this.parallaxX + this.shiftX;
            this.width = cameraBounds.width + 1;
        } else {
            this.x = this.shiftX + cameraBounds.x * (this.parallaxX - 1);
        }
    }
    onDraw() {
        this.reposition();
    }
    static onCreate() {
        void 0;
    }
    static onDestroy() {
        void 0;
    }
    get isUi() {
        return this.parent ? Boolean(this.parent.isUi) : false;
    }
}
/**
 * @namespace
 */
ct.backgrounds = {
    Background,
    list: {},
    /**
     * @returns {Background} The created background
     */
    add(texName, frame = 0, depth = 0, container = ct.room) {
        if (!texName) {
            throw new Error('[ct.backgrounds] The texName argument is required.');
        }
        const bg = new Background(texName, frame, depth);
        container.addChild(bg);
        return bg;
    }
};
ct.templates.Background = Background;

/**
 * @extends {PIXI.Container}
 * @class
 */
class Tilemap extends PIXI.Container {
    /**
     * @param {object} template A template object that contains data about depth
     * and tile placement. It is usually used by ct.IDE.
     */
    constructor(template) {
        super();
        this.pixiTiles = [];
        if (template) {
            this.depth = template.depth;
            this.tiles = template.tiles.map(tile => ({
                ...tile
            }));
            if (template.extends) {
                Object.assign(this, template.extends);
            }
            for (let i = 0, l = template.tiles.length; i < l; i++) {
                const textures = ct.res.getTexture(template.tiles[i].texture);
                const sprite = new PIXI.Sprite(textures[template.tiles[i].frame]);
                sprite.anchor.x = sprite.anchor.y = 0;
                sprite.shape = textures.shape;
                this.addChild(sprite);
                this.pixiTiles.push(sprite);
                this.tiles[i].sprite = sprite;
                sprite.x = template.tiles[i].x;
                sprite.y = template.tiles[i].y;
            }
        } else {
            this.tiles = [];
        }
        ct.templates.list.TILEMAP.push(this);
    }
    /**
     * Adds a tile to the tilemap. Will throw an error if a tilemap is cached.
     * @param {string} textureName The name of the texture to use
     * @param {number} x The horizontal location of the tile
     * @param {number} y The vertical location of the tile
     * @param {number} [frame] The frame to pick from the source texture. Defaults to 0.
     * @returns {PIXI.Sprite} The created tile
     */
    addTile(textureName, x, y, frame = 0) {
        if (this.cached) {
            throw new Error('[ct.tiles] Adding tiles to cached tilemaps is forbidden. Create a new tilemap, or add tiles before caching the tilemap.');
        }
        const texture = ct.res.getTexture(textureName, frame);
        const sprite = new PIXI.Sprite(texture);
        sprite.x = x;
        sprite.y = y;
        sprite.shape = texture.shape;
        this.tiles.push({
            texture: textureName,
            frame,
            x,
            y,
            width: sprite.width,
            height: sprite.height,
            sprite
        });
        this.addChild(sprite);
        this.pixiTiles.push(sprite);
        return sprite;
    }
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     */
    cache(chunkSize = 1024) {
        if (this.cached) {
            throw new Error('[ct.tiles] Attempt to cache an already cached tilemap.');
        }

        // Divide tiles into a grid of larger cells so that we can cache these cells as
        const bounds = this.getLocalBounds();
        const cols = Math.ceil(bounds.width / chunkSize),
              rows = Math.ceil(bounds.height / chunkSize);
        this.cells = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = new PIXI.Container();
                this.cells.push(cell);
            }
        }
        for (let i = 0, l = this.tiles.length; i < l; i++) {
            const tile = this.children[0],
                  x = Math.floor((tile.x - bounds.x) / chunkSize),
                  y = Math.floor((tile.y - bounds.y) / chunkSize);
            this.cells[y * cols + x].addChild(tile);
        }
        this.removeChildren();

        // Filter out empty cells, cache filled ones
        for (let i = 0, l = this.cells.length; i < l; i++) {
            if (this.cells[i].children.length === 0) {
                this.cells.splice(i, 1);
                i--;
                l--;
                continue;
            }
            this.addChild(this.cells[i]);
            this.cells[i].cacheAsBitmap = true;
        }

        this.cached = true;
    }
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This version packs tiles into rhombus-shaped chunks, and sorts them
     * from top to bottom. This fixes seam issues for isometric games.
     */
    cacheDiamond(chunkSize = 1024) {
        if (this.cached) {
            throw new Error('[ct.tiles] Attempt to cache an already cached tilemap.');
        }

        this.cells = [];
        this.diamondCellMap = {};
        for (let i = 0, l = this.tiles.length; i < l; i++) {
            const tile = this.children[0];
            const [xNormalized, yNormalized] = ct.u.rotate(tile.x, tile.y * 2, -45);
            const x = Math.floor(xNormalized / chunkSize),
                  y = Math.floor(yNormalized / chunkSize),
                  key = `${x}:${y}`;
            if (!(key in this.diamondCellMap)) {
                const chunk = new PIXI.Container();
                chunk.chunkX = x;
                chunk.chunkY = y;
                this.diamondCellMap[key] = chunk;
                this.cells.push(chunk);
            }
            this.diamondCellMap[key].addChild(tile);
        }
        this.removeChildren();

        this.cells.sort((a, b) => {
            const maxA = Math.max(a.chunkY, a.chunkX),
                  maxB = Math.max(b.chunkY, b.chunkX);
            if (maxA === maxB) {
                return b.chunkX - a.chunkX;
            }
            return maxA - maxB;
        });

        for (let i = 0, l = this.cells.length; i < l; i++) {
            this.addChild(this.cells[i]);
            this.cells[i].cacheAsBitmap = true;
        }

        this.cached = true;
    }
}
ct.templates.Tilemap = Tilemap;

/**
 * @namespace
 */
ct.tilemaps = {
    /**
     * Creates a new tilemap at a specified depth, and adds it to the main room (ct.room).
     * @param {number} [depth] The depth of a newly created tilemap. Defaults to 0.
     * @returns {Tilemap} The created tilemap.
     */
    create(depth = 0) {
        const tilemap = new Tilemap();
        tilemap.depth = depth;
        ct.room.addChild(tilemap);
        return tilemap;
    },
    /**
     * Adds a tile to the specified tilemap. It is the same as
     * calling `tilemap.addTile(textureName, x, y, frame).
     * @param {Tilemap} tilemap The tilemap to modify.
     * @param {string} textureName The name of the texture to use.
     * @param {number} x The horizontal location of the tile.
     * @param {number} y The vertical location of the tile.
     * @param {number} [frame] The frame to pick from the source texture. Defaults to 0.
     * @returns {PIXI.Sprite} The created tile
     */
    addTile(tilemap, textureName, x, y, frame = 0) {
        return tilemap.addTile(textureName, x, y, frame);
    },
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This is the same as calling `tilemap.cache();`
     *
     * @param {Tilemap} tilemap The tilemap which needs to be cached.
     * @param {number} chunkSize The size of one chunk.
     */
    cache(tilemap, chunkSize) {
        tilemap.cache(chunkSize);
    },
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This version packs tiles into rhombus-shaped chunks, and sorts them
     * from top to bottom. This fixes seam issues for isometric games.
     * Note that tiles should be placed on a flat plane for the proper sorting.
     * If you need an effect of elevation, consider shifting each tile with
     * tile.pivot.y property.
     *
     * This is the same as calling `tilemap.cacheDiamond();`
     *
     * @param {Tilemap} tilemap The tilemap which needs to be cached.
     * @param {number} chunkSize The size of one chunk.
     */
    cacheDiamond(tilemap, chunkSize) {
        tilemap.cacheDiamond(chunkSize);
    }
};

/**
 * This class represents a camera that is used by ct.js' cameras.
 * Usually you won't create new instances of it, but if you need, you can substitute
 * ct.camera with a new one.
 *
 * @extends {PIXI.DisplayObject}
 * @class
 *
 * @property {number} x The real x-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetX`
 * if the camera is in transition.
 * @property {number} y The real y-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetY`
 * if the camera is in transition.
 * @property {number} width The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.x to get a scaled version.
 * To change this value, see `ct.width` property.
 * @property {number} height The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.y to get a scaled version.
 * To change this value, see `ct.height` property.
 * @property {number} targetX The x-coordinate of the target location.
 * Moving it instead of just using the `x` parameter will trigger the drift effect.
 * @property {number} targetY The y-coordinate of the target location.
 * Moving it instead of just using the `y` parameter will trigger the drift effect.
 *
 * @property {Copy|false} follow If set, the camera will follow the given copy.
 * @property {boolean} followX Works if `follow` is set to a copy.
 * Enables following in X axis. Set it to `false` and followY to `true`
 * to limit automatic camera movement to vertical axis.
 * @property {boolean} followY Works if `follow` is set to a copy.
 * Enables following in Y axis. Set it to `false` and followX to `true`
 * to limit automatic camera movement to horizontal axis.
 * @property {number|null} borderX Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number|null} borderY Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number} shiftX Displaces the camera horizontally
 * but does not change x and y parameters.
 * @property {number} shiftY Displaces the camera vertically
 * but does not change x and y parameters.
 * @property {number} drift Works if `follow` is set to a copy.
 * If set to a value between 0 and 1, it will make camera movement smoother
 *
 * @property {number} shake The current power of a screen shake effect,
 * relative to the screen's max side (100 is 100% of screen shake).
 * If set to 0 or less, it, disables the effect.
 * @property {number} shakePhase The current phase of screen shake oscillation.
 * @property {number} shakeDecay The amount of `shake` units substracted in a second.
 * Default is 5.
 * @property {number} shakeFrequency The base frequency of the screen shake effect.
 * Default is 50.
 * @property {number} shakeX A multiplier applied to the horizontal screen shake effect.
 * Default is 1.
 * @property {number} shakeY A multiplier applied to the vertical screen shake effect.
 * Default is 1.
 * @property {number} shakeMax The maximum possible value for the `shake` property
 * to protect players from losing their monitor, in `shake` units. Default is 10.
 */
const Camera = (function Camera() {
    const shakeCamera = function shakeCamera(camera, delta) {
        const sec = delta / (PIXI.Ticker.shared.maxFPS || 60);
        camera.shake -= sec * camera.shakeDecay;
        camera.shake = Math.max(0, camera.shake);
        if (camera.shakeMax) {
            camera.shake = Math.min(camera.shake, camera.shakeMax);
        }
        const phaseDelta = sec * camera.shakeFrequency;
        camera.shakePhase += phaseDelta;
        // no logic in these constants
        // They are used to desync fluctuations and remove repetitive circular movements
        camera.shakePhaseX += phaseDelta * (1 + Math.sin(camera.shakePhase * 0.1489) * 0.25);
        camera.shakePhaseY += phaseDelta * (1 + Math.sin(camera.shakePhase * 0.1734) * 0.25);
    };
    const followCamera = function followCamera(camera) {
        // eslint-disable-next-line max-len
        const bx = camera.borderX === null ? camera.width / 2 : Math.min(camera.borderX, camera.width / 2),
              // eslint-disable-next-line max-len
              by = camera.borderY === null ? camera.height / 2 : Math.min(camera.borderY, camera.height / 2);
        const tl = camera.uiToGameCoord(bx, by),
              br = camera.uiToGameCoord(camera.width - bx, camera.height - by);

        if (camera.followX) {
            if (camera.follow.x < tl.x - camera.interpolatedShiftX) {
                camera.targetX = camera.follow.x - bx + camera.width / 2;
            } else if (camera.follow.x > br.x - camera.interpolatedShiftX) {
                camera.targetX = camera.follow.x + bx - camera.width / 2;
            }
        }
        if (camera.followY) {
            if (camera.follow.y < tl.y - camera.interpolatedShiftY) {
                camera.targetY = camera.follow.y - by + camera.height / 2;
            } else if (camera.follow.y > br.y - camera.interpolatedShiftY) {
                camera.targetY = camera.follow.y + by - camera.height / 2;
            }
        }
    };
    const restrictInRect = function restrictInRect(camera) {
        if (camera.minX !== void 0) {
            const boundary = camera.minX + camera.width * camera.scale.x * 0.5;
            camera.x = Math.max(boundary, camera.x);
            camera.targetX = Math.max(boundary, camera.targetX);
        }
        if (camera.maxX !== void 0) {
            const boundary = camera.maxX - camera.width * camera.scale.x * 0.5;
            camera.x = Math.min(boundary, camera.x);
            camera.targetX = Math.min(boundary, camera.targetX);
        }
        if (camera.minY !== void 0) {
            const boundary = camera.minY + camera.height * camera.scale.y * 0.5;
            camera.y = Math.max(boundary, camera.y);
            camera.targetY = Math.max(boundary, camera.targetY);
        }
        if (camera.maxY !== void 0) {
            const boundary = camera.maxY - camera.height * camera.scale.y * 0.5;
            camera.y = Math.min(boundary, camera.y);
            camera.targetY = Math.min(boundary, camera.targetY);
        }
    };
    class Camera extends PIXI.DisplayObject {
        constructor(x, y, w, h) {
            super();
            this.follow = this.rotate = false;
            this.followX = this.followY = true;
            this.targetX = this.x = x;
            this.targetY = this.y = y;
            this.z = 500;
            this.width = w || 1920;
            this.height = h || 1080;
            this.shiftX = this.shiftY = this.interpolatedShiftX = this.interpolatedShiftY = 0;
            this.borderX = this.borderY = null;
            this.drift = 0;

            this.shake = 0;
            this.shakeDecay = 5;
            this.shakeX = this.shakeY = 1;
            this.shakeFrequency = 50;
            this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
            this.shakeMax = 10;

            this.getBounds = this.getBoundingBox;
        }

        get scale() {
            return this.transform.scale;
        }
        set scale(value) {
            if (typeof value === 'number') {
                value = {
                    x: value,
                    y: value
                };
            }
            this.transform.scale.copyFrom(value);
        }

        /**
         * Moves the camera to a new position. It will have a smooth transition
         * if a `drift` parameter is set.
         * @param {number} x New x coordinate
         * @param {number} y New y coordinate
         * @returns {void}
         */
        moveTo(x, y) {
            this.targetX = x;
            this.targetY = y;
        }

        /**
         * Moves the camera to a new position. Ignores the `drift` value.
         * @param {number} x New x coordinate
         * @param {number} y New y coordinate
         * @returns {void}
         */
        teleportTo(x, y) {
            this.targetX = this.x = x;
            this.targetY = this.y = y;
            this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
            this.interpolatedShiftX = this.shiftX;
            this.interpolatedShiftY = this.shiftY;
        }

        /**
         * Updates the position of the camera
         * @param {number} delta A delta value between the last two frames.
         * This is usually ct.delta.
         * @returns {void}
         */
        update(delta) {
            shakeCamera(this, delta);
            // Check if we've been following a copy that is now killed
            if (this.follow && this.follow.kill) {
                this.follow = false;
            }
            // Follow copies around
            if (this.follow && ('x' in this.follow) && ('y' in this.follow)) {
                followCamera(this);
            }

            // The speed of drift movement
            const speed = this.drift ? Math.min(1, (1 - this.drift) * delta) : 1;
            // Perform drift motion
            this.x = this.targetX * speed + this.x * (1 - speed);
            this.y = this.targetY * speed + this.y * (1 - speed);

            // Off-center shifts drift, too
            this.interpolatedShiftX = this.shiftX * speed + this.interpolatedShiftX * (1 - speed);
            this.interpolatedShiftY = this.shiftY * speed + this.interpolatedShiftY * (1 - speed);

            restrictInRect(this);

            // Recover from possible calculation errors
            this.x = this.x || 0;
            this.y = this.y || 0;
        }

        /**
         * Returns the current camera position plus the screen shake effect.
         * @type {number}
         */
        get computedX() {
            // eslint-disable-next-line max-len
            const dx = (Math.sin(this.shakePhaseX) + Math.sin(this.shakePhaseX * 3.1846) * 0.25) / 1.25;
            // eslint-disable-next-line max-len
            const x = this.x + dx * this.shake * Math.max(this.width, this.height) / 100 * this.shakeX;
            return x + this.interpolatedShiftX;
        }
        /**
         * Returns the current camera position plus the screen shake effect.
         * @type {number}
         */
        get computedY() {
            // eslint-disable-next-line max-len
            const dy = (Math.sin(this.shakePhaseY) + Math.sin(this.shakePhaseY * 2.8948) * 0.25) / 1.25;
            // eslint-disable-next-line max-len
            const y = this.y + dy * this.shake * Math.max(this.width, this.height) / 100 * this.shakeY;
            return y + this.interpolatedShiftY;
        }

        /**
         * Returns the position of the left edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopLeftCorner`
         * and `getBottomLeftCorner` methods.
         * @returns {number} The location of the left edge.
         * @type {number}
         * @readonly
         */
        get left() {
            return this.computedX - (this.width / 2) * this.scale.x;
        }
        /**
         * Returns the position of the top edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopLeftCorner`
         * and `getTopRightCorner` methods.
         * @returns {number} The location of the top edge.
         * @type {number}
         * @readonly
         */
        get top() {
            return this.computedY - (this.height / 2) * this.scale.y;
        }
        /**
         * Returns the position of the right edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopRightCorner`
         * and `getBottomRightCorner` methods.
         * @returns {number} The location of the right edge.
         * @type {number}
         * @readonly
         */
        get right() {
            return this.computedX + (this.width / 2) * this.scale.x;
        }
        /**
         * Returns the position of the bottom edge where the visible rectangle ends,
         * in game coordinates. This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getBottomLeftCorner`
         * and `getBottomRightCorner` methods.
         * @returns {number} The location of the bottom edge.
         * @type {number}
         * @readonly
         */
        get bottom() {
            return this.computedY + (this.height / 2) * this.scale.y;
        }

        /**
         * Translates a point from UI space to game space.
         * @param {number} x The x coordinate in UI space.
         * @param {number} y The y coordinate in UI space.
         * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
         */
        uiToGameCoord(x, y) {
            const modx = (x - this.width / 2) * this.scale.x,
                  mody = (y - this.height / 2) * this.scale.y;
            const result = ct.u.rotate(modx, mody, this.angle);
            return new PIXI.Point(
                result.x + this.computedX,
                result.y + this.computedY
            );
        }

        /**
         * Translates a point from game space to UI space.
         * @param {number} x The x coordinate in game space.
         * @param {number} y The y coordinate in game space.
         * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
         */
        gameToUiCoord(x, y) {
            const relx = x - this.computedX,
                  rely = y - this.computedY;
            const unrotated = ct.u.rotate(relx, rely, -this.angle);
            return new PIXI.Point(
                unrotated.x / this.scale.x + this.width / 2,
                unrotated.y / this.scale.y + this.height / 2
            );
        }
        /**
         * Gets the position of the top-left corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getTopLeftCorner() {
            return this.uiToGameCoord(0, 0);
        }

        /**
         * Gets the position of the top-right corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getTopRightCorner() {
            return this.uiToGameCoord(this.width, 0);
        }

        /**
         * Gets the position of the bottom-left corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getBottomLeftCorner() {
            return this.uiToGameCoord(0, this.height);
        }

        /**
         * Gets the position of the bottom-right corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getBottomRightCorner() {
            return this.uiToGameCoord(this.width, this.height);
        }

        /**
         * Returns the bounding box of the camera.
         * Useful for rotated viewports when something needs to be reliably covered by a rectangle.
         * @returns {PIXI.Rectangle} The bounding box of the camera.
         */
        getBoundingBox() {
            const bb = new PIXI.Bounds();
            const tl = this.getTopLeftCorner(),
                  tr = this.getTopRightCorner(),
                  bl = this.getBottomLeftCorner(),
                  br = this.getBottomRightCorner();
            bb.addPoint(new PIXI.Point(tl.x, tl.y));
            bb.addPoint(new PIXI.Point(tr.x, tr.y));
            bb.addPoint(new PIXI.Point(bl.x, bl.y));
            bb.addPoint(new PIXI.Point(br.x, br.y));
            return bb.getRectangle();
        }

        /**
         * Checks whether a given object (or any Pixi's DisplayObject)
         * is potentially visible, meaning that its bounding box intersects
         * the camera's bounding box.
         * @param {PIXI.DisplayObject} copy An object to check for.
         * @returns {boolean} `true` if an object is visible, `false` otherwise.
         */
        contains(copy) {
            // `true` skips transforms recalculations, boosting performance
            const bounds = copy.getBounds(true);
            return bounds.right > 0 &&
                bounds.left < this.width * this.scale.x &&
                bounds.bottom > 0 &&
                bounds.top < this.width * this.scale.y;
        }

        /**
         * Realigns all the copies in a room so that they distribute proportionally
         * to a new camera size based on their `xstart` and `ystart` coordinates.
         * Will throw an error if the given room is not in UI space (if `room.isUi` is not `true`).
         * You can skip the realignment for some copies
         * if you set their `skipRealign` parameter to `true`.
         * @param {Room} room The room which copies will be realigned.
         * @returns {void}
         */
        realign(room) {
            if (!room.isUi) {
                throw new Error('[ct.camera] An attempt to realing a room that is not in UI space. The room in question is', room);
            }
            const w = (ct.rooms.templates[room.name].width || 1),
                  h = (ct.rooms.templates[room.name].height || 1);
            for (const copy of room.children) {
                if (!('xstart' in copy) || copy.skipRealign) {
                    continue;
                }
                copy.x = copy.xstart / w * this.width;
                copy.y = copy.ystart / h * this.height;
            }
        }
        /**
         * This will align all non-UI layers in the game according to the camera's transforms.
         * This is automatically called internally, and you will hardly ever use it.
         * @returns {void}
         */
        manageStage() {
            const px = this.computedX,
                  py = this.computedY,
                  sx = 1 / (isNaN(this.scale.x) ? 1 : this.scale.x),
                  sy = 1 / (isNaN(this.scale.y) ? 1 : this.scale.y);
            for (const item of ct.stage.children) {
                if (!item.isUi && item.pivot) {
                    item.x = -this.width / 2;
                    item.y = -this.height / 2;
                    item.pivot.x = px;
                    item.pivot.y = py;
                    item.scale.x = sx;
                    item.scale.y = sy;
                    item.angle = -this.angle;
                }
            }
        }
    }
    return Camera;
})(ct);
void Camera;

(function timerAddon() {
    const ctTimerTime = Symbol('time');
    const ctTimerRoomUid = Symbol('roomUid');
    const ctTimerTimeLeftOriginal = Symbol('timeLeftOriginal');
    const promiseResolve = Symbol('promiseResolve');
    const promiseReject = Symbol('promiseReject');

    /**
     * @property {boolean} isUi Whether the timer uses ct.deltaUi or not.
     * @property {string|false} name The name of the timer
     */
    class CtTimer {
        /**
         * An object for holding a timer
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer
         * @param {boolean} [uiDelta=false] If `true`, it will use `ct.deltaUi` for counting time.
         * if `false`, it will use `ct.delta` for counting time.
         */
        constructor(timeMs, name = false, uiDelta = false) {
            this[ctTimerRoomUid] = ct.room.uid || null;
            this.name = name && name.toString();
            this.isUi = uiDelta;
            this[ctTimerTime] = 0;
            this[ctTimerTimeLeftOriginal] = timeMs;
            this.timeLeft = this[ctTimerTimeLeftOriginal];
            this.promise = new Promise((resolve, reject) => {
                this[promiseResolve] = resolve;
                this[promiseReject] = reject;
            });
            this.rejected = false;
            this.done = false;
            this.settled = false;
            ct.timer.timers.add(this);
        }

        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         *
         * @param {Function} onfulfilled The callback to execute when the Promise is resolved.
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        then(...args) {
            return this.promise.then(...args);
        }
        /**
         * Attaches a callback for the rejection of the Promise.
         *
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        catch(onrejected) {
            return this.promise.catch(onrejected);
        }

        /**
         * The time passed on this timer, in seconds
         * @type {number}
         */
        get time() {
            return this[ctTimerTime] * 1000 / ct.speed;
        }
        set time(newTime) {
            this[ctTimerTime] = newTime / 1000 * ct.speed;
        }

        /**
         * Updates the timer. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        update() {
            // Not something that would normally happen,
            // but do check whether this timer was not automatically removed
            if (this.rejected === true || this.done === true) {
                this.remove();
                return;
            }
            this[ctTimerTime] += this.isUi ? ct.deltaUi : ct.delta;
            if (ct.room.uid !== this[ctTimerRoomUid] && this[ctTimerRoomUid] !== null) {
                this.reject({
                    info: 'Room switch',
                    from: 'ct.timer'
                }); // Reject if the room was switched
            }

            // If the timer is supposed to end
            if (this.timeLeft !== 0) {
                this.timeLeft = this[ctTimerTimeLeftOriginal] - this.time;
                if (this.timeLeft <= 0) {
                    this.resolve();
                }
            }
        }

        /**
         * Instantly triggers the timer and calls the callbacks added through `then` method.
         * @returns {void}
         */
        resolve() {
            if (this.settled) {
                return;
            }
            this.done = true;
            this.settled = true;
            this[promiseResolve]();
            this.remove();
        }
        /**
         * Stops the timer with a given message by rejecting a Promise object.
         * @param {any} message The value to pass to the `catch` callback
         * @returns {void}
         */
        reject(message) {
            if (this.settled) {
                return;
            }
            this.rejected = true;
            this.settled = true;
            this[promiseReject](message);
            this.remove();
        }
        /**
         * Removes the timer from ct.js game loop. This timer will not trigger.
         * @returns {void}
         */
        remove() {
            ct.timer.timers.delete(this);
        }
    }
    window.CtTimer = CtTimer;

    /**
     * Timer utilities
     * @namespace
     */
    ct.timer = {
        /**
         * A set with all the active timers.
         * @type Set<CtTimer>
         */
        timers: new Set(),
        counter: 0,
        /**
         * Adds a new timer with a given name
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        add(timeMs, name = false) {
            return new CtTimer(timeMs, name, false);
        },
        /**
         * Adds a new timer with a given name that runs in a UI time scale
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        addUi(timeMs, name = false) {
            return new CtTimer(timeMs, name, true);
        },
        /**
         * Updates the timers. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        updateTimers() {
            for (const timer of this.timers) {
                timer.update();
            }
        }
    };
})();
if (document.fonts) { for (const font of document.fonts) { font.load(); }}/**
 * @typedef ICtPlaceRectangle
 * @property {number} [x1] The left side of the rectangle.
 * @property {number} [y1] The upper side of the rectangle.
 * @property {number} [x2] The right side of the rectangle.
 * @property {number} [y2] The bottom side of the rectangle.
 * @property {number} [x] The left side of the rectangle.
 * @property {number} [y] The upper side of the rectangle.
 * @property {number} [width] The right side of the rectangle.
 * @property {number} [height] The bottom side of the rectangle.
 */
/**
 * @typedef ICtPlaceLineSegment
 * @property {number} x1 The horizontal coordinate of the starting point of the ray.
 * @property {number} y1 The vertical coordinate of the starting point of the ray.
 * @property {number} x2 The horizontal coordinate of the ending point of the ray.
 * @property {number} y2 The vertical coordinate of the ending point of the ray.
 */
/**
 * @typedef ICtPlaceCircle
 * @property {number} x The horizontal coordinate of the circle's center.
 * @property {number} y The vertical coordinate of the circle's center.
 * @property {number} radius The radius of the circle.
 */
/* eslint-disable no-underscore-dangle */
/* global SSCD */
/* eslint prefer-destructuring: 0 */
(function ctPlace(ct) {
    const circlePrecision = 16,
          twoPi = Math.PI * 0;
    const debugMode = [false][0];

    const getSSCDShapeFromRect = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        if (obj.angle === 0) {
            position.x -= obj.scale.x > 0 ?
                (shape.left * obj.scale.x) :
                (-obj.scale.x * shape.right);
            position.y -= obj.scale.y > 0 ?
                (shape.top * obj.scale.y) :
                (-shape.bottom * obj.scale.y);
            return new SSCD.Rectangle(
                position,
                new SSCD.Vector(
                    Math.abs((shape.left + shape.right) * obj.scale.x),
                    Math.abs((shape.bottom + shape.top) * obj.scale.y)
                )
            );
        }
        const upperLeft = ct.u.rotate(
            -shape.left * obj.scale.x,
            -shape.top * obj.scale.y, obj.angle
        );
        const bottomLeft = ct.u.rotate(
            -shape.left * obj.scale.x,
            shape.bottom * obj.scale.y, obj.angle
        );
        const bottomRight = ct.u.rotate(
            shape.right * obj.scale.x,
            shape.bottom * obj.scale.y, obj.angle
        );
        const upperRight = ct.u.rotate(
            shape.right * obj.scale.x,
            -shape.top * obj.scale.y, obj.angle
        );
        return new SSCD.LineStrip(position, [
            new SSCD.Vector(upperLeft.x, upperLeft.y),
            new SSCD.Vector(bottomLeft.x, bottomLeft.y),
            new SSCD.Vector(bottomRight.x, bottomRight.y),
            new SSCD.Vector(upperRight.x, upperRight.y)
        ], true);
    };

    const getSSCDShapeFromCircle = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        if (Math.abs(obj.scale.x) === Math.abs(obj.scale.y)) {
            return new SSCD.Circle(position, shape.r * Math.abs(obj.scale.x));
        }
        const vertices = [];
        for (let i = 0; i < circlePrecision; i++) {
            const point = [
                Math.sin(twoPi / circlePrecision * i) * shape.r * obj.scale.x,
                Math.cos(twoPi / circlePrecision * i) * shape.r * obj.scale.y
            ];
            if (obj.angle !== 0) {
                const {x, y} = ct.u.rotate(point[0], point[1], obj.angle);
                vertices.push(x, y);
            } else {
                vertices.push(point);
            }
        }
        return new SSCD.LineStrip(position, vertices, true);
    };

    const getSSCDShapeFromStrip = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        const vertices = [];
        if (obj.angle !== 0) {
            for (const point of shape.points) {
                const {x, y} = ct.u.rotate(
                    point.x * obj.scale.x,
                    point.y * obj.scale.y, obj.angle
                );
                vertices.push(new SSCD.Vector(x, y));
            }
        } else {
            for (const point of shape.points) {
                vertices.push(new SSCD.Vector(point.x * obj.scale.x, point.y * obj.scale.y));
            }
        }
        return new SSCD.LineStrip(position, vertices, Boolean(shape.closedStrip));
    };

    const getSSCDShapeFromLine = function (obj) {
        const {shape} = obj;
        if (obj.angle !== 0) {
            const {x: x1, y: y1} = ct.u.rotate(
                shape.x1 * obj.scale.x,
                shape.y1 * obj.scale.y,
                obj.angle
            );
            const {x: x2, y: y2} = ct.u.rotate(
                shape.x2 * obj.scale.x,
                shape.y2 * obj.scale.y,
                obj.angle
            );
            return new SSCD.Line(
                new SSCD.Vector(
                    obj.x + x1,
                    obj.y + y1
                ),
                new SSCD.Vector(
                    x2 - x1,
                    y2 - y1
                )
            );
        }
        return new SSCD.Line(
            new SSCD.Vector(
                obj.x + shape.x1 * obj.scale.x,
                obj.y + shape.y1 * obj.scale.y
            ),
            new SSCD.Vector(
                (shape.x2 - shape.x1) * obj.scale.x,
                (shape.y2 - shape.y1) * obj.scale.y
            )
        );
    };

    /**
     * Gets SSCD shapes from object's shape field and its transforms.
     */
    var getSSCDShape = function (obj) {
        switch (obj.shape.type) {
        case 'rect':
            return getSSCDShapeFromRect(obj);
        case 'circle':
            return getSSCDShapeFromCircle(obj);
        case 'strip':
            return getSSCDShapeFromStrip(obj);
        case 'line':
            return getSSCDShapeFromLine(obj);
        default:
            return new SSCD.Circle(new SSCD.Vector(obj.x, obj.y), 0);
        }
    };

    // Premade filter predicates to avoid function creation and memory bloat during the game loop.
    const templateNameFilter = (target, other, template) => other.template === template;
    const cgroupFilter = (target, other, cgroup) => !cgroup || cgroup === other.cgroup;

    // Core collision-checking method that accepts various filtering predicates
    // and a variable partitioning grid.

    // eslint-disable-next-line max-params
    const genericCollisionQuery = function (
        target,
        customX,
        customY,
        partitioningGrid,
        queryAll,
        filterPredicate,
        filterVariable
    ) {
        const oldx = target.x,
              oldy = target.y;
        const shapeCashed = target._shape;
        let hashes, results;
        // Apply arbitrary location to the checked object
        if (customX !== void 0 && (oldx !== customX || oldy !== customY)) {
            target.x = customX;
            target.y = customY;
            target._shape = getSSCDShape(target);
            hashes = ct.place.getHashes(target);
        } else {
            hashes = target.$chashes || ct.place.getHashes(target);
            target._shape = target._shape || getSSCDShape(target);
        }
        if (queryAll) {
            results = [];
        }
        // Get all the known objects in close proximity to the tested object,
        // sourcing from the passed partitioning grid.
        for (const hash of hashes) {
            const array = partitioningGrid[hash];
            // Such partition cell is absent
            if (!array) {
                continue;
            }
            for (const obj of array) {
                // Skip checks against the tested object itself.
                if (obj === target) {
                    continue;
                }
                // Filter out objects
                if (!filterPredicate(target, obj, filterVariable)) {
                    continue;
                }
                // Check for collision between two objects
                if (ct.place.collide(target, obj)) {
                    // Singular pick; return the collided object immediately.
                    if (!queryAll) {
                        // Return the object back to its old position.
                        // Skip SSCD shape re-calculation.
                        if (oldx !== target.x || oldy !== target.y) {
                            target.x = oldx;
                            target.y = oldy;
                            target._shape = shapeCashed;
                        }
                        return obj;
                    }
                    // Multiple pick; push the collided object into an array.
                    if (!results.includes(obj)) {
                        results.push(obj);
                    }
                }
            }
        }
        // Return the object back to its old position.
        // Skip SSCD shape re-calculation.
        if (oldx !== target.x || oldy !== target.y) {
            target.x = oldx;
            target.y = oldy;
            target._shape = shapeCashed;
        }
        if (!queryAll) {
            return false;
        }
        return results;
    };

    ct.place = {
        m: 1, // direction modifier in ct.place.go,
        gridX: [1024][0] || 512,
        gridY: [1024][0] || 512,
        grid: {},
        tileGrid: {},
        getHashes(copy) {
            var hashes = [];
            var x = Math.round(copy.x / ct.place.gridX),
                y = Math.round(copy.y / ct.place.gridY),
                dx = Math.sign(copy.x - ct.place.gridX * x),
                dy = Math.sign(copy.y - ct.place.gridY * y);
            hashes.push(`${x}:${y}`);
            if (dx) {
                hashes.push(`${x + dx}:${y}`);
                if (dy) {
                    hashes.push(`${x + dx}:${y + dy}`);
                }
            }
            if (dy) {
                hashes.push(`${x}:${y + dy}`);
            }
            return hashes;
        },
        /**
         * Applied to copies in the debug mode. Draws a collision shape
         * @this Copy
         * @param {boolean} [absolute] Whether to use room coordinates
         * instead of coordinates relative to the copy.
         * @returns {void}
         */
        drawDebugGraphic(absolute) {
            const shape = this._shape || getSSCDShape(this);
            const g = this.$cDebugCollision;
            let color = 0x00ffff;
            if (this instanceof Copy) {
                color = 0x0066ff;
            } else if (this instanceof PIXI.Sprite) {
                color = 0x6600ff;
            }
            if (this.$cHadCollision) {
                color = 0x00ff00;
            }
            g.lineStyle(2, color);
            if (shape instanceof SSCD.Rectangle) {
                const pos = shape.get_position(),
                      size = shape.get_size();
                g.beginFill(color, 0.1);
                if (!absolute) {
                    g.drawRect(pos.x - this.x, pos.y - this.y, size.x, size.y);
                } else {
                    g.drawRect(pos.x, pos.y, size.x, size.y);
                }
                g.endFill();
            } else if (shape instanceof SSCD.LineStrip) {
                if (!absolute) {
                    g.moveTo(shape.__points[0].x, shape.__points[0].y);
                    for (let i = 1; i < shape.__points.length; i++) {
                        g.lineTo(shape.__points[i].x, shape.__points[i].y);
                    }
                } else {
                    g.moveTo(shape.__points[0].x + this.x, shape.__points[0].y + this.y);
                    for (let i = 1; i < shape.__points.length; i++) {
                        g.lineTo(shape.__points[i].x + this.x, shape.__points[i].y + this.y);
                    }
                }
            } else if (shape instanceof SSCD.Circle && shape.get_radius() > 0) {
                g.beginFill(color, 0.1);
                if (!absolute) {
                    g.drawCircle(0, 0, shape.get_radius());
                } else {
                    g.drawCircle(this.x, this.y, shape.get_radius());
                }
                g.endFill();
            } else if (shape instanceof SSCD.Line) {
                if (!absolute) {
                    g.moveTo(
                        shape.__position.x,
                        shape.__position.y
                    ).lineTo(
                        shape.__position.x + shape.__dest.x,
                        shape.__position.y + shape.__dest.y
                    );
                } else {
                    const p1 = shape.get_p1();
                    const p2 = shape.get_p2();
                    g.moveTo(p1.x, p1.y)
                    .lineTo(p2.x, p2.y);
                }
            } else if (!absolute) { // Treat as a point
                g.moveTo(-16, -16)
                .lineTo(16, 16)
                .moveTo(-16, 16)
                .lineTo(16, -16);
            } else {
                g.moveTo(-16 + this.x, -16 + this.y)
                .lineTo(16 + this.x, 16 + this.y)
                .moveTo(-16 + this.x, 16 + this.y)
                .lineTo(16 + this.x, -16 + this.y);
            }
        },
        collide(c1, c2) {
            // ct.place.collide(<c1: Copy, c2: Copy>)
            // Test collision between two copies
            c1._shape = c1._shape || getSSCDShape(c1);
            c2._shape = c2._shape || getSSCDShape(c2);
            if (c1._shape.__type === 'strip' ||
                c2._shape.__type === 'strip' ||
                c1._shape.__type === 'complex' ||
                c2._shape.__type === 'complex'
            ) {
                const aabb1 = c1._shape.get_aabb(),
                      aabb2 = c2._shape.get_aabb();
                if (!aabb1.intersects(aabb2)) {
                    return false;
                }
            }
            if (SSCD.CollisionManager.test_collision(c1._shape, c2._shape)) {
                if ([false][0]) {
                    c1.$cHadCollision = true;
                    c2.$cHadCollision = true;
                }
                return true;
            }
            return false;
        },
        /**
         * Determines if the place in (x,y) is occupied by any copies or tiles.
         * Optionally can take 'cgroup' as a filter for obstacles'
         * collision group (not shape type).
         *
         * @param {Copy} me The object to check collisions on.
         * @param {number} [x] The x coordinate to check, as if `me` was placed there.
         * @param {number} [y] The y coordinate to check, as if `me` was placed there.
         * @param {String} [cgroup] The collision group to check against
         * @returns {Copy|Array<Copy>} The collided copy, or an array of all the detected collisions
         * (if `multiple` is `true`)
         */
        occupied(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            const copies = genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                cgroupFilter, cgroup
            );
            // Was any suitable copy found? Return it immediately and skip the query for tiles.
            if (copies) {
                return copies;
            }
            // Return query result for tiles.
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                false,
                cgroupFilter, cgroup
            );
        },
        occupiedMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            const copies = genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                cgroupFilter, cgroup
            );
            const tiles = genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                true,
                cgroupFilter, cgroup
            );
            return copies.concat(tiles);
        },
        free(me, x, y, cgroup) {
            return !ct.place.occupied(me, x, y, cgroup);
        },
        meet(target, x, y, templateName) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                templateName = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                templateNameFilter, templateName
            );
        },
        meetMultiple(target, x, y, templateName) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                templateName = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                templateNameFilter, templateName
            );
        },
        copies(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                cgroupFilter, cgroup
            );
        },
        copiesMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                cgroupFilter, cgroup
            );
        },
        tiles(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                false,
                cgroupFilter, cgroup
            );
        },
        tilesMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                true,
                cgroupFilter, cgroup
            );
        },
        lastdist: null,
        nearest(x, y, templateName) {
            // ct.place.nearest(x: number, y: number, templateName: string)
            const copies = ct.templates.list[templateName];
            if (copies.length > 0) {
                var dist = Math.hypot(x - copies[0].x, y - copies[0].y);
                var inst = copies[0];
                for (const copy of copies) {
                    if (Math.hypot(x - copy.x, y - copy.y) < dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        furthest(x, y, template) {
            // ct.place.furthest(<x: number, y: number, template: Template>)
            const templates = ct.templates.list[template];
            if (templates.length > 0) {
                var dist = Math.hypot(x - templates[0].x, y - templates[0].y);
                var inst = templates[0];
                for (const copy of templates) {
                    if (Math.hypot(x - copy.x, y - copy.y) > dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        enableTilemapCollisions(tilemap, exactCgroup) {
            const cgroup = exactCgroup || tilemap.cgroup;
            if (tilemap.addedCollisions) {
                throw new Error('[ct.place] The tilemap already has collisions enabled.');
            }
            tilemap.cgroup = cgroup;
            // Prebake hashes and SSCD shapes for all the tiles
            for (const pixiSprite of tilemap.pixiTiles) {
                // eslint-disable-next-line no-underscore-dangle
                pixiSprite._shape = getSSCDShape(pixiSprite);
                pixiSprite.cgroup = cgroup;
                pixiSprite.$chashes = ct.place.getHashes(pixiSprite);
                /* eslint max-depth: 0 */
                for (const hash of pixiSprite.$chashes) {
                    if (!(hash in ct.place.tileGrid)) {
                        ct.place.tileGrid[hash] = [pixiSprite];
                    } else {
                        ct.place.tileGrid[hash].push(pixiSprite);
                    }
                }
                pixiSprite.depth = tilemap.depth;
            }
            if (debugMode) {
                for (const pixiSprite of tilemap.pixiTiles) {
                    pixiSprite.$cDebugCollision = new PIXI.Graphics();
                    ct.place.drawDebugGraphic.apply(pixiSprite, [false]);
                    pixiSprite.addChild(pixiSprite.$cDebugCollision);
                }
            }
            tilemap.addedCollisions = true;
        },
        moveAlong(me, dir, length, cgroup, precision) {
            if (!length) {
                return false;
            }
            if (typeof cgroup === 'number') {
                precision = cgroup;
                cgroup = void 0;
            }
            precision = Math.abs(precision || 1);
            if (length < 0) {
                length *= -1;
                dir += 180;
            }
            var dx = Math.cos(dir * Math.PI / 180) * precision,
                dy = Math.sin(dir * Math.PI / 180) * precision;
            while (length > 0) {
                if (length < 1) {
                    dx *= length;
                    dy *= length;
                }
                const occupied = ct.place.occupied(me, me.x + dx, me.y + dy, cgroup);
                if (!occupied) {
                    me.x += dx;
                    me.y += dy;
                    delete me._shape;
                } else {
                    return occupied;
                }
                length--;
            }
            return false;
        },
        moveByAxes(me, dx, dy, cgroup, precision) {
            if (dx === dy === 0) {
                return false;
            }
            if (typeof cgroup === 'number') {
                precision = cgroup;
                cgroup = void 0;
            }
            const obstacles = {
                x: false,
                y: false
            };
            precision = Math.abs(precision || 1);
            while (Math.abs(dx) > precision) {
                const occupied =
                    ct.place.occupied(me, me.x + Math.sign(dx) * precision, me.y, cgroup);
                if (!occupied) {
                    me.x += Math.sign(dx) * precision;
                    dx -= Math.sign(dx) * precision;
                } else {
                    obstacles.x = occupied;
                    break;
                }
            }
            while (Math.abs(dy) > precision) {
                const occupied =
                    ct.place.occupied(me, me.x, me.y + Math.sign(dy) * precision, cgroup);
                if (!occupied) {
                    me.y += Math.sign(dy) * precision;
                    dy -= Math.sign(dy) * precision;
                } else {
                    obstacles.y = occupied;
                    break;
                }
            }
            // A fraction of precision may be left but completely reachable; jump to this point.
            if (Math.abs(dx) < precision) {
                if (ct.place.free(me, me.x + dx, me.y, cgroup)) {
                    me.x += dx;
                }
            }
            if (Math.abs(dy) < precision) {
                if (ct.place.free(me, me.x, me.y + dy, cgroup)) {
                    me.y += dy;
                }
            }
            if (!obstacles.x && !obstacles.y) {
                return false;
            }
            return obstacles;
        },
        go(me, x, y, length, cgroup) {
            // ct.place.go(<me: Copy, x: number, y: number, length: number>[, cgroup: String])
            // tries to reach the target with a simple obstacle avoidance algorithm

            // if we are too close to the destination, exit
            if (ct.u.pdc(me.x, me.y, x, y) < length) {
                if (ct.place.free(me, x, y, cgroup)) {
                    me.x = x;
                    me.y = y;
                    delete me._shape;
                }
                return;
            }
            var dir = ct.u.pdn(me.x, me.y, x, y);

            //if there are no obstackles in front of us, go forward
            let projectedX = me.x + ct.u.ldx(length, dir),
                projectedY = me.y + ct.u.ldy(length, dir);
            if (ct.place.free(me, projectedX, projectedY, cgroup)) {
                me.x = projectedX;
                me.y = projectedY;
                delete me._shape;
                me.dir = dir;
            // otherwise, try to change direction by 30...60...90 degrees.
            // Direction changes over time (ct.place.m).
            } else {
                for (var i = -1; i <= 1; i += 2) {
                    for (var j = 30; j < 150; j += 30) {
                        projectedX = me.x + ct.u.ldx(length, dir + j * ct.place.m * i);
                        projectedY = me.y + ct.u.ldy(length, dir + j * ct.place.m * i);
                        if (ct.place.free(me, projectedX, projectedY, cgroup)) {
                            me.x = projectedX;
                            me.y = projectedY;
                            delete me._shape;
                            me.dir = dir + j * ct.place.m * i;
                            return;
                        }
                    }
                }
            }
        },
        traceCustom(shape, oversized, cgroup, getAll) {
            const results = [];
            if (debugMode) {
                shape.$cDebugCollision = ct.place.debugTraceGraphics;
                ct.place.drawDebugGraphic.apply(shape, [true]);
            }
            // Oversized tracing shapes won't work with partitioning table, and thus
            // will need to loop over all the copies and tiles in the room.
            // Non-oversized shapes can use plain ct.place.occupied.
            if (!oversized) {
                if (getAll) {
                    return ct.place.occupiedMultiple(shape, cgroup);
                }
                return ct.place.occupied(shape, cgroup);
            }
            // Oversized shapes.
            // Loop over all the copies in the room.
            for (const copy of ct.stack) {
                if (!cgroup || copy.cgroup === cgroup) {
                    if (ct.place.collide(shape, copy)) {
                        if (getAll) {
                            results.push(copy);
                        } else {
                            return copy;
                        }
                    }
                }
            }
            // Additionally, loop over all the tilesets and their tiles.
            for (const tilemap of ct.templates.list.TILEMAP) {
                if (!tilemap.addedCollisions) {
                    continue;
                }
                if (cgroup && tilemap.cgroup !== cgroup) {
                    continue;
                }
                for (const tile of tilemap.pixiTiles) {
                    if (ct.place.collide(shape, tile)) {
                        if (getAll) {
                            results.push(tile);
                        } else {
                            return tile;
                        }
                    }
                }
            }
            if (!getAll) {
                return false;
            }
            return results;
        },
        /**
         * Tests for intersections with a line segment.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the line segment; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceLineSegment} line An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceLine(line, cgroup, getAll) {
            let oversized = false;
            if (Math.abs(line.x1 - line.x2) > ct.place.gridX) {
                oversized = true;
            } else if (Math.abs(line.y1 - line.y2) > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: line.x1,
                y: line.y1,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: line.x2 - line.x1,
                    y2: line.y2 - line.y1
                }
            };
            const result = ct.place.traceCustom(shape, oversized, cgroup, getAll);
            if (getAll) {
                // An approximate sorting by distance
                result.sort(function sortCopies(a, b) {
                    var dist1, dist2;
                    dist1 = ct.u.pdc(line.x1, line.y1, a.x, a.y);
                    dist2 = ct.u.pdc(line.x1, line.y1, b.x, b.y);
                    return dist1 - dist2;
                });
            }
            return result;
        },
        /**
         * Tests for intersections with a filled rectangle.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the rectangle; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceRectangle} rect An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceRect(rect, cgroup, getAll) {
            let oversized = false;
            rect = { // Copy the object
                ...rect
            };
            // Turn x1, x2, y1, y2 into x, y, width, and height
            if ('x1' in rect) {
                rect.x = rect.x1;
                rect.y = rect.y1;
                rect.width = rect.x2 - rect.x1;
                rect.height = rect.y2 - rect.y1;
            }
            if (Math.abs(rect.width) > ct.place.gridX || Math.abs(rect.height) > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: rect.x,
                y: rect.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'rect',
                    left: 0,
                    top: 0,
                    right: rect.width,
                    bottom: rect.height
                }
            };
            return ct.place.traceCustom(shape, oversized, cgroup, getAll);
        },
        /**
         * Tests for intersections with a filled circle.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the circle; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceCircle} rect An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceCircle(circle, cgroup, getAll) {
            let oversized = false;
            if (circle.radius * 2 > ct.place.gridX || circle.radius * 2 > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: circle.x,
                y: circle.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'circle',
                    r: circle.radius
                }
            };
            return ct.place.traceCustom(shape, oversized, cgroup, getAll);
        },
        /**
         * Tests for intersections with a polyline. It is a hollow shape made
         * of connected line segments. The shape is not closed unless you add
         * the closing point by yourself.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the polyline; otherwise, returns the first one that fits the conditions.
         *
         * @param {Array<IPoint>} polyline An array of objects with `x` and `y` properties.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        tracePolyline(polyline, cgroup, getAll) {
            const shape = {
                x: 0,
                y: 0,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'strip',
                    points: polyline
                }
            };
            return ct.place.traceCustom(shape, true, cgroup, getAll);
        },
        /**
         * Tests for intersections with a point.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the point; otherwise, returns the first one that fits the conditions.
         *
         * @param {object} point An object with `x` and `y` properties.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        tracePoint(point, cgroup, getAll) {
            const shape = {
                x: point.x,
                y: point.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'point'
                }
            };
            return ct.place.traceCustom(shape, false, cgroup, getAll);
        }
    };
    // Aliases
    ct.place.traceRectange = ct.place.traceRect;
    // a magic procedure which tells 'go' function to change its direction
    setInterval(function switchCtPlaceGoDirection() {
        ct.place.m *= -1;
    }, 789);
})(ct);

(function mountCtPointer(ct) {
    const keyPrefix = 'pointer.';
    const setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };
    const getKey = function (key) {
        return ct.inputs.registry[keyPrefix + key];
    };
    const buttonMappings = {
        Primary: 1,
        Middle: 4,
        Secondary: 2,
        ExtraOne: 8,
        ExtraTwo: 16,
        Eraser: 32
    };
    var lastPanNum = 0,
        lastPanX = 0,
        lastPanY = 0,
        lastScaleDistance = 0,
        lastAngle = 0;

    // updates Action system's input methods for singular, double and triple pointers
    var countPointers = () => {
        setKey('Any', ct.pointer.down.length > 0 ? 1 : 0);
        setKey('Double', ct.pointer.down.length > 1 ? 1 : 0);
        setKey('Triple', ct.pointer.down.length > 2 ? 1 : 0);
    };
    // returns a new object with the necessary information about a pointer event
    var copyPointer = e => {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        const xui = (e.clientX - rect.left) / rect.width * ct.camera.width,
              yui = (e.clientY - rect.top) / rect.height * ct.camera.height;
        const positionGame = ct.u.uiToGameCoord(xui, yui);
        const pointer = {
            id: e.pointerId,
            x: positionGame.x,
            y: positionGame.y,
            clientX: e.clientX,
            clientY: e.clientY,
            xui: xui,
            yui: yui,
            xprev: positionGame.x,
            yprev: positionGame.y,
            buttons: e.buttons,
            xuiprev: xui,
            yuiprev: yui,
            pressure: e.pressure,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
            twist: e.twist,
            type: e.pointerType,
            width: e.width / rect.width * ct.camera.width,
            height: e.height / rect.height * ct.camera.height
        };
        return pointer;
    };
    var updatePointer = (pointer, e) => {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        const xui = (e.clientX - rect.left) / rect.width * ct.camera.width,
              yui = (e.clientY - rect.top) / rect.height * ct.camera.height;
        const positionGame = ct.u.uiToGameCoord(xui, yui);
        Object.assign(pointer, {
            x: positionGame.x,
            y: positionGame.y,
            xui: xui,
            yui: yui,
            clientX: e.clientX,
            clientY: e.clientY,
            pressure: e.pressure,
            buttons: e.buttons,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
            twist: e.twist,
            width: e.width / rect.width * ct.camera.width,
            height: e.height / rect.height * ct.camera.height
        });
    };
    var writePrimary = function (pointer) {
        Object.assign(ct.pointer, {
            x: pointer.x,
            y: pointer.y,
            xui: pointer.xui,
            yui: pointer.yui,
            pressure: pointer.pressure,
            buttons: pointer.buttons,
            tiltX: pointer.tiltX,
            tiltY: pointer.tiltY,
            twist: pointer.twist
        });
    };

    var handleHoverStart = function (e) {
        const pointer = copyPointer(e);
        ct.pointer.hover.push(pointer);
        if (e.isPrimary) {
            writePrimary(pointer);
        }
    };
    var handleHoverEnd = function (e) {
        const pointer = ct.pointer.hover.find(p => p.id === e.pointerId);
        if (pointer) {
            pointer.invalid = true;
            ct.pointer.hover.splice(ct.pointer.hover.indexOf(pointer), 1);
        }
        // Handles mouse pointers that were dragged out of the ct.js frame while pressing,
        // as they don't trigger pointercancel or such
        const downId = ct.pointer.down.findIndex(p => p.id === e.pointerId);
        if (downId !== -1) {
            ct.pointer.down.splice(downId, 1);
        }
    };
    var handleMove = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        let pointerHover = ct.pointer.hover.find(p => p.id === e.pointerId);
        if (!pointerHover) {
            // Catches hover events that started before the game has loaded
            handleHoverStart(e);
            pointerHover = ct.pointer.hover.find(p => p.id === e.pointerId);
        }
        const pointerDown = ct.pointer.down.find(p => p.id === e.pointerId);
        if (!pointerHover && !pointerDown) {
            return;
        }
        if (pointerHover) {
            updatePointer(pointerHover, e);
        }
        if (pointerDown) {
            updatePointer(pointerDown, e);
        }
        if (e.isPrimary) {
            writePrimary(pointerHover || pointerDown);
        }
    };
    var handleDown = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        ct.pointer.type = e.pointerType;
        const pointer = copyPointer(e);
        ct.pointer.down.push(pointer);
        countPointers();
        if (e.isPrimary) {
            writePrimary(pointer);
        }
    };
    var handleUp = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        const pointer = ct.pointer.down.find(p => p.id === e.pointerId);
        if (pointer) {
            ct.pointer.released.push(pointer);
        }
        if (ct.pointer.down.indexOf(pointer) !== -1) {
            ct.pointer.down.splice(ct.pointer.down.indexOf(pointer), 1);
        }
        countPointers();
    };
    var handleWheel = function handleWheel(e) {
        setKey('Wheel', ((e.wheelDelta || -e.detail) < 0) ? -1 : 1);
        if (![false][0]) {
            e.preventDefault();
        }
    };

    let locking = false;
    const genericCollisionCheck = function genericCollisionCheck(
        copy,
        specificPointer,
        set,
        uiSpace
    ) {
        if (locking) {
            return false;
        }
        for (const pointer of set) {
            if (specificPointer && pointer.id !== specificPointer.id) {
                continue;
            }
            if (ct.place.collide(copy, {
                x: uiSpace ? pointer.xui : pointer.x,
                y: uiSpace ? pointer.yui : pointer.y,
                scale: {
                    x: 1,
                    y: 1
                },
                angle: 0,
                shape: {
                    type: 'rect',
                    top: pointer.height / 2,
                    bottom: pointer.height / 2,
                    left: pointer.width / 2,
                    right: pointer.width / 2
                }
            })) {
                return pointer;
            }
        }
        return false;
    };
    // Triggers on every mouse press event to capture pointer after it was released by a user,
    // e.g. after the window was blurred
    const pointerCapturer = function pointerCapturer() {
        if (!document.pointerLockElement && !document.mozPointerLockElement) {
            const request = document.body.requestPointerLock || document.body.mozRequestPointerLock;
            request.apply(document.body);
        }
    };
    const capturedPointerMove = function capturedPointerMove(e) {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        const dx = e.movementX / rect.width * ct.camera.width,
              dy = e.movementY / rect.height * ct.camera.height;
        ct.pointer.xlocked += dx;
        ct.pointer.ylocked += dy;
        ct.pointer.xmovement = dx;
        ct.pointer.ymovement = dy;
    };

    ct.pointer = {
        setupListeners() {
            document.addEventListener('pointerenter', handleHoverStart, false);
            document.addEventListener('pointerout', handleHoverEnd, false);
            document.addEventListener('pointerleave', handleHoverEnd, false);
            document.addEventListener('pointerdown', handleDown, false);
            document.addEventListener('pointerup', handleUp, false);
            document.addEventListener('pointercancel', handleUp, false);
            document.addEventListener('pointermove', handleMove, false);
            document.addEventListener('wheel', handleWheel, {
                passive: false
            });
            document.addEventListener('DOMMouseScroll', handleWheel, {
                passive: false
            });
            document.addEventListener('contextmenu', e => {
                if (![false][0]) {
                    e.preventDefault();
                }
            });
        },
        hover: [],
        down: [],
        released: [],
        x: 0,
        y: 0,
        xprev: 0,
        yprev: 0,
        xui: 0,
        yui: 0,
        xuiprev: 0,
        yuiprev: 0,
        xlocked: 0,
        ylocked: 0,
        xmovement: 0,
        ymovement: 0,
        pressure: 1,
        buttons: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        width: 1,
        height: 1,
        type: null,
        clear() {
            ct.pointer.down.length = 0;
            ct.pointer.hover.length = 0;
            ct.pointer.clearReleased();
            countPointers();
        },
        clearReleased() {
            ct.pointer.released.length = 0;
        },
        collides(copy, pointer, checkReleased) {
            var set = checkReleased ? ct.pointer.released : ct.pointer.down;
            return genericCollisionCheck(copy, pointer, set, false);
        },
        collidesUi(copy, pointer, checkReleased) {
            var set = checkReleased ? ct.pointer.released : ct.pointer.down;
            return genericCollisionCheck(copy, pointer, set, true);
        },
        hovers(copy, pointer) {
            return genericCollisionCheck(copy, pointer, ct.pointer.hover, false);
        },
        hoversUi(copy, pointer) {
            return genericCollisionCheck(copy, pointer, ct.pointer.hover, true);
        },
        isButtonPressed(button, pointer) {
            if (!pointer) {
                return Boolean(getKey(button));
            }
            // eslint-disable-next-line no-bitwise
            return (pointer.buttons & buttonMappings[button]) === button ? 1 : 0;
        },
        updateGestures() {
            let x = 0,
                y = 0;
            const rect = ct.pixiApp.view.getBoundingClientRect();
            // Get the middle point of all the pointers
            for (const event of ct.pointer.down) {
                x += (event.clientX - rect.left) / rect.width;
                y += (event.clientY - rect.top) / rect.height;
            }
            x /= ct.pointer.down.length;
            y /= ct.pointer.down.length;

            let angle = 0,
                distance = lastScaleDistance;
            if (ct.pointer.down.length > 1) {
                const events = [
                    ct.pointer.down[0],
                    ct.pointer.down[1]
                ].sort((a, b) => a.id - b.id);
                angle = ct.u.pdn(
                    events[0].x,
                    events[0].y,
                    events[1].x,
                    events[1].y
                );
                distance = ct.u.pdc(
                    events[0].x,
                    events[0].y,
                    events[1].x,
                    events[1].y
                );
            }
            if (lastPanNum === ct.pointer.down.length) {
                if (ct.pointer.down.length > 1) {
                    setKey('DeltaRotation', (ct.u.degToRad(ct.u.deltaDir(lastAngle, angle))));
                    setKey('DeltaPinch', distance / lastScaleDistance - 1);
                } else {
                    setKey('DeltaPinch', 0);
                    setKey('DeltaRotation', 0);
                }
                if (!ct.pointer.down.length) {
                    setKey('PanX', 0);
                    setKey('PanY', 0);
                } else {
                    setKey('PanX', x - lastPanX);
                    setKey('PanY', y - lastPanY);
                }
            } else {
                // skip gesture updates to avoid shaking on new presses
                lastPanNum = ct.pointer.down.length;
                setKey('DeltaPinch', 0);
                setKey('DeltaRotation', 0);
                setKey('PanX', 0);
                setKey('PanY', 0);
            }
            lastPanX = x;
            lastPanY = y;
            lastAngle = angle;
            lastScaleDistance = distance;

            for (const button in buttonMappings) {
                setKey(button, 0);
                for (const pointer of ct.pointer.down) {
                    // eslint-disable-next-line no-bitwise
                    if ((pointer.buttons & buttonMappings[button]) === buttonMappings[button]) {
                        setKey(button, 1);
                    }
                }
            }
        },
        lock() {
            if (locking) {
                return;
            }
            locking = true;
            ct.pointer.xlocked = ct.pointer.xui;
            ct.pointer.ylocked = ct.pointer.yui;
            const request = document.body.requestPointerLock || document.body.mozRequestPointerLock;
            request.apply(document.body);
            document.addEventListener('click', pointerCapturer);
            document.addEventListener('pointermove', capturedPointerMove);
        },
        unlock() {
            if (!locking) {
                return;
            }
            locking = false;
            if (document.pointerLockElement || document.mozPointerLockElement) {
                (document.exitPointerLock || document.mozExitPointerLock)();
            }
            document.removeEventListener('click', pointerCapturer);
            document.removeEventListener('pointermove', capturedPointerMove);
        },
        get locked() {
            // Do not return the Document object
            return Boolean(document.pointerLockElement || document.mozPointerLockElement);
        }
    };
    setKey('Wheel', 0);
    if ([false][0]) {
        ct.pointer.lock();
    }
})(ct);

(function(global) {
    'use strict';
  
    var nativeKeyboardEvent = ('KeyboardEvent' in global);
    if (!nativeKeyboardEvent)
      global.KeyboardEvent = function KeyboardEvent() { throw TypeError('Illegal constructor'); };
  
    [
      ['DOM_KEY_LOCATION_STANDARD', 0x00], // Default or unknown location
      ['DOM_KEY_LOCATION_LEFT', 0x01], // e.g. Left Alt key
      ['DOM_KEY_LOCATION_RIGHT', 0x02], // e.g. Right Alt key
      ['DOM_KEY_LOCATION_NUMPAD', 0x03], // e.g. Numpad 0 or +
    ].forEach(function(p) { if (!(p[0] in global.KeyboardEvent)) global.KeyboardEvent[p[0]] = p[1]; });
  
    var STANDARD = global.KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
        LEFT = global.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
        RIGHT = global.KeyboardEvent.DOM_KEY_LOCATION_RIGHT,
        NUMPAD = global.KeyboardEvent.DOM_KEY_LOCATION_NUMPAD;
  
    //--------------------------------------------------------------------
    //
    // Utilities
    //
    //--------------------------------------------------------------------
  
    function contains(s, ss) { return String(s).indexOf(ss) !== -1; }
  
    var os = (function() {
      if (contains(navigator.platform, 'Win')) { return 'win'; }
      if (contains(navigator.platform, 'Mac')) { return 'mac'; }
      if (contains(navigator.platform, 'CrOS')) { return 'cros'; }
      if (contains(navigator.platform, 'Linux')) { return 'linux'; }
      if (contains(navigator.userAgent, 'iPad') || contains(navigator.platform, 'iPod') || contains(navigator.platform, 'iPhone')) { return 'ios'; }
      return '';
    } ());
  
    var browser = (function() {
      if (contains(navigator.userAgent, 'Chrome/')) { return 'chrome'; }
      if (contains(navigator.vendor, 'Apple')) { return 'safari'; }
      if (contains(navigator.userAgent, 'MSIE')) { return 'ie'; }
      if (contains(navigator.userAgent, 'Gecko/')) { return 'moz'; }
      if (contains(navigator.userAgent, 'Opera/')) { return 'opera'; }
      return '';
    } ());
  
    var browser_os = browser + '-' + os;
  
    function mergeIf(baseTable, select, table) {
      if (browser_os === select || browser === select || os === select) {
        Object.keys(table).forEach(function(keyCode) {
          baseTable[keyCode] = table[keyCode];
        });
      }
    }
  
    function remap(o, key) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        var item = o[k];
        if (key in item) {
          r[item[key]] = item;
        }
      });
      return r;
    }
  
    function invert(o) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        r[o[k]] = k;
      });
      return r;
    }
  
    //--------------------------------------------------------------------
    //
    // Generic Mappings
    //
    //--------------------------------------------------------------------
  
    // "keyInfo" is a dictionary:
    //   code: string - name from UI Events KeyboardEvent code Values
    //     https://w3c.github.io/uievents-code/
    //   location (optional): number - one of the DOM_KEY_LOCATION values
    //   keyCap (optional): string - keyboard label in en-US locale
    // USB code Usage ID from page 0x07 unless otherwise noted (Informative)
  
    // Map of keyCode to keyInfo
    var keyCodeToInfoTable = {
      // 0x01 - VK_LBUTTON
      // 0x02 - VK_RBUTTON
      0x03: { code: 'Cancel' }, // [USB: 0x9b] char \x0018 ??? (Not in D3E)
      // 0x04 - VK_MBUTTON
      // 0x05 - VK_XBUTTON1
      // 0x06 - VK_XBUTTON2
      0x06: { code: 'Help' }, // [USB: 0x75] ???
      // 0x07 - undefined
      0x08: { code: 'Backspace' }, // [USB: 0x2a] Labelled Delete on Macintosh keyboards.
      0x09: { code: 'Tab' }, // [USB: 0x2b]
      // 0x0A-0x0B - reserved
      0X0C: { code: 'Clear' }, // [USB: 0x9c] NumPad Center (Not in D3E)
      0X0D: { code: 'Enter' }, // [USB: 0x28]
      // 0x0E-0x0F - undefined
  
      0x10: { code: 'Shift' },
      0x11: { code: 'Control' },
      0x12: { code: 'Alt' },
      0x13: { code: 'Pause' }, // [USB: 0x48]
      0x14: { code: 'CapsLock' }, // [USB: 0x39]
      0x15: { code: 'KanaMode' }, // [USB: 0x88]
      0x16: { code: 'Lang1' }, // [USB: 0x90]
      // 0x17: VK_JUNJA
      // 0x18: VK_FINAL
      0x19: { code: 'Lang2' }, // [USB: 0x91]
      // 0x1A - undefined
      0x1B: { code: 'Escape' }, // [USB: 0x29]
      0x1C: { code: 'Convert' }, // [USB: 0x8a]
      0x1D: { code: 'NonConvert' }, // [USB: 0x8b]
      0x1E: { code: 'Accept' }, // [USB: ????]
      0x1F: { code: 'ModeChange' }, // [USB: ????]
  
      0x20: { code: 'Space' }, // [USB: 0x2c]
      0x21: { code: 'PageUp' }, // [USB: 0x4b]
      0x22: { code: 'PageDown' }, // [USB: 0x4e]
      0x23: { code: 'End' }, // [USB: 0x4d]
      0x24: { code: 'Home' }, // [USB: 0x4a]
      0x25: { code: 'ArrowLeft' }, // [USB: 0x50]
      0x26: { code: 'ArrowUp' }, // [USB: 0x52]
      0x27: { code: 'ArrowRight' }, // [USB: 0x4f]
      0x28: { code: 'ArrowDown' }, // [USB: 0x51]
      0x29: { code: 'Select' }, // (Not in D3E)
      0x2A: { code: 'Print' }, // (Not in D3E)
      0x2B: { code: 'Execute' }, // [USB: 0x74] (Not in D3E)
      0x2C: { code: 'PrintScreen' }, // [USB: 0x46]
      0x2D: { code: 'Insert' }, // [USB: 0x49]
      0x2E: { code: 'Delete' }, // [USB: 0x4c]
      0x2F: { code: 'Help' }, // [USB: 0x75] ???
  
      0x30: { code: 'Digit0', keyCap: '0' }, // [USB: 0x27] 0)
      0x31: { code: 'Digit1', keyCap: '1' }, // [USB: 0x1e] 1!
      0x32: { code: 'Digit2', keyCap: '2' }, // [USB: 0x1f] 2@
      0x33: { code: 'Digit3', keyCap: '3' }, // [USB: 0x20] 3#
      0x34: { code: 'Digit4', keyCap: '4' }, // [USB: 0x21] 4$
      0x35: { code: 'Digit5', keyCap: '5' }, // [USB: 0x22] 5%
      0x36: { code: 'Digit6', keyCap: '6' }, // [USB: 0x23] 6^
      0x37: { code: 'Digit7', keyCap: '7' }, // [USB: 0x24] 7&
      0x38: { code: 'Digit8', keyCap: '8' }, // [USB: 0x25] 8*
      0x39: { code: 'Digit9', keyCap: '9' }, // [USB: 0x26] 9(
      // 0x3A-0x40 - undefined
  
      0x41: { code: 'KeyA', keyCap: 'a' }, // [USB: 0x04]
      0x42: { code: 'KeyB', keyCap: 'b' }, // [USB: 0x05]
      0x43: { code: 'KeyC', keyCap: 'c' }, // [USB: 0x06]
      0x44: { code: 'KeyD', keyCap: 'd' }, // [USB: 0x07]
      0x45: { code: 'KeyE', keyCap: 'e' }, // [USB: 0x08]
      0x46: { code: 'KeyF', keyCap: 'f' }, // [USB: 0x09]
      0x47: { code: 'KeyG', keyCap: 'g' }, // [USB: 0x0a]
      0x48: { code: 'KeyH', keyCap: 'h' }, // [USB: 0x0b]
      0x49: { code: 'KeyI', keyCap: 'i' }, // [USB: 0x0c]
      0x4A: { code: 'KeyJ', keyCap: 'j' }, // [USB: 0x0d]
      0x4B: { code: 'KeyK', keyCap: 'k' }, // [USB: 0x0e]
      0x4C: { code: 'KeyL', keyCap: 'l' }, // [USB: 0x0f]
      0x4D: { code: 'KeyM', keyCap: 'm' }, // [USB: 0x10]
      0x4E: { code: 'KeyN', keyCap: 'n' }, // [USB: 0x11]
      0x4F: { code: 'KeyO', keyCap: 'o' }, // [USB: 0x12]
  
      0x50: { code: 'KeyP', keyCap: 'p' }, // [USB: 0x13]
      0x51: { code: 'KeyQ', keyCap: 'q' }, // [USB: 0x14]
      0x52: { code: 'KeyR', keyCap: 'r' }, // [USB: 0x15]
      0x53: { code: 'KeyS', keyCap: 's' }, // [USB: 0x16]
      0x54: { code: 'KeyT', keyCap: 't' }, // [USB: 0x17]
      0x55: { code: 'KeyU', keyCap: 'u' }, // [USB: 0x18]
      0x56: { code: 'KeyV', keyCap: 'v' }, // [USB: 0x19]
      0x57: { code: 'KeyW', keyCap: 'w' }, // [USB: 0x1a]
      0x58: { code: 'KeyX', keyCap: 'x' }, // [USB: 0x1b]
      0x59: { code: 'KeyY', keyCap: 'y' }, // [USB: 0x1c]
      0x5A: { code: 'KeyZ', keyCap: 'z' }, // [USB: 0x1d]
      0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
      0x5C: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
      0x5D: { code: 'ContextMenu' }, // [USB: 0x65] Context Menu
      // 0x5E - reserved
      0x5F: { code: 'Standby' }, // [USB: 0x82] Sleep
  
      0x60: { code: 'Numpad0', keyCap: '0', location: NUMPAD }, // [USB: 0x62]
      0x61: { code: 'Numpad1', keyCap: '1', location: NUMPAD }, // [USB: 0x59]
      0x62: { code: 'Numpad2', keyCap: '2', location: NUMPAD }, // [USB: 0x5a]
      0x63: { code: 'Numpad3', keyCap: '3', location: NUMPAD }, // [USB: 0x5b]
      0x64: { code: 'Numpad4', keyCap: '4', location: NUMPAD }, // [USB: 0x5c]
      0x65: { code: 'Numpad5', keyCap: '5', location: NUMPAD }, // [USB: 0x5d]
      0x66: { code: 'Numpad6', keyCap: '6', location: NUMPAD }, // [USB: 0x5e]
      0x67: { code: 'Numpad7', keyCap: '7', location: NUMPAD }, // [USB: 0x5f]
      0x68: { code: 'Numpad8', keyCap: '8', location: NUMPAD }, // [USB: 0x60]
      0x69: { code: 'Numpad9', keyCap: '9', location: NUMPAD }, // [USB: 0x61]
      0x6A: { code: 'NumpadMultiply', keyCap: '*', location: NUMPAD }, // [USB: 0x55]
      0x6B: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
      0x6C: { code: 'NumpadComma', keyCap: ',', location: NUMPAD }, // [USB: 0x85]
      0x6D: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD }, // [USB: 0x56]
      0x6E: { code: 'NumpadDecimal', keyCap: '.', location: NUMPAD }, // [USB: 0x63]
      0x6F: { code: 'NumpadDivide', keyCap: '/', location: NUMPAD }, // [USB: 0x54]
  
      0x70: { code: 'F1' }, // [USB: 0x3a]
      0x71: { code: 'F2' }, // [USB: 0x3b]
      0x72: { code: 'F3' }, // [USB: 0x3c]
      0x73: { code: 'F4' }, // [USB: 0x3d]
      0x74: { code: 'F5' }, // [USB: 0x3e]
      0x75: { code: 'F6' }, // [USB: 0x3f]
      0x76: { code: 'F7' }, // [USB: 0x40]
      0x77: { code: 'F8' }, // [USB: 0x41]
      0x78: { code: 'F9' }, // [USB: 0x42]
      0x79: { code: 'F10' }, // [USB: 0x43]
      0x7A: { code: 'F11' }, // [USB: 0x44]
      0x7B: { code: 'F12' }, // [USB: 0x45]
      0x7C: { code: 'F13' }, // [USB: 0x68]
      0x7D: { code: 'F14' }, // [USB: 0x69]
      0x7E: { code: 'F15' }, // [USB: 0x6a]
      0x7F: { code: 'F16' }, // [USB: 0x6b]
  
      0x80: { code: 'F17' }, // [USB: 0x6c]
      0x81: { code: 'F18' }, // [USB: 0x6d]
      0x82: { code: 'F19' }, // [USB: 0x6e]
      0x83: { code: 'F20' }, // [USB: 0x6f]
      0x84: { code: 'F21' }, // [USB: 0x70]
      0x85: { code: 'F22' }, // [USB: 0x71]
      0x86: { code: 'F23' }, // [USB: 0x72]
      0x87: { code: 'F24' }, // [USB: 0x73]
      // 0x88-0x8F - unassigned
  
      0x90: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0x91: { code: 'ScrollLock' }, // [USB: 0x47]
      // 0x92-0x96 - OEM specific
      // 0x97-0x9F - unassigned
  
      // NOTE: 0xA0-0xA5 usually mapped to 0x10-0x12 in browsers
      0xA0: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0xA1: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0xA2: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0xA3: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0xA4: { code: 'AltLeft', location: LEFT }, // [USB: 0xe2]
      0xA5: { code: 'AltRight', location: RIGHT }, // [USB: 0xe6]
  
      0xA6: { code: 'BrowserBack' }, // [USB: 0x0c/0x0224]
      0xA7: { code: 'BrowserForward' }, // [USB: 0x0c/0x0225]
      0xA8: { code: 'BrowserRefresh' }, // [USB: 0x0c/0x0227]
      0xA9: { code: 'BrowserStop' }, // [USB: 0x0c/0x0226]
      0xAA: { code: 'BrowserSearch' }, // [USB: 0x0c/0x0221]
      0xAB: { code: 'BrowserFavorites' }, // [USB: 0x0c/0x0228]
      0xAC: { code: 'BrowserHome' }, // [USB: 0x0c/0x0222]
      0xAD: { code: 'AudioVolumeMute' }, // [USB: 0x7f]
      0xAE: { code: 'AudioVolumeDown' }, // [USB: 0x81]
      0xAF: { code: 'AudioVolumeUp' }, // [USB: 0x80]
  
      0xB0: { code: 'MediaTrackNext' }, // [USB: 0x0c/0x00b5]
      0xB1: { code: 'MediaTrackPrevious' }, // [USB: 0x0c/0x00b6]
      0xB2: { code: 'MediaStop' }, // [USB: 0x0c/0x00b7]
      0xB3: { code: 'MediaPlayPause' }, // [USB: 0x0c/0x00cd]
      0xB4: { code: 'LaunchMail' }, // [USB: 0x0c/0x018a]
      0xB5: { code: 'MediaSelect' },
      0xB6: { code: 'LaunchApp1' },
      0xB7: { code: 'LaunchApp2' },
      // 0xB8-0xB9 - reserved
      0xBA: { code: 'Semicolon',  keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
      0xBB: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
      0xBC: { code: 'Comma', keyCap: ',' }, // [USB: 0x36] ,<
      0xBD: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
      0xBE: { code: 'Period', keyCap: '.' }, // [USB: 0x37] .>
      0xBF: { code: 'Slash', keyCap: '/' }, // [USB: 0x38] /? (US Standard 101)
  
      0xC0: { code: 'Backquote', keyCap: '`' }, // [USB: 0x35] `~ (US Standard 101)
      // 0xC1-0xCF - reserved
  
      // 0xD0-0xD7 - reserved
      // 0xD8-0xDA - unassigned
      0xDB: { code: 'BracketLeft', keyCap: '[' }, // [USB: 0x2f] [{ (US Standard 101)
      0xDC: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
      0xDD: { code: 'BracketRight', keyCap: ']' }, // [USB: 0x30] ]} (US Standard 101)
      0xDE: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
      // 0xDF - miscellaneous/varies
  
      // 0xE0 - reserved
      // 0xE1 - OEM specific
      0xE2: { code: 'IntlBackslash',  keyCap: '\\' }, // [USB: 0x64] \| (UK Standard 102)
      // 0xE3-0xE4 - OEM specific
      0xE5: { code: 'Process' }, // (Not in D3E)
      // 0xE6 - OEM specific
      // 0xE7 - VK_PACKET
      // 0xE8 - unassigned
      // 0xE9-0xEF - OEM specific
  
      // 0xF0-0xF5 - OEM specific
      0xF6: { code: 'Attn' }, // [USB: 0x9a] (Not in D3E)
      0xF7: { code: 'CrSel' }, // [USB: 0xa3] (Not in D3E)
      0xF8: { code: 'ExSel' }, // [USB: 0xa4] (Not in D3E)
      0xF9: { code: 'EraseEof' }, // (Not in D3E)
      0xFA: { code: 'Play' }, // (Not in D3E)
      0xFB: { code: 'ZoomToggle' }, // (Not in D3E)
      // 0xFC - VK_NONAME - reserved
      // 0xFD - VK_PA1
      0xFE: { code: 'Clear' } // [USB: 0x9c] (Not in D3E)
    };
  
    // No legacy keyCode, but listed in D3E:
  
    // code: usb
    // 'IntlHash': 0x070032,
    // 'IntlRo': 0x070087,
    // 'IntlYen': 0x070089,
    // 'NumpadBackspace': 0x0700bb,
    // 'NumpadClear': 0x0700d8,
    // 'NumpadClearEntry': 0x0700d9,
    // 'NumpadMemoryAdd': 0x0700d3,
    // 'NumpadMemoryClear': 0x0700d2,
    // 'NumpadMemoryRecall': 0x0700d1,
    // 'NumpadMemoryStore': 0x0700d0,
    // 'NumpadMemorySubtract': 0x0700d4,
    // 'NumpadParenLeft': 0x0700b6,
    // 'NumpadParenRight': 0x0700b7,
  
    //--------------------------------------------------------------------
    //
    // Browser/OS Specific Mappings
    //
    //--------------------------------------------------------------------
  
    mergeIf(keyCodeToInfoTable,
            'moz', {
              0x3B: { code: 'Semicolon', keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
              0x3D: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6B: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6D: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
              0xBB: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
              0xBD: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD } // [USB: 0x56]
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-mac', {
              0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-win', {
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'chrome-mac', {
              0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
            });
  
    // Windows via Bootcamp (!)
    if (0) {
      mergeIf(keyCodeToInfoTable,
              'chrome-win', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
  
      mergeIf(keyCodeToInfoTable,
              'ie', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
    }
  
    mergeIf(keyCodeToInfoTable,
            'safari', {
              0x03: { code: 'Enter' }, // [USB: 0x28] old Safari
              0x19: { code: 'Tab' } // [USB: 0x2b] old Safari for Shift+Tab
            });
  
    mergeIf(keyCodeToInfoTable,
            'ios', {
              0x0A: { code: 'Enter', location: STANDARD } // [USB: 0x28]
            });
  
    mergeIf(keyCodeToInfoTable,
            'safari-mac', {
              0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
              0x5D: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
              0xE5: { code: 'KeyQ', keyCap: 'Q' } // [USB: 0x14] On alternate presses, Ctrl+Q sends this
            });
  
    //--------------------------------------------------------------------
    //
    // Identifier Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send keyIdentifier which can be
    // used to disambiguate keys.
  
    // keyIdentifierTable[keyIdentifier] -> keyInfo
  
    var keyIdentifierTable = {};
    if ('cros' === os) {
      keyIdentifierTable['U+00A0'] = { code: 'ShiftLeft', location: LEFT };
      keyIdentifierTable['U+00A1'] = { code: 'ShiftRight', location: RIGHT };
      keyIdentifierTable['U+00A2'] = { code: 'ControlLeft', location: LEFT };
      keyIdentifierTable['U+00A3'] = { code: 'ControlRight', location: RIGHT };
      keyIdentifierTable['U+00A4'] = { code: 'AltLeft', location: LEFT };
      keyIdentifierTable['U+00A5'] = { code: 'AltRight', location: RIGHT };
    }
    if ('chrome-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('safari-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('ios' === os) {
      // These only generate keyup events
      keyIdentifierTable['U+0010'] = { code: 'Function' };
  
      keyIdentifierTable['U+001C'] = { code: 'ArrowLeft' };
      keyIdentifierTable['U+001D'] = { code: 'ArrowRight' };
      keyIdentifierTable['U+001E'] = { code: 'ArrowUp' };
      keyIdentifierTable['U+001F'] = { code: 'ArrowDown' };
  
      keyIdentifierTable['U+0001'] = { code: 'Home' }; // [USB: 0x4a] Fn + ArrowLeft
      keyIdentifierTable['U+0004'] = { code: 'End' }; // [USB: 0x4d] Fn + ArrowRight
      keyIdentifierTable['U+000B'] = { code: 'PageUp' }; // [USB: 0x4b] Fn + ArrowUp
      keyIdentifierTable['U+000C'] = { code: 'PageDown' }; // [USB: 0x4e] Fn + ArrowDown
    }
  
    //--------------------------------------------------------------------
    //
    // Location Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send location/keyLocation which
    // can be used to disambiguate keys.
  
    // locationTable[location][keyCode] -> keyInfo
    var locationTable = [];
    locationTable[LEFT] = {
      0x10: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0x11: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0x12: { code: 'AltLeft', location: LEFT } // [USB: 0xe2]
    };
    locationTable[RIGHT] = {
      0x10: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0x11: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0x12: { code: 'AltRight', location: RIGHT } // [USB: 0xe6]
    };
    locationTable[NUMPAD] = {
      0x0D: { code: 'NumpadEnter', location: NUMPAD } // [USB: 0x58]
    };
  
    mergeIf(locationTable[NUMPAD], 'moz', {
      0x6D: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0x6B: { code: 'NumpadAdd', location: NUMPAD } // [USB: 0x57]
    });
    mergeIf(locationTable[LEFT], 'moz-mac', {
      0xE0: { code: 'MetaLeft', location: LEFT } // [USB: 0xe3]
    });
    mergeIf(locationTable[RIGHT], 'moz-mac', {
      0xE0: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
    mergeIf(locationTable[RIGHT], 'moz-win', {
      0x5B: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
  
    mergeIf(locationTable[RIGHT], 'mac', {
      0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
    mergeIf(locationTable[NUMPAD], 'chrome-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD } // [USB: 0x53]
    });
  
    mergeIf(locationTable[NUMPAD], 'safari-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0xBB: { code: 'NumpadAdd', location: NUMPAD }, // [USB: 0x57]
      0xBD: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0xBE: { code: 'NumpadDecimal', location: NUMPAD }, // [USB: 0x63]
      0xBF: { code: 'NumpadDivide', location: NUMPAD } // [USB: 0x54]
    });
  
  
    //--------------------------------------------------------------------
    //
    // Key Values
    //
    //--------------------------------------------------------------------
  
    // Mapping from `code` values to `key` values. Values defined at:
    // https://w3c.github.io/uievents-key/
    // Entries are only provided when `key` differs from `code`. If
    // printable, `shiftKey` has the shifted printable character. This
    // assumes US Standard 101 layout
  
    var codeToKeyTable = {
      // Modifier Keys
      ShiftLeft: { key: 'Shift' },
      ShiftRight: { key: 'Shift' },
      ControlLeft: { key: 'Control' },
      ControlRight: { key: 'Control' },
      AltLeft: { key: 'Alt' },
      AltRight: { key: 'Alt' },
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' },
  
      // Whitespace Keys
      NumpadEnter: { key: 'Enter' },
      Space: { key: ' ' },
  
      // Printable Keys
      Digit0: { key: '0', shiftKey: ')' },
      Digit1: { key: '1', shiftKey: '!' },
      Digit2: { key: '2', shiftKey: '@' },
      Digit3: { key: '3', shiftKey: '#' },
      Digit4: { key: '4', shiftKey: '$' },
      Digit5: { key: '5', shiftKey: '%' },
      Digit6: { key: '6', shiftKey: '^' },
      Digit7: { key: '7', shiftKey: '&' },
      Digit8: { key: '8', shiftKey: '*' },
      Digit9: { key: '9', shiftKey: '(' },
      KeyA: { key: 'a', shiftKey: 'A' },
      KeyB: { key: 'b', shiftKey: 'B' },
      KeyC: { key: 'c', shiftKey: 'C' },
      KeyD: { key: 'd', shiftKey: 'D' },
      KeyE: { key: 'e', shiftKey: 'E' },
      KeyF: { key: 'f', shiftKey: 'F' },
      KeyG: { key: 'g', shiftKey: 'G' },
      KeyH: { key: 'h', shiftKey: 'H' },
      KeyI: { key: 'i', shiftKey: 'I' },
      KeyJ: { key: 'j', shiftKey: 'J' },
      KeyK: { key: 'k', shiftKey: 'K' },
      KeyL: { key: 'l', shiftKey: 'L' },
      KeyM: { key: 'm', shiftKey: 'M' },
      KeyN: { key: 'n', shiftKey: 'N' },
      KeyO: { key: 'o', shiftKey: 'O' },
      KeyP: { key: 'p', shiftKey: 'P' },
      KeyQ: { key: 'q', shiftKey: 'Q' },
      KeyR: { key: 'r', shiftKey: 'R' },
      KeyS: { key: 's', shiftKey: 'S' },
      KeyT: { key: 't', shiftKey: 'T' },
      KeyU: { key: 'u', shiftKey: 'U' },
      KeyV: { key: 'v', shiftKey: 'V' },
      KeyW: { key: 'w', shiftKey: 'W' },
      KeyX: { key: 'x', shiftKey: 'X' },
      KeyY: { key: 'y', shiftKey: 'Y' },
      KeyZ: { key: 'z', shiftKey: 'Z' },
      Numpad0: { key: '0' },
      Numpad1: { key: '1' },
      Numpad2: { key: '2' },
      Numpad3: { key: '3' },
      Numpad4: { key: '4' },
      Numpad5: { key: '5' },
      Numpad6: { key: '6' },
      Numpad7: { key: '7' },
      Numpad8: { key: '8' },
      Numpad9: { key: '9' },
      NumpadMultiply: { key: '*' },
      NumpadAdd: { key: '+' },
      NumpadComma: { key: ',' },
      NumpadSubtract: { key: '-' },
      NumpadDecimal: { key: '.' },
      NumpadDivide: { key: '/' },
      Semicolon: { key: ';', shiftKey: ':' },
      Equal: { key: '=', shiftKey: '+' },
      Comma: { key: ',', shiftKey: '<' },
      Minus: { key: '-', shiftKey: '_' },
      Period: { key: '.', shiftKey: '>' },
      Slash: { key: '/', shiftKey: '?' },
      Backquote: { key: '`', shiftKey: '~' },
      BracketLeft: { key: '[', shiftKey: '{' },
      Backslash: { key: '\\', shiftKey: '|' },
      BracketRight: { key: ']', shiftKey: '}' },
      Quote: { key: '\'', shiftKey: '"' },
      IntlBackslash: { key: '\\', shiftKey: '|' }
    };
  
    mergeIf(codeToKeyTable, 'mac', {
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' }
    });
  
    // Corrections for 'key' names in older browsers (e.g. FF36-, IE9, etc)
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.key#Key_values
    var keyFixTable = {
      Add: '+',
      Decimal: '.',
      Divide: '/',
      Subtract: '-',
      Multiply: '*',
      Spacebar: ' ',
      Esc: 'Escape',
      Nonconvert: 'NonConvert',
      Left: 'ArrowLeft',
      Up: 'ArrowUp',
      Right: 'ArrowRight',
      Down: 'ArrowDown',
      Del: 'Delete',
      Menu: 'ContextMenu',
      MediaNextTrack: 'MediaTrackNext',
      MediaPreviousTrack: 'MediaTrackPrevious',
      SelectMedia: 'MediaSelect',
      HalfWidth: 'Hankaku',
      FullWidth: 'Zenkaku',
      RomanCharacters: 'Romaji',
      Crsel: 'CrSel',
      Exsel: 'ExSel',
      Zoom: 'ZoomToggle'
    };
  
    //--------------------------------------------------------------------
    //
    // Exported Functions
    //
    //--------------------------------------------------------------------
  
  
    var codeTable = remap(keyCodeToInfoTable, 'code');
  
    try {
      var nativeLocation = nativeKeyboardEvent && ('location' in new KeyboardEvent(''));
    } catch (_) {}
  
    function keyInfoForEvent(event) {
      var keyCode = 'keyCode' in event ? event.keyCode : 'which' in event ? event.which : 0;
      var keyInfo = (function(){
        if (nativeLocation || 'keyLocation' in event) {
          var location = nativeLocation ? event.location : event.keyLocation;
          if (location && keyCode in locationTable[location]) {
            return locationTable[location][keyCode];
          }
        }
        if ('keyIdentifier' in event && event.keyIdentifier in keyIdentifierTable) {
          return keyIdentifierTable[event.keyIdentifier];
        }
        if (keyCode in keyCodeToInfoTable) {
          return keyCodeToInfoTable[keyCode];
        }
        return null;
      }());
  
      // TODO: Track these down and move to general tables
      if (0) {
        // TODO: Map these for newerish browsers?
        // TODO: iOS only?
        // TODO: Override with more common keyIdentifier name?
        switch (event.keyIdentifier) {
        case 'U+0010': keyInfo = { code: 'Function' }; break;
        case 'U+001C': keyInfo = { code: 'ArrowLeft' }; break;
        case 'U+001D': keyInfo = { code: 'ArrowRight' }; break;
        case 'U+001E': keyInfo = { code: 'ArrowUp' }; break;
        case 'U+001F': keyInfo = { code: 'ArrowDown' }; break;
        }
      }
  
      if (!keyInfo)
        return null;
  
      var key = (function() {
        var entry = codeToKeyTable[keyInfo.code];
        if (!entry) return keyInfo.code;
        return (event.shiftKey && 'shiftKey' in entry) ? entry.shiftKey : entry.key;
      }());
  
      return {
        code: keyInfo.code,
        key: key,
        location: keyInfo.location,
        keyCap: keyInfo.keyCap
      };
    }
  
    function queryKeyCap(code, locale) {
      code = String(code);
      if (!codeTable.hasOwnProperty(code)) return 'Undefined';
      if (locale && String(locale).toLowerCase() !== 'en-us') throw Error('Unsupported locale');
      var keyInfo = codeTable[code];
      return keyInfo.keyCap || keyInfo.code || 'Undefined';
    }
  
    if ('KeyboardEvent' in global && 'defineProperty' in Object) {
      (function() {
        function define(o, p, v) {
          if (p in o) return;
          Object.defineProperty(o, p, v);
        }
  
        define(KeyboardEvent.prototype, 'code', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return keyInfo ? keyInfo.code : '';
        }});
  
        // Fix for nonstandard `key` values (FF36-)
        if ('key' in KeyboardEvent.prototype) {
          var desc = Object.getOwnPropertyDescriptor(KeyboardEvent.prototype, 'key');
          Object.defineProperty(KeyboardEvent.prototype, 'key', { get: function() {
            var key = desc.get.call(this);
            return keyFixTable.hasOwnProperty(key) ? keyFixTable[key] : key;
          }});
        }
  
        define(KeyboardEvent.prototype, 'key', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
        }});
  
        define(KeyboardEvent.prototype, 'location', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
        }});
  
        define(KeyboardEvent.prototype, 'locale', { get: function() {
          return '';
        }});
      }());
    }
  
    if (!('queryKeyCap' in global.KeyboardEvent))
      global.KeyboardEvent.queryKeyCap = queryKeyCap;
  
    // Helper for IE8-
    global.identifyKey = function(event) {
      if ('code' in event)
        return;
  
      var keyInfo = keyInfoForEvent(event);
      event.code = keyInfo ? keyInfo.code : '';
      event.key = (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
      event.location = ('location' in event) ? event.location :
        ('keyLocation' in event) ? event.keyLocation :
        (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
      event.locale = '';
    };
  
  }(self));
  
(function ctKeyboard() {
    var keyPrefix = 'keyboard.';
    var setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };

    ct.keyboard = {
        string: '',
        lastKey: '',
        lastCode: '',
        alt: false,
        shift: false,
        ctrl: false,
        clear() {
            delete ct.keyboard.lastKey;
            delete ct.keyboard.lastCode;
            ct.keyboard.string = '';
            ct.keyboard.alt = false;
            ct.keyboard.shift = false;
            ct.keyboard.ctrl = false;
        },
        check: [],
        onDown(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            ct.keyboard.lastKey = e.key;
            ct.keyboard.lastCode = e.code;
            if (e.code) {
                setKey(e.code, 1);
            } else {
                setKey('Unknown', 1);
            }
            if (e.key) {
                if (e.key.length === 1) {
                    ct.keyboard.string += e.key;
                } else if (e.key === 'Backspace') {
                    ct.keyboard.string = ct.keyboard.string.slice(0, -1);
                } else if (e.key === 'Enter') {
                    ct.keyboard.string = '';
                }
            }
            e.preventDefault();
        },
        onUp(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            if (e.code) {
                setKey(e.code, 0);
            } else {
                setKey('Unknown', 0);
            }
            e.preventDefault();
        }
    };

    if (document.addEventListener) {
        document.addEventListener('keydown', ct.keyboard.onDown, false);
        document.addEventListener('keyup', ct.keyboard.onUp, false);
    } else {
        document.attachEvent('onkeydown', ct.keyboard.onDown);
        document.attachEvent('onkeyup', ct.keyboard.onUp);
    }
})();

(function fittoscreen(ct) {
    document.body.style.overflow = 'hidden';
    var canv = ct.pixiApp.view;
    const positionCanvas = function positionCanvas(mode, scale) {
        if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canv.style.transform = `translate(-50%, -50%) scale(${scale})`;
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        } else if (mode === 'expandViewport' || mode === 'expand' || mode === 'scaleFill') {
            canv.style.position = 'static';
            canv.style.top = 'unset';
            canv.style.left = 'unset';
        } else if (mode === 'scaleFit') {
            canv.style.transform = 'translate(-50%, -50%)';
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        }
    };
    var resize = function resize() {
        const {mode} = ct.fittoscreen;
        const pixelScaleModifier = ct.highDensity ? (window.devicePixelRatio || 1) : 1;
        const kw = window.innerWidth / ct.roomWidth,
              kh = window.innerHeight / ct.roomHeight;
        let k = Math.min(kw, kh);
        if (mode === 'fastScaleInteger') {
            k = k < 1 ? k : Math.floor(k);
        }
        var canvasWidth, canvasHeight,
            cameraWidth, cameraHeight;
        if (mode === 'expandViewport' || mode === 'expand') {
            canvasWidth = Math.ceil(window.innerWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(window.innerHeight * pixelScaleModifier);
            cameraWidth = window.innerWidth;
            cameraHeight = window.innerHeight;
        } else if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canvasWidth = Math.ceil(ct.roomWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(ct.roomHeight * pixelScaleModifier);
            cameraWidth = ct.roomWidth;
            cameraHeight = ct.roomHeight;
        } else if (mode === 'scaleFit' || mode === 'scaleFill') {
            if (mode === 'scaleFill') {
                canvasWidth = Math.ceil(ct.roomWidth * kw * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * kh * pixelScaleModifier);
                cameraWidth = window.innerWidth / k;
                cameraHeight = window.innerHeight / k;
            } else { // scaleFit
                canvasWidth = Math.ceil(ct.roomWidth * k * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * k * pixelScaleModifier);
                cameraWidth = ct.roomWidth;
                cameraHeight = ct.roomHeight;
            }
        }

        ct.pixiApp.renderer.resize(canvasWidth, canvasHeight);
        if (mode !== 'scaleFill' && mode !== 'scaleFit') {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier;
        } else {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier * k;
        }
        canv.style.width = Math.ceil(canvasWidth / pixelScaleModifier) + 'px';
        canv.style.height = Math.ceil(canvasHeight / pixelScaleModifier) + 'px';
        if (ct.camera) {
            ct.camera.width = cameraWidth;
            ct.camera.height = cameraHeight;
        }
        positionCanvas(mode, k);
    };
    var toggleFullscreen = function () {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow();
            win.setFullScreen(!win.isFullScreen());
            return;
        } catch (e) {
            void e; // Continue with web approach
        }
        var canvas = document.fullscreenElement ||
                     document.webkitFullscreenElement ||
                     document.mozFullScreenElement ||
                     document.msFullscreenElement,
            requester = document.getElementById('ct'),
            request = requester.requestFullscreen ||
                      requester.webkitRequestFullscreen ||
                      requester.mozRequestFullScreen ||
                      requester.msRequestFullscreen,
            exit = document.exitFullscreen ||
                   document.webkitExitFullscreen ||
                   document.mozCancelFullScreen ||
                   document.msExitFullscreen;
        if (!canvas) {
            var promise = request.call(requester);
            if (promise) {
                promise
                .catch(function fullscreenError(err) {
                    console.error('[ct.fittoscreen]', err);
                });
            }
        } else if (exit) {
            exit.call(document);
        }
    };
    var queuedFullscreen = function queuedFullscreen() {
        toggleFullscreen();
        document.removeEventListener('mouseup', queuedFullscreen);
        document.removeEventListener('keyup', queuedFullscreen);
        document.removeEventListener('click', queuedFullscreen);
    };
    var queueFullscreen = function queueFullscreen() {
        document.addEventListener('mouseup', queuedFullscreen);
        document.addEventListener('keyup', queuedFullscreen);
        document.addEventListener('click', queuedFullscreen);
    };
    window.addEventListener('resize', resize);
    ct.fittoscreen = resize;
    ct.fittoscreen.toggleFullscreen = queueFullscreen;
    var $mode = 'fastScale';
    Object.defineProperty(ct.fittoscreen, 'mode', {
        configurable: false,
        enumerable: true,
        set(value) {
            $mode = value;
        },
        get() {
            return $mode;
        }
    });
    ct.fittoscreen.mode = $mode;
    ct.fittoscreen.getIsFullscreen = function getIsFullscreen() {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow;
            return win.isFullScreen;
        } catch (e) {
            void e; // Continue with web approach
        }
        return document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen;
    };
})(ct);

/* global Howler Howl */
(function ctHowler() {
    ct.sound = {};
    ct.sound.howler = Howler;
    Howler.orientation(0, -1, 0, 0, 0, 1);
    Howler.pos(0, 0, 0);
    ct.sound.howl = Howl;

    var defaultMaxDistance = [2500][0] || 2500;
    ct.sound.useDepth = [false][0] === void 0 ?
        false :
        [false][0];
    ct.sound.manageListenerPosition = [true][0] === void 0 ?
        true :
        [true][0];

    /**
     * Detects if a particular codec is supported in the system
     * @param {string} type One of: "mp3", "mpeg", "opus", "ogg", "oga", "wav",
     * "aac", "caf", m4a", "mp4", "weba", "webm", "dolby", "flac".
     * @returns {boolean} true/false
     */
    ct.sound.detect = Howler.codecs;

    /**
     * Creates a new Sound object and puts it in resource object
     *
     * @param {string} name Sound's name
     * @param {object} formats A collection of sound files of specified extension,
     * in format `extension: path`
     * @param {string} [formats.ogg] Local path to the sound in ogg format
     * @param {string} [formats.wav] Local path to the sound in wav format
     * @param {string} [formats.mp3] Local path to the sound in mp3 format
     * @param {object} options An options object
     *
     * @returns {object} Sound's object
     */
    ct.sound.init = function init(name, formats, options) {
        options = options || {};
        var sounds = [];
        if (formats.wav && formats.wav.slice(-4) === '.wav') {
            sounds.push(formats.wav);
        }
        if (formats.mp3 && formats.mp3.slice(-4) === '.mp3') {
            sounds.push(formats.mp3);
        }
        if (formats.ogg && formats.ogg.slice(-4) === '.ogg') {
            sounds.push(formats.ogg);
        }
        // Do not use music preferences for ct.js debugger
        var isMusic = !navigator.userAgent.startsWith('ct.js') && options.music;
        var howl = new Howl({
            src: sounds,
            autoplay: false,
            preload: !isMusic,
            html5: isMusic,
            loop: options.loop,
            pool: options.poolSize || 5,

            onload: function () {
                if (!isMusic) {
                    ct.res.soundsLoaded++;
                }
            },
            onloaderror: function () {
                ct.res.soundsError++;
                howl.buggy = true;
                console.error('[ct.sound.howler] Oh no! We couldn\'t load ' +
                    (formats.wav || formats.mp3 || formats.ogg) + '!');
            }
        });
        if (isMusic) {
            ct.res.soundsLoaded++;
        }
        ct.res.sounds[name] = howl;
    };

    var set3Dparameters = (howl, opts, id) => {
        howl.pannerAttr({
            coneInnerAngle: opts.coneInnerAngle || 360,
            coneOuterAngle: opts.coneOuterAngle || 360,
            coneOuterGain: opts.coneOuterGain || 1,
            distanceModel: opts.distanceModel || 'linear',
            maxDistance: opts.maxDistance || defaultMaxDistance,
            refDistance: opts.refDistance || 1,
            rolloffFactor: opts.rolloffFactor || 1,
            panningModel: opts.panningModel || 'HRTF'
        }, id);
    };
    /**
     * Spawns a new sound and plays it.
     *
     * @param {string} name The name of a sound to be played
     * @param {object} [opts] Options object.
     * @param {Function} [cb] A callback, which is called when the sound finishes playing
     *
     * @returns {number} The ID of the created sound. This can be passed to Howler methods.
     */
    ct.sound.spawn = function spawn(name, opts, cb) {
        opts = opts || {};
        if (typeof opts === 'function') {
            cb = opts;
            opts = {};
        }
        var howl = ct.res.sounds[name];
        var id = howl.play();
        if (opts.loop) {
            howl.loop(true, id);
        }
        if (opts.volume !== void 0) {
            howl.volume(opts.volume, id);
        }
        if (opts.rate !== void 0) {
            howl.rate(opts.rate, id);
        }
        if (opts.x !== void 0 || opts.position) {
            if (opts.x !== void 0) {
                howl.pos(opts.x, opts.y || 0, opts.z || 0, id);
            } else {
                const copy = opts.position;
                howl.pos(copy.x, copy.y, opts.z || (ct.sound.useDepth ? copy.depth : 0), id);
            }
            set3Dparameters(howl, opts, id);
        }
        if (cb) {
            howl.once('end', cb, id);
        }
        return id;
    };

    /**
     * Stops playback of a sound, resetting its time to 0.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.stop = function stop(name, id) {
        if (ct.sound.playing(name, id)) {
            ct.res.sounds[name].stop(id);
        }
    };

    /**
     * Pauses playback of a sound or group, saving the seek of playback.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.pause = function pause(name, id) {
        ct.res.sounds[name].pause(id);
    };

    /**
     * Resumes a given sound, e.g. after pausing it.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.resume = function resume(name, id) {
        ct.res.sounds[name].play(id);
    };
    /**
     * Returns whether a sound is currently playing,
     * either an exact sound (found by its ID) or any sound of a given name.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {boolean} `true` if the sound is playing, `false` otherwise.
     */
    ct.sound.playing = function playing(name, id) {
        return ct.res.sounds[name].playing(id);
    };
    /**
     * Preloads a sound. This is usually applied to music files before playing
     * as they are not preloaded by default.
     *
     * @param {string} name The name of a sound
     * @returns {void}
     */
    ct.sound.load = function load(name) {
        ct.res.sounds[name].load();
    };


    /**
     * Changes/returns the volume of the given sound.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If empty, will return the existing volume.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {number} The current volume of the sound.
     */
    ct.sound.volume = function volume(name, volume, id) {
        return ct.res.sounds[name].volume(volume, id);
    };

    /**
     * Fades a sound to a given volume. Can affect either a specific instance or the whole group.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} newVolume The new volume from `0.0` to `1.0`.
     * @param {number} duration The duration of transition, in milliseconds.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {void}
     */
    ct.sound.fade = function fade(name, newVolume, duration, id) {
        if (ct.sound.playing(name, id)) {
            var howl = ct.res.sounds[name],
                oldVolume = id ? howl.volume(id) : howl.volume;
            try {
                howl.fade(oldVolume, newVolume, duration, id);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('Could not reliably fade a sound, reason:', e);
                ct.sound.volume(name, newVolume, id);
            }
        }
    };

    /**
     * Moves the 3D listener to a new position.
     *
     * @see https://github.com/goldfire/howler.js#posx-y-z
     *
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.moveListener = function moveListener(x, y, z) {
        Howler.pos(x, y, z || 0);
    };

    /**
     * Moves a 3D sound to a new location
     *
     * @param {string} name The name of a sound to move
     * @param {number} id The ID of a particular sound.
     * Pass `null` if you want to affect all the sounds of a given name.
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.position = function position(name, id, x, y, z) {
        if (ct.sound.playing(name, id)) {
            var howl = ct.res.sounds[name],
                oldPosition = howl.pos(id);
            howl.pos(x, y, z || oldPosition[2], id);
        }
    };

    /**
     * Get/set the global volume for all sounds, relative to their own volume.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If omitted, will return the current global volume.
     *
     * @returns {number} The current volume.
     */
    ct.sound.globalVolume = Howler.volume.bind(Howler);

    ct.sound.exists = function exists(name) {
        return (name in ct.res.sounds);
    };
})();

/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
ct.random = function random(x) {
    return Math.random() * x;
};
ct.u.ext(ct.random, {
    dice(...variants) {
        return variants[Math.floor(Math.random() * variants.length)];
    },
    histogram(...histogram) {
        const coeffs = [...histogram];
        let sumCoeffs = 0;
        for (let i = 0; i < coeffs.length; i++) {
            sumCoeffs += coeffs[i];
            if (i > 0) {
                coeffs[i] += coeffs[i - 1];
            }
        }
        const bucketPosition = Math.random() * sumCoeffs;
        var i;
        for (i = 0; i < coeffs.length; i++) {
            if (coeffs[i] > bucketPosition) {
                break;
            }
        }
        return i / coeffs.length + Math.random() / coeffs.length;
    },
    optimistic(exp) {
        return 1 - ct.random.pessimistic(exp);
    },
    pessimistic(exp) {
        exp = exp || 2;
        return Math.random() ** exp;
    },
    range(x1, x2) {
        return x1 + Math.random() * (x2 - x1);
    },
    deg() {
        return Math.random() * 360;
    },
    coord() {
        return [Math.floor(Math.random() * ct.width), Math.floor(Math.random() * ct.height)];
    },
    chance(x, y) {
        if (y) {
            return (Math.random() * y < x);
        }
        return (Math.random() * 100 < x);
    },
    from(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    // Mulberry32, by bryc from https://stackoverflow.com/a/47593316
    createSeededRandomizer(a) {
        return function seededRandomizer() {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
});
{
    const handle = {};
    handle.currentRootRandomizer = ct.random.createSeededRandomizer(456852);
    ct.random.seeded = function seeded() {
        return handle.currentRootRandomizer();
    };
    ct.random.setSeed = function setSeed(seed) {
        handle.currentRootRandomizer = ct.random.createSeededRandomizer(seed);
    };
    ct.random.setSeed(9323846264);
}
/**
 * @typedef {ITextureOptions}
 * @property {} []
 */

(function resAddon(ct) {
    const loadingScreen = document.querySelector('.ct-aLoadingScreen'),
          loadingBar = loadingScreen.querySelector('.ct-aLoadingBar');
    const dbFactory = window.dragonBones ? dragonBones.PixiFactory.factory : null;
    /**
     * A utility object that manages and stores textures and other entities
     * @namespace
     */
    ct.res = {
        sounds: {},
        textures: {},
        skeletons: {},
        /**
         * Loads and executes a script by its URL
         * @param {string} url The URL of the script file, with its extension.
         * Can be relative or absolute.
         * @returns {Promise<void>}
         * @async
         */
        loadScript(url = ct.u.required('url', 'ct.res.loadScript')) {
            var script = document.createElement('script');
            script.src = url;
            const promise = new Promise((resolve, reject) => {
                script.onload = () => {
                    resolve();
                };
                script.onerror = () => {
                    reject();
                };
            });
            document.getElementsByTagName('head')[0].appendChild(script);
            return promise;
        },
        /**
         * Loads an individual image as a named ct.js texture.
         * @param {string} url The path to the source image.
         * @param {string} name The name of the resulting ct.js texture
         * as it will be used in your code.
         * @param {ITextureOptions} textureOptions Information about texture's axis
         * and collision shape.
         * @returns {Promise<Array<PIXI.Texture>>}
         */
        loadTexture(url = ct.u.required('url', 'ct.res.loadTexture'), name = ct.u.required('name', 'ct.res.loadTexture'), textureOptions = {}) {
            const loader = new PIXI.Loader();
            loader.add(url, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load image ${url}`));
                });
            })
            .then(resources => {
                const tex = [resources[url].texture];
                tex.shape = tex[0].shape = textureOptions.shape || {};
                tex[0].defaultAnchor = new PIXI.Point(
                    textureOptions.anchor.x || 0,
                    textureOptions.anchor.x || 0
                );
                ct.res.textures[name] = tex;
                return tex;
            });
        },
        /**
         * Loads a skeleton made in DragonBones into the game
         * @param {string} ske Path to the _ske.json file that contains
         * the armature and animations.
         * @param {string} tex Path to the _tex.json file that describes the atlas
         * with a skeleton's textures.
         * @param {string} png Path to the _tex.png atlas that contains
         * all the textures of the skeleton.
         * @param {string} name The name of the skeleton as it will be used in ct.js game
         */
        loadDragonBonesSkeleton(ske, tex, png, name = ct.u.required('name', 'ct.res.loadDragonBonesSkeleton')) {
            const dbf = dragonBones.PixiFactory.factory;
            const loader = new PIXI.Loader();
            loader
                .add(ske, ske)
                .add(tex, tex)
                .add(png, png);
            return new Promise((resolve, reject) => {
                loader.load(() => {
                    resolve();
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load skeleton with _ske.json: ${ske}, _tex.json: ${tex}, _tex.png: ${png}.`));
                });
            }).then(() => {
                dbf.parseDragonBonesData(loader.resources[ske].data);
                dbf.parseTextureAtlasData(
                    loader.resources[tex].data,
                    loader.resources[png].texture
                );
                // eslint-disable-next-line id-blacklist
                ct.res.skeletons[name] = loader.resources[ske].data;
            });
        },
        /**
         * Loads a Texture Packer compatible .json file with its source image,
         * adding ct.js textures to the game.
         * @param {string} url The path to the JSON file that describes the atlas' textures.
         * @returns {Promise<Array<string>>} A promise that resolves into an array
         * of all the loaded textures.
         */
        loadAtlas(url = ct.u.required('url', 'ct.res.loadAtlas')) {
            const loader = new PIXI.Loader();
            loader.add(url, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load atlas ${url}`));
                });
            })
            .then(resources => {
                const sheet = resources[url].spritesheet;
                for (const animation in sheet.animations) {
                    const tex = sheet.animations[animation];
                    const animData = sheet.data.animations;
                    for (let i = 0, l = animData[animation].length; i < l; i++) {
                        const a = animData[animation],
                              f = a[i];
                        tex[i].shape = sheet.data.frames[f].shape;
                    }
                    tex.shape = tex[0].shape || {};
                    ct.res.textures[animation] = tex;
                }
                return Object.keys(sheet.animations);
            });
        },
        /**
         * Loads a bitmap font by its XML file.
         * @param {string} url The path to the XML file that describes the bitmap fonts.
         * @param {string} name The name of the font.
         * @returns {Promise<string>} A promise that resolves into the font's name
         * (the one you've passed with `name`).
         */
        loadBitmapFont(url = ct.u.required('url', 'ct.res.loadBitmapFont'), name = ct.u.required('name', 'ct.res.loadBitmapFont')) {
            const loader = new PIXI.Loader();
            loader.add(name, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load bitmap font ${url}`));
                });
            });
        },
        loadGame() {
            // !! This method is intended to be filled by ct.IDE and be executed
            // exactly once at game startup. Don't put your code here.
            const changeProgress = percents => {
                loadingScreen.setAttribute('data-progress', percents);
                loadingBar.style.width = percents + '%';
            };

            const atlases = [["./img/a0.json","./img/a1.json"]][0];
            const tiledImages = [{"BG":{"source":"./img/t0.png","shape":{"type":"rect","top":0,"bottom":256,"left":0,"right":256},"anchor":{"x":0,"y":0}},"cloud":{"source":"./img/t1.png","shape":{"type":"rect","top":0,"bottom":149,"left":0,"right":272},"anchor":{"x":0,"y":0}},"bg_castle":{"source":"./img/t2.png","shape":{"type":"rect","top":0,"bottom":256,"left":0,"right":256},"anchor":{"x":0,"y":0}},"bg_shroom":{"source":"./img/t3.png","shape":{"type":"rect","top":0,"bottom":512,"left":0,"right":1024},"anchor":{"x":0,"y":0}},"bg_desert":{"source":"./img/t4.png","shape":{"type":"rect","top":0,"bottom":512,"left":0,"right":1024},"anchor":{"x":0,"y":0}},"castlebg":{"source":"./img/t5.png","shape":{"type":"rect","top":0,"bottom":1080,"left":0,"right":1920},"anchor":{"x":0,"y":0}},"scull":{"source":"./img/t6.png","shape":{"type":"rect","top":0,"bottom":533,"left":0,"right":800},"anchor":{"x":0,"y":0}},"zakatBG":{"source":"./img/t7.png","shape":{"type":"rect","top":0,"bottom":1080,"left":0,"right":1920},"anchor":{"x":0,"y":0}}}][0];
            const sounds = [[{"name":"point","wav":false,"mp3":"./snd/7fLJ5PjRMP1cjn.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"player_death","wav":false,"mp3":"./snd/Tckjg9j7CDc42w.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"enemy_death","wav":false,"mp3":"./snd/TmWhQhQn8gGGM6.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"round","wav":false,"mp3":"./snd/r7gMjWfLtHGrnf.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"hearth","wav":false,"mp3":"./snd/CfHGpRCJ2Tb74d.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"jump","wav":false,"mp3":"./snd/gtWLMHJ7CB2Jcz.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"checkpoint","wav":false,"mp3":"./snd/bkMngjmkCPMhPj.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"ring","wav":false,"mp3":"./snd/wTQr79kTCwt7jD.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"bear_die","wav":false,"mp3":"./snd/mBQn497rRHctqn.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"shroom","wav":false,"mp3":"./snd/TQ3kcn5PPdCWcc.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"sliz","wav":false,"mp3":"./snd/3NkgHdq8rhkcTP.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"fireball","wav":false,"mp3":"./snd/mhb8TKfWKdMBq7.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"lvl3","wav":false,"mp3":"./snd/cp7QcWBPpckTcW.mp3","ogg":false,"poolSize":10,"isMusic":true},{"name":"lvl3_fight","wav":false,"mp3":"./snd/NB3WwFCB8MNhmp.mp3","ogg":false,"poolSize":10,"isMusic":true},{"name":"dress","wav":false,"mp3":"./snd/GdNPNtCqG2BTgm.mp3","ogg":false,"poolSize":10,"isMusic":true},{"name":"lvl6","wav":false,"mp3":"./snd/hmqcnp7GhnmgLg.mp3","ogg":false,"poolSize":10,"isMusic":true},{"name":"lvl2","wav":false,"mp3":"./snd/NRNzHkBngdGJ52.mp3","ogg":false,"poolSize":10,"isMusic":true},{"name":"lvl4","wav":false,"mp3":"./snd/bDkTLkWq5G7Gnw.mp3","ogg":false,"poolSize":10,"isMusic":true},{"name":"lvl1","wav":false,"mp3":"./snd/rMnh79w8dTH2b3.mp3","ogg":false,"poolSize":10,"isMusic":true},{"name":"broke","wav":false,"mp3":"./snd/gfMgM5RCtQhpwQ.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"dragon","wav":false,"mp3":"./snd/ndJrLc7n9bKMc1.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"drFire","wav":false,"mp3":"./snd/Nqm39bh24jnJ6F.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"finalFight","wav":false,"mp3":"./snd/N5WCb39RcCcFBF.mp3","ogg":false,"poolSize":10,"isMusic":true},{"name":"gameOver","wav":false,"mp3":"./snd/BM6kmPW35mRK6r.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"button","wav":false,"mp3":"./snd/cQ97Wp1MWNQw8W.mp3","ogg":false,"poolSize":5,"isMusic":false}]][0];
            const bitmapFonts = [{}][0];
            const dbSkeletons = [[]][0]; // DB means DragonBones

            if (sounds.length && !ct.sound) {
                throw new Error('[ct.res] No sound system found. Make sure you enable one of the `sound` catmods. If you don\'t need sounds, remove them from your ct.js project.');
            }

            const totalAssets = atlases.length;
            let assetsLoaded = 0;
            const loadingPromises = [];

            loadingPromises.push(...atlases.map(atlas =>
                ct.res.loadAtlas(atlas)
                .then(texturesNames => {
                    assetsLoaded++;
                    changeProgress(assetsLoaded / totalAssets * 100);
                    return texturesNames;
                })));

            for (const name in tiledImages) {
                loadingPromises.push(ct.res.loadTexture(
                    tiledImages[name].source,
                    name,
                    {
                        anchor: tiledImages[name].anchor,
                        shape: tiledImages[name].shape
                    }
                ));
            }
            for (const font in bitmapFonts) {
                loadingPromises.push(ct.res.loadBitmapFont(bitmapFonts[font], font));
            }
            for (const skel of dbSkeletons) {
                ct.res.loadDragonBonesSkeleton(...skel);
            }

            for (const sound of sounds) {
                ct.sound.init(sound.name, {
                    wav: sound.wav || false,
                    mp3: sound.mp3 || false,
                    ogg: sound.ogg || false
                }, {
                    poolSize: sound.poolSize,
                    music: sound.isMusic
                });
            }

            /*@res@*/
            

            Promise.all(loadingPromises)
            .then(() => {
                ct.pointer.setupListeners();
Object.defineProperty(ct.templates.Copy.prototype, 'cgroup', {
    set: function (value) {
        this.$cgroup = value;
    },
    get: function () {
        return this.$cgroup;
    }
});
Object.defineProperty(ct.templates.Copy.prototype, 'moveContinuous', {
    value: function (cgroup, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
        }
        return ct.place.moveAlong(this, this.direction, this.speed * ct.delta, cgroup, precision);
    }
});

Object.defineProperty(ct.templates.Copy.prototype, 'moveContinuousByAxes', {
    value: function (cgroup, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
        }
        return ct.place.moveByAxes(
            this,
            this.hspeed * ct.delta,
            this.vspeed * ct.delta,
            cgroup,
            precision
        );
    }
});

Object.defineProperty(ct.templates.Tilemap.prototype, 'enableCollisions', {
    value: function (cgroup) {
        ct.place.enableTilemapCollisions(this, cgroup);
    }
});

                loadingScreen.classList.add('hidden');
                ct.pixiApp.ticker.add(ct.loop);
                ct.rooms.forceSwitch(ct.rooms.starting);
            })
            .catch(console.error);
        },
        /*
         * Gets a pixi.js texture from a ct.js' texture name,
         * so that it can be used in pixi.js objects.
         * @param {string|-1} name The name of the ct.js texture, or -1 for an empty texture
         * @param {number} [frame] The frame to extract
         * @returns {PIXI.Texture|Array<PIXI.Texture>} If `frame` was specified,
         * returns a single PIXI.Texture. Otherwise, returns an array
         * with all the frames of this ct.js' texture.
         *
         * @note Formatted as a non-jsdoc comment as it requires a better ts declaration
         * than the auto-generated one
         */
        getTexture(name, frame) {
            if (frame === null) {
                frame = void 0;
            }
            if (name === -1) {
                if (frame !== void 0) {
                    return PIXI.Texture.EMPTY;
                }
                return [PIXI.Texture.EMPTY];
            }
            if (!(name in ct.res.textures)) {
                throw new Error(`Attempt to get a non-existent texture ${name}`);
            }
            const tex = ct.res.textures[name];
            if (frame !== void 0) {
                return tex[frame];
            }
            return tex;
        },
        /*
         * Returns the collision shape of the given texture.
         * @param {string|-1} name The name of the ct.js texture, or -1 for an empty collision shape
         * @returns {object}
         *
         * @note Formatted as a non-jsdoc comment as it requires a better ts declaration
         * than the auto-generated one
         */
        getTextureShape(name) {
            if (name === -1) {
                return {};
            }
            if (!(name in ct.res.textures)) {
                throw new Error(`Attempt to get a shape of a non-existent texture ${name}`);
            }
            return ct.res.textures[name].shape;
        },
        /**
         * Creates a DragonBones skeleton, ready to be added to your copies.
         * @param {string} name The name of the skeleton asset
         * @param {string} [skin] Optional; allows you to specify the used skin
         * @returns {object} The created skeleton
         */
        makeSkeleton(name, skin) {
            const r = ct.res.skeletons[name],
                  skel = dbFactory.buildArmatureDisplay('Armature', r.name, skin);
            skel.ctName = name;
            skel.on(dragonBones.EventObject.SOUND_EVENT, function skeletonSound(event) {
                if (ct.sound.exists(event.name)) {
                    ct.sound.spawn(event.name);
                } else {
                    // eslint-disable-next-line no-console
                    console.warn(`Skeleton ${skel.ctName} tries to play a non-existing sound ${event.name} at animation ${skel.animation.lastAnimationName}`);
                }
            });
            return skel;
        }
    };

    ct.res.loadGame();
})(ct);

/**
 * A collection of content that was made inside ct.IDE.
 * @type {any}
 */
ct.content = JSON.parse(["{}"][0] || '{}');

var inGameRoomStart = function (room) {
    if(!ct.startLives) {
        ct.startLives = 3;
    }
    room.lives = ct.startLives;
    room.crystals = 0;
    room.crystalsTotal = ct.templates.list['GreenCrystal'].length;
    room.kill = false;
    room.immortal = false;
    ct.templates.copy('CrystalCounter', 0, 0);
    ct.templates.copy('HeartsWidget', 0, 0);
    ct.templates.copy('RingWidget', 0, 0);
};;
var PlayerDead = function (player, ct) {     
     if (ct.room.immortal == false) {
        ct.room.kill = true;
        ct.sound.spawn('player_death');  
        player.hspd = 0;
        player.vspd = 0;
        ct.camera.shake = 4;
        player.x = player.savedX;
        player.y = player.savedY; 
        //отнять одну жизнь
        ct.room.lives--;
         
        ct.room.immortal = true;
        ct.timer.add(4000, 'dead').then(() => {
            ct.room.immortal = false;
        })
     }
     if (ct.room.lives <= 0) {
         // Перезапустить комнату: перейти к комнате с текущим названием
         ct.rooms.switch(ct.room.name);
     }
  
    return;
};;
var EnemyKill = function (enemy, ct, tex) {
    var player = ct.place.meet(enemy, enemy.x, enemy.y, 'Katya')
    if (player) {
        player.vspd = player.jumpSpeed * 1.3;
        if(ct.room.kill == false && (enemy.getGlobalPosition().y - player.getGlobalPosition().y) > enemy.height / 2) {
            enemy.cgroup = undefined;
            enemy.tex = tex;
            ct.sound.spawn('enemy_death');  
                
            ct.timer.add(500, 'kill').then(() => {
            enemy.kill = true;
            })
        }
    }

    var fireball = ct.place.meet(enemy, enemy.x, enemy.y, 'fireball')
    if (fireball) {
        enemy.cgroup = undefined;
        enemy.tex = tex;
        ct.sound.spawn('enemy_death');  
            
        ct.timer.add(500, 'kill').then(() => {
            enemy.kill = true;
        })
       fireball.kill = true;
       ct.emitters.fire('fire', fireball.x, fireball.y);
    } 
};;
var PauseHandler = function () {
    if (ct.actions.Pause.pressed) {
        if (!ct.room.paused) {
            ct.room.paused = true;

            ct.pixiApp.ticker.speed = 0;
            ct.room.alpha = 0.5;

            ct.room.unpauseHint = ct.templates.copy('PauseHint', ct.room.player.x, ct.room.player.y);
            ct.room.player.speed = 0;
            
            ct.sound.pause(ct.room.sound)
        } else {
            ct.room.paused = false;

            ct.pixiApp.ticker.speed = 1; // `1` is the normal speed
            ct.room.player.speed = ct.room.player.constSpeed

            ct.room.alpha = 1;
            ct.room.unpauseHint.kill = true; // Remove the copy

            ct.sound.resume(ct.room.sound)
        }
    }

    if (ct.actions.Restart.pressed) {
        ct.sound.stop(ct.room.sound)
        ct.rooms.switch(ct.room.name)
    }


    if(ct.actions.NextLvl.pressed && ct.room.nextRoom) {
        ct.sound.stop(ct.room.sound)
        ct.rooms.switch(ct.room.nextRoom);
    }

     if(ct.actions.PrevLvl.pressed && ct.room.prevRoom) {
        ct.sound.stop(ct.room.sound)
        ct.rooms.switch(ct.room.prevRoom);
    }
};
var JumpBlock = function(entity) {
    //столкновение с типом шаблона
    var player = ct.place.meet(entity, entity.x, entity.y, 'Katya');
    if (player) {
        entity.cgroup = undefined;
    } else {
        entity.cgroup = 'Solid';
    }
};
