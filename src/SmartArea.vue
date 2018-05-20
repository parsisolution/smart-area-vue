<template>
    <div class="sa-container" ref="container">
        <div class="backdrop" ref="highlight_backdrop" v-show="_type==='textarea'">
            <div class="highlights" ref="highlight" v-html="highlightedText"></div>
        </div>
        <div class="backdrop" ref="tracking_backdrop">
            <div ref="contents" :style="backdropStyle">
                <span v-html="beginningText"></span><span ref="tracking" v-html="trackingText"></span>
            </div>
        </div>
        <div ref="dropdown" class="sa-dropdown" v-show="showDropdown"
             :style="dropdownStyle">
            <input class="form-control" type="text" v-show="false">
            <ul class="dropdown-menu" role="menu" style="position:static">
                <li v-for="suggest in suggests">
                    <a href="#" :class="dropdownItemClass(suggest.index)"
                       @click.prevent="dropdownItemSelect(suggest.index)" style="overflow: hidden">
                        <span class="float-left" style="color: inherit" v-html="suggest.display"></span>
                        <i class="float-right" :style="{color: suggest.color, 'font-style': 'normal'}">■</i>
                    </a>
                </li>
            </ul>
        </div>
        <textarea ref="textarea" v-if="_type==='textarea'" :name="name" v-model="text" :class="innerClasses" :cols="cols" :rows="rows"
                  :placeholder="placeholder" @scroll.passive="onScroll" @mouseup="onMouseUp" @mousemove="onMouseMove"
                  @keydown="onKeyDown" @keyup="onKeyUp" @click="moveDropdown" @focus="moveDropdown"
                  spellcheck="false" :disabled="_disabled" :required="_required"></textarea>
        <input type="text" ref="input" v-if="_type==='input'" :name="name" v-model="text" :class="innerClasses"
               :placeholder="placeholder" @scroll.passive="onScroll" @mouseup="onMouseUp" @keydown="onKeyDown"
               @keyup="onKeyUp" @click="moveDropdown" @focus="moveDropdown" :disabled="_disabled" :required="_required">
        <hr :style="hrStyle">
    </div>
</template>

<script>
    const Autocomplete = require('autocomplete2');
    const Key = require('./KeyCodes');

    export default {
        name: "smart-area",

        props: {
            type: String,
            name: String,
            options: {},
            value: {
                type: String,
                default: '',
            },
            disabled: {},
            required: {},
            innerClasses: {},
            cols: {},
            rows: {},
            resize: {},
            placeholder: {},
            inheritFont: {
                default: true,
            },
        },

        data() {
            return {
                text: '',
                beginningText: '',
                trackingText: '',
                showDropdown: false,
                dropdownStyle: {},
                suggests: [],
                selected: 0,
                lastPosition: 0,
                hrStyle: {
                    border: 0,
                    display: "block",
                    visibility: "hidden",
                    margin: 0,
                },
            }
        },

        computed: {
            _type() {
                if (this.$options.input_type)
                    return this.$options.input_type;
                if (this.type)
                    return this.type;

                return 'textarea';
            },
            _disabled() {
                return typeof this.disabled === 'string' ? true : !!this.disabled;
            },
            _required() {
                return typeof this.required === 'string' ? true : !!this.required;
            },
            element() {
                return this._type === 'textarea' ? this.$refs.textarea : this.$refs.input;
            },
            isFirefox() {
                return window.mozInnerScreenX != null;
            },
            isIE() {
                let ua = window.navigator.userAgent.toLowerCase();
                return !!ua.match(/msie|trident\/7|edge/);
            },
            isIOS() {
                let ua = window.navigator.userAgent.toLowerCase();
                let isWinPhone = ua.indexOf('windows phone') !== -1;
                return !isWinPhone && !!ua.match(/ipad|iphone|ipod/);
            },
            highlightedText() {
                let text = this.text
                    .replace(/\n$/g, '\n\n');

                let highlight = this.options.highlight;
                for (let rule of highlight) {
                    if ((!rule.search) && typeof rule.list === 'object') {
                        escape = string => {
                            return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
                        };
                        for (let i = 0; i < rule.list.length; i++)
                            rule.list[i] = escape(rule.list[i]);
                        rule.search = new RegExp(rule.list.join('|'), 'gi');
                    }
                    if (rule.replace) {
                        rule.before = rule.before ? rule.before : '';
                        rule.after = rule.after ? rule.after : '';
                        text = text.replace(rule.search, `${rule.before}<span class="${rule.class}">${rule.replace}</span>${rule.after}`);
                    } else
                        text = text.replace(rule.search, `<span class="${rule.class}">$&</span>`);
                }

                if (this.isIE) {
                    // IE wraps whitespace differently in a div vs textarea, this fixes it
                    text = text.replace(/ /g, ' <wbr>');
                }

                return text;
            },
            backdropStyle() {
                let style = {};
                if (this._type === 'input')
                    style.visibility = 'hidden';
                return style;
            },
            lineHeight() {
                let target = this.element;
                let computed = window.getComputedStyle ? window.getComputedStyle(target) : target.currentStyle;  // currentStyle for IE < 9
                return parseInt(computed.lineHeight);
            },
            autocomplete() {
                return new Autocomplete(this.options.autocomplete);
            }
        },

        watch: {
            value (newVal, oldVal) {
                if (newVal !== oldVal) {
                    this.text = newVal
                }
            },
            text (newVal, oldVal) {
                if (newVal !== oldVal) {
                    this.$emit('input', newVal)
                }
            }
        },

        mounted() {
            this.text = this.value;
            this.element.style.position = 'absolute';
            this.element.style.display = 'block';
            if (this.inheritFont)
                this.element.style.font = 'inherit';
            if (this._type === 'textarea') {
                this.element.style['-webkit-text-fill-color'] = 'transparent';
                this.element.style.color = 'transparent';
                this.element.style['caret-color'] = '#000';
                this.element.style.resize = this.resize;
            }

            this.style_element(this.$refs.highlight_backdrop, 1);
            this.style_element(this.$refs.tracking_backdrop, 2);

            this.$refs.tracking_backdrop.style.backgroundColor = 'transparent';
            this.$refs.tracking_backdrop.style.color = 'transparent';

            this.element.style.zIndex = 3;
            if (this._type === 'textarea')
                this.element.style['background-color'] = 'transparent';

            let computed = window.getComputedStyle ? window.getComputedStyle(this.element) : this.element.currentStyle;  // currentStyle for IE < 9
            this.hrStyle['padding-top'] = computed['height'];

            this.moveDropdown();

            this.onMouseMove();
        },

        methods: {
            style_element(element, zIndex) {
                this.copyProperties(this.element, element);

                let style = element.style;
                if (this.isIOS) {
                    // iOS adds 3px of (unremovable) padding to the left and right of a textarea, so adjust highlights div to match
                    style.paddingLeft = (parseInt(style.paddingLeft) + 3) + 'px';
                    style.paddingRight = (parseInt(style.paddingRight) + 3) + 'px';
                }

                style.zIndex = zIndex;
                style.borderColor = 'transparent';
                style.overflow = 'auto';
                style.pointerEvents = 'none';
                let target = this.element;
                let computed = window.getComputedStyle ? window.getComputedStyle(target) : target.currentStyle;  // currentStyle for IE < 9
                if (!this.isFirefox) {
                    style.width = target.style.width = computed.width;
                    style.height = target.style.height = computed.height;
                } else {
                    this.$refs.highlight.style.marginBottom = this.$refs.contents.style.marginBottom = computed.paddingBottom;
                }
            },
            onScroll(event) {
                this.$refs.highlight_backdrop.scrollTop = this.$refs.tracking_backdrop.scrollTop = event.target.scrollTop;
                this.$refs.highlight_backdrop.scrollLeft = this.$refs.tracking_backdrop.scrollLeft = event.target.scrollLeft;
                this.showDropdown = false;
            },
            onMouseUp() {
                this.onMouseMove();
                setTimeout(this.onMouseMove, 200);
            },
            onMouseMove() {
                let target = this.element;
                let computed = window.getComputedStyle ? window.getComputedStyle(target) : target.currentStyle;  // currentStyle for IE < 9
                if (target.style.width !== target.oldwidth || target.style.height !== target.oldheight) {
                    let width = 0, height = 0;
                    if (this.isFirefox && target.style.width !== computed.width) {
                        width = computed.width;
                    } else {
                        width = target.style.width;
                    }
                    if (this.isFirefox && target.style.height !== computed.height) {
                        height = computed.height;
                    } else {
                        height = target.style.height;
                    }
                    target.oldwidth = width;
                    target.oldheight = height;
                    this.$refs.highlight_backdrop.style.width = this.$refs.tracking_backdrop.style.width = width;
                    this.$refs.highlight_backdrop.style.height = this.$refs.tracking_backdrop.style.height = height;
                }
            },
            copyProperties(source, target) {
                // We'll copy the properties below into the mirror div.
                // Note that some browsers, such as Firefox, do not concatenate properties
                // into their shorthand (e.g. padding-top, padding-bottom etc. -> padding),
                // so we have to list every single property explicitly.
                const properties = [
                    'direction',  // RTL support
                    'boxSizing',
                    'width',  // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
                    'height',
                    'overflowX',
                    'overflowY',  // copy the scrollbar for IE

                    'backgroundColor',

                    'borderTopWidth',
                    'borderRightWidth',
                    'borderBottomWidth',
                    'borderLeftWidth',
                    'borderTopStyle',
                    'borderRightStyle',
                    'borderBottomStyle',
                    'borderLeftStyle',

                    'paddingTop',
                    'paddingRight',
                    'paddingBottom',
                    'paddingLeft',

                    // https://developer.mozilla.org/en-US/docs/Web/CSS/font
                    'fontStyle',
                    'fontVariant',
                    'fontWeight',
                    'fontStretch',
                    'fontSize',
                    'fontSizeAdjust',
                    'lineHeight',
                    'fontFamily',

                    'textAlign',
                    'textTransform',
                    'textIndent',
                    'textDecoration',  // might not make a difference, but better be safe

                    'letterSpacing',
                    'wordSpacing',

                    // 'wordWrap',

                    'tabSize',
                    'MozTabSize'
                ];

                let style = target.style;
                let computed = window.getComputedStyle ? window.getComputedStyle(source) : source.currentStyle;  // currentStyle for IE < 9

                // Default textarea styles
                style.whiteSpace = 'pre-wrap';
                if (this._type === 'textarea')
                    style.wordWrap = 'break-word';  // only for textarea-s

                // Position off-screen
                style.position = 'absolute';  // required to return coordinates properly

                // Transfer the element's properties to the div
                properties.forEach(prop => {
                    if (this._type === 'input' && prop === 'lineHeight') {
                        // Special case for <input>s because text is rendered centered and line height may be != height
                        style.lineHeight = computed.height;
                    } else {
                        style[prop] = computed[prop];
                    }
                });

                if (this.isFirefox) {
                    // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
                    if (source.scrollHeight > parseInt(computed.height))
                        style.overflowY = 'scroll';
                } else {
                    // style.overflow = 'hidden';  // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
                }
            },
            splitText(position) {
                if (position !== this.lastPosition) {
                    this.lastPosition = position;
                    this.autocomplete.suggest(this.text, position)
                        .then(suggests => {
                            this.suggests = suggests.map((element, index) => {
                                return {index, display: element.d, trigger: element.t, color: element.c};
                            });
                            this.showDropdown = true;
                        })
                        .catch(error => this.showDropdown = false);
                    this.selected = 0;
                }

                this.beginningText = this.text.substring(0, position);
                // The second special handling for input type="text" vs textarea:
                // spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
                if (this._type === 'input')
                    this.beginningText = this.beginningText.replace(/\s/g, '\u00a0');

                // let span = document.createElement('span');
                // Wrapping must be replicated *exactly*, including when a long word gets
                // onto the next line, with whitespace at the end of the line before (#7).
                // The  *only* reliable way to do that is to copy the *entire* rest of the
                // textarea's content into the <span> created at the caret position.
                // For inputs, just '.' would be enough, but no need to bother.
                this.trackingText = this.text.substring(position) || '.';  // || because a completely empty faux span doesn't render at all
                // this.isEnd = !this.text.substring(position);
                // this.$refs.contents.appendChild(span);
            },
            getCaretCoordinates(position) {
                return new Promise(resolve => {
                    this.splitText(position);

                    setTimeout(() => {
                        let target = this.element;
                        let computed = window.getComputedStyle ? window.getComputedStyle(target) : target.currentStyle;  // currentStyle for IE < 9

                        let coordinates = {
                            top: this.$refs.tracking.offsetTop + parseInt(computed['borderTopWidth']) - this.element.scrollTop,
                            left: this.$refs.tracking.offsetLeft + parseInt(computed['borderLeftWidth']) - this.element.scrollLeft,
                            height: parseInt(computed['lineHeight'])
                        };

                        resolve(coordinates);
                    }, 100);
                });
            },
            moveDropdown() {
                this.getCaretCoordinates(this.element.selectionEnd).then(caretCoordinates => {
                    if (this._type === 'input') {
                        let lines = Math.floor(caretCoordinates.top / this.lineHeight);
                        let width = parseInt(this.$refs.tracking_backdrop.style.width);
                        this.dropdownStyle = {
                            top: ((caretCoordinates.top % this.lineHeight) + this.lineHeight) + 'px',
                            left: (lines === 0 ? (caretCoordinates.left + 20) : (width + 20)) + 'px'
                        };
                    }
                    else
                        this.dropdownStyle = {
                            top: (caretCoordinates.top + this.lineHeight) + 'px',
                            left: (caretCoordinates.left + 20) + 'px'
                        };
                });
            },
            onKeyDown(event) {
                if (this.showDropdown && this.suggests.length) {
                    switch (event.keyCode) {
                        case Key.DownArrow: {
                            if (this.selected + 1 < this.suggests.length)
                                this.selected++;
                            event.preventDefault();
                            break;
                        }
                        case Key.UpArrow: {
                            if (this.selected > 0)
                                this.selected--;
                            event.preventDefault();
                            break;
                        }
                        case Key.Enter: {
                            this.dropdownItemSelect(this.selected);
                            event.preventDefault();
                            break;
                        }
                        case Key.Space: {
                            this.dropdownItemSelect(this.selected, true, false, true);
                            event.preventDefault();
                            break;
                        }
                        case Key.Tab: {
                            this.dropdownItemSelect(this.selected, true, true);
                            event.preventDefault();
                            break;
                        }
                        case Key.Escape: {
                            this.showDropdown = false;
                            event.preventDefault();
                            break;
                        }
                    }
                }
            },
            onKeyUp(event) {
                this.moveDropdown();
            },
            dropdownItemClass(current) {
                return {
                    'dropdown-item': true,
                    active: current === this.selected,
                }
            },
            dropdownItemSelect(item, preserveTrigger = true, removeTrailing = false, afterSpace = false) {
                this.selected = item;
                let replaceValue = '';
                if (preserveTrigger)
                    replaceValue += this.suggests[item].trigger;
                replaceValue += this.suggests[item].display;
                let result = Autocomplete.replace(this.text, this.element.selectionEnd, replaceValue, removeTrailing, afterSpace);
                this.text = result.text;

                let selection = this.element.selectionEnd + replaceValue.length - result.before;
                if (afterSpace)
                    selection++;
                const changeCaretPosition = () => {
                    this.element.focus();
                    this.element.selectionEnd = this.element.selectionStart = selection;
                };
                setTimeout(changeCaretPosition, 100);

                this.showDropdown = false;
            },
        },
    }
</script>

<style src="./main.css" scoped></style>