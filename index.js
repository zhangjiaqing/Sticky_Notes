/**
 * @张嘉庆
 */

// 名字空间模块
var app = {
    util: {},
    store: {}
};

// 工具方法模块
app.util = {
    $: function(selector, node) {
        return (node || document).querySelector(selector);
    },
    formatTime: function(ms) {
        var d = new Date(ms);
        var pad = function(s) {
            if (s.toString().length === 1) {
                s = '0' + s;
            }
            return s;
        }
        var year = d.getFullYear();
        var month = d.getMonth() + 1;
        var date = d.getDate();

        var hour = d.getHours();
        var minute = d.getMinutes();
        var second = d.getSeconds();

        return year + '-' + pad(month) + '-' + pad(date) + ' ' + pad(hour) + ':' + pad(minute) + ':' + pad(second);
    }
};

// store 模块

app.store = {
    __store_key: '__sticky_note__',
    get: function(id) {
        var notes = this.getNotes();
        return notes[id] || {};
    },
    set: function(id, content) {
        var notes = this.getNotes();
        if (notes[id]) {
            Object.assign(notes[id], content);
        } else {
            notes[id] = content;
        }
        localStorage[this.__store_key] = JSON.stringify(notes);
        console.log('id' + id + 'content' + JSON.stringify(content))
    },
    remove: function(id) {
        var notes = this.getNotes();
        delete notes[id];
        localStorage[this.__store_key] = JSON.stringify(notes);
    },
    getNotes: function() {
        return JSON.parse(localStorage[this.__store_key] || '{}');
    }
};

(function(util, store) {
    var $ = util.$;
    var moveNote = null;
    var startX;
    var startY;
    var maxZIndex = 0;

    var noteTpl = `
	<i class="u-close"></i>
	<div class="u-editor" contenteditable></div>
	<div class="u-timestamp">
		<span>更新：</span>
		<span class="time"></span>
	</div>
	`;

    function Note(options) {
        var note = document.createElement('div');
        note.className = 'm-note';
        note.id = options.id || 'm-note-' + Date.now();
        note.innerHTML = noteTpl;
        $('.u-editor', note).innerHTML = options.content || '';
        note.style.left = options.left + 'px';
        note.style.top = options.top + 'px';
        note.style.zIndex = options.zIndex;
        document.body.appendChild(note);
        this.note = note;
        this.updateTime(options.updateTime);
        this.addEvent();
    }

    Note.prototype.updateTime = function(ms) {
        var ts = $('.time', this.note);
        ms = ms || Date.now();
        ts.innerHTML = util.formatTime(ms);
        this.updateTimeInMS = ms;
    }

    Note.prototype.save = function() {
        store.set(this.note.id, {
            left: this.note.offsetLeft,
            top: this.note.offsetTop,
            zIndex: parseInt(this.note.zIndex),
            content: $('.u-editor', this.note).innerHTML,
            updateTime: this.updateTimeInMS
        })
    }

    Note.prototype.close = function(e) {
        document.body.removeChild(this.note);
    }

    Note.prototype.addEvent = function() {
        //便签的mousedown事件
        var mousedownHandler = function(e) {
            moveNote = this.note;
            startX = e.clientX - this.note.offsetLeft;
            startY = e.clientY - this.note.offsetTop;
            if (parseInt(this.note.style.zIndex) !== maxZIndex - 1) {
                this.note.style.zIndex = maxZIndex++;
                store.set(this.note.id, {
                    zIndex: maxZIndex - 1
                });
            }
        }.bind(this);
        this.note.addEventListener('mousedown', mousedownHandler);

        //便签的输入事件
        var editor = $('.u-editor', this.note);

        var inputTimer;

        var inputHandler = function(e) {
            var content = editor.innerHTML;
            clearTimeout(inputTimer);
            inputTimer = setTimeout(function() {
            	var time = Date.now();
                store.set(this.note.id, {
                    content: content,
                    updateTime:time
                });
                this.updateTime(time);

            }.bind(this), 300);
        }.bind(this);

        editor.addEventListener('input', inputHandler);

        // 关闭处理程序
        var closeBtn = $('.u-close', this.note);
        var closeHandler = function(e) {
            store.remove(this.note.id);
            this.close(e);
            closeBtn.removeEventListener('click', closeHandler);
            this.note.removeEventListener('mousedown', mousedownHandler);
        }.bind(this);

        closeBtn.addEventListener('click', closeHandler);
    }

    document.addEventListener('DOMContentLoaded', function(e) {
        //创建按钮事件
        $('#create').addEventListener('click', function(e) {
            var note = new Note({
                left: Math.round(Math.random() * (window.innerWidth - 220)),
                top: Math.round(Math.random() * (window.innerHeight - 320)),
                zIndex: maxZIndex++
            });
            note.save();
        });

        //移动监听
        function mousemoveHandler(e) {
            if (!moveNote) {
                return;
            }

            moveNote.style.left = e.clientX - startX + 'px';
            moveNote.style.top = e.clientY - startY + 'px';
        }

        function mouseupHandler(e) {
            if (!moveNote) {
                return;
            }
            store.set(moveNote.id, {
                left: moveNote.offsetLeft,
                top: moveNote.offsetTop
            });
            moveNote = null;
        }
        document.addEventListener('mousemove', mousemoveHandler);
        document.addEventListener('mouseup', mouseupHandler);

        //初始化
        var notes = store.getNotes();
        Object.keys(notes).forEach(function(id) {
            var options = notes[id];
            if (maxZIndex < options.zIndex) {
                maxZIndex = options.zIndex
            }
            new Note(Object.assign(options, {
                id: id
            }));
        });
        maxZIndex+=1;
    });
})(app.util, app.store);
