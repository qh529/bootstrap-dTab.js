/* ========================================================================
 * dTab: DynamicTab的简写
 * 基于bootstrap的 tab.js，扩展了动态添加tab的功能 *
 * ========================================================================
 * 调用方法：设置data属性
 * <button type="button" data-source="#t1" data-container="#container" data-toggle="dTab" data-title="soon">Add</button>
 * 必填：
 * data-container="#id"             tab生成的容器
 * data-toggle="dTab"
 * data-source="#id|url"            填充到tab-content的内容
 *                                  不带“#”默认为一个url
 *                                  加载远程页面的时候，需要在内容加载完毕后手动移除loading图标
 *                                  如：$('#tmpl').prevAll('.dTab-loading').remove();
 * 选填：
 * data-title                       标签的显示名称
 * data-limit                       不填默认为false,表示允许重复添加; data-limit="true" 表示只能添加1次
 * data-empty                       tab-content为空时显示的内容
 * data-removeable                  不填默认为false,表示不允许删除；data-removeable="true"添加的tab允许被删除（右上角会出现叉叉）
 * data-theme="dTab-primary|dTab-browser"     主题
 * 
 * ======================================================================== */
+ function($) {
    'use strict';
    // DTab CLASS DEFINITION
    // ==========================
    var instance;

    function DTab(element, options) {
        this.options = options;
        this.$element = $(element);
        this.$container = $(this.options.container);
        this.$container.addClass(this.options.theme);
        this.nickname = _getUniqueID('adder');
        this.init();
        this.isInsert = false; //是否已被添加     
    };

    function _getUniqueID(prefix) {
        return prefix + '_' + Math.floor(Math.random() * (new Date()).getTime());
    };
    DTab.DEFAULTS = {
        "container": "", //tabs 生成的容器位置 
        "empty": "no data", //没数据时显示的message            
        "limit": false, //是否限制重复添加
        "source": "", //tab-content 填充的内容，可以是url，或者是dom对象
        "title": "New",
        "removeable": false,
        "theme": 'dTab-primary'
    };
    DTab.prototype.init = function() {};
    /**
     * 添加一个tab
     * @param  {[type]}   $container [容器jquyer对象]
     * @param  {[function|string]}   source     [tab-content的填充内容]
     *         function: return html
     *         string : 符合jq风格的选择器，‘#id’或者‘.class’
     * @param  {[type]}   event      [description]
     * @param  {Function} callback   [回调函数]
     */
    DTab.prototype.add = function() {
        // event.stopPropagation();
        var $a,
            $li,
            $div,
            id = _getUniqueID('tab'),
            data = {},
            $removeBtn,
            html = '',
            markup = '<ul class="nav nav-tabs dTab-nav"> </ul> <div class="tab-content"> </div>';
        this.$element.attr('id', this.nickname); //方便状态的同步    
        //panel-body为空时，添加基础markup
        if (this.$container.children('.nav').size() == 0) {
            this.$container.html(markup);
        }
        this.$nav = this.$container.children('.nav');
        this.$tabContent = this.$container.children('.tab-content');
        /**
         * FIRST - 添加tab标签
         * ------------------------------------------------------------------
         */
        $a = $('<a>').attr({
            "data-toggle": "tab",
            "href": "#" + id
        }).html('<span class="sl80">' + this.options.title + '</span>');
        //如果允许删除，则在a标签内塞入删除按钮
        if (this.options.removeable) {
            var options = this.options;
            $removeBtn = $('<span>').addClass('dTab-close').attr({
                'data-dismiss': 'dTab',
                "data-add-by": this.nickname
            });
            $a.append($removeBtn);
        }
        //先清除所有li上的active
        this.$nav.children('li').removeClass('active');
        //塞入
        $li = $('<li>').append($a).addClass('active').appendTo(this.$nav);
        /**
         * SECEND - 添加tab标签对应的content
         * ------------------------------------------------------------------
         */        
        this.$tabContent.children('div').removeClass('active');
        //在获取到content之前，先放入tab-pane
        $div = $('<div>').attr('id', id).addClass('tab-pane active');
        this.$tabContent.append($div);
        //开始获取content
        //必须把async设置成false，如果是异步会出现错误
        if (!/#/.test(this.options.source)) {
            $div.append('<img src="img/spinner.gif" widht="16" height="16" class="dTab-loading">');
         
            $.ajax({
                url: this.options.source,
                type: 'get',
                async: false,
                dataType: 'html',
            }).done(function(data) {
                html = data;
            })
        } else {
            html = $(this.options.source).html();
        }
        this.$tabContent.append($div.html(html)); // 往content容器中加div.tab-pane
        /**
         * THIRD - 同步add按钮状态
         * ------------------------------------------------------------------
         */
        //被添加过
        this.isInsert = true;
        //如果不允许多次添加，则把add按钮disabled
        if (this.options.limit) {
            this.$element.addClass('dTab-disabled').attr('title', 'only add one time');
        }
    };
    //删除结算规则
    //el表示当前点击的元素
    DTab.prototype.remove = function(el) {
        // console.log(el)
        var $dismiss = $(el), //dismiss关闭按钮
            $father = $('#' + $dismiss.data('add-by')),
            $li = $dismiss.closest('li'),
            $prevLi = $li.prev(),
            $nextLi = $li.next(),
            $nav = $li.closest('.nav'),
            prevIndex,
            nextIndex,
            currIndex = $nav.children('li').index($li);
        /**
         * FIRST - 删除当前tab标签和对应的content
         * ------------------------------------------------------------------
         */
        $li.remove();
        this.$container.find('.tab-content').children('.tab-pane').eq(currIndex).remove();
        /**
         * SECOND - 同步add按钮的状态；同步当前激活项的状态
         * ------------------------------------------------------------------
         */
        //如果这个对象有设置“不能多次添加”，则再删除tab后，清楚它的disabled状态，以便继续添加
        if (this.options.limit) {
            $father.removeClass('dTab-disabled').removeAttr('title');
            this.isInsert = false;
        }
        //没有上一项也没有下一项，即表示只有当前一个tab标签
        if ($prevLi.size() == 0 && $nextLi.size() == 0) {
            this.$container.html('<p>no data</p>');
            return
        }
        $nav.children('li').removeClass('active');
        this.$container.children('div').removeClass('active');
        //有上一项：active指向prev
        if ($prevLi.size() > 0) {
            $prevLi.addClass('active');
            prevIndex = $nav.children('li').index($prevLi);
            this.$container.find('.tab-content').children('.tab-pane').eq(prevIndex).addClass('active');
            return
        }
        //如果没有prev,那么active指向next
        if ($nextLi.size() > 0) {
            $nextLi.addClass('active');
            nextIndex = $nav.children('li').index($nextLi);
            this.$container.find('.tab-content').children('.tab-pane').eq(nextIndex).addClass('active');
            return
        }
    };
    // DTab PLUGIN DEFINITION
    // ===========================
    var old = $.fn.dTab;
    $.fn.dTab = function(option) {
        return this.each(function() {
            var $this = $(this);
            instance = $this.data('bs.dTab');
            var options = $.extend({}, DTab.DEFAULTS, typeof option == 'object' && option);
            if (!instance) $this.data('bs.dTab', (instance = new DTab(this, options)));
            if (typeof option == 'string') instance[option]();
            if (options.limit == true && instance.isInsert == true) {
                return
            }
            instance.add();
        })
    };
    $.fn.dTab.Constructor = DTab;
    // DTab NO CONFLICT
    // =====================
    $.fn.dTab.noConflict = function() {
        $.fn.dTab = old
        return this
    };
    // DTab DATA-API
    // ==================
    $(document).on('click.bs.dTab.data-api', '[data-toggle=dTab]', function(e) {
        var $adder = $(this);
        if ($adder.is('a')) e.preventDefault()
        var data = $adder.data(); //获取点击的dom元素上的所有data-*属性值
        $adder.dTab(data);
    });
    $(document).on('click.bs.dTab.data-api', '[data-dismiss=dTab]', function(e) {
        instance.remove(this);
    });
}(jQuery);
