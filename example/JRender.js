(function(gbl){
var typeHim = function(dm) {
        if (dm === undefined) {
            return "undefined";
        }
        if (dm === null) {
            return "null";
        }
        var tp = typeof dm;
        if (tp === "string" || tp === "number" || tp === "function") {
            return tp;
        }
        tp = Object.prototype.toString.call(dm);
        if (tp.indexOf("rray") !== -1 || tp.indexOf("rguments") !== -1) {
            return "array";
        } else if (tp.indexOf("ragment") !== -1) {
            return "fragment"
        } else if (tp.indexOf("odeList") !== -1) {
            return "nodelist";
        } else if (tp.indexOf("lement") !== -1) {
            return "node";
        } else if (tp.indexOf("egExp") !== -1) {
            return "regexp";
        } else if (tp.indexOf("bject") !== -1) {
            return "object";
        } else {
            return false;
        }
    };

    var miniExtend = function(aob, ob) {
        var i = null;
        for (i in ob) {
            if (!(i in aob)) {
                aob[i] = ob[i];
            }
        }
        return aob;
    }


    var getValue = function(name, ob) {
     if (["number", "string"].indexOf(typeof ob) !== -1) {
            return false;
          }

        var ar = name.split("."),
            n = ar.length;
        var temp = "";
        var i = 0;
        for (; i < n; i += 1) {
            temp = ar[i];
            ob = ob[temp];
            if (ob === undefined) {
                return false;
            }
        }
        return ob;
    };

    var getParaName = function(f) {
        var str = f.toString();
        var s1 = str.indexOf("("),
            s2 = str.indexOf(")");
        str = str.slice(s1 + 1, s2);
        return str.split(",");
    };
var parseS=function(str) { //解析表达式
            var tp = str.slice(0, str.indexOf("\x20"));
            var obs = null;
            var reg = null;
            var mat;
            if (tp === "for") {
                reg = /for\s+([\w|\|]+)\s+in\s+([\w|\|\.]+)/;
                mat = reg.exec(str);
                obs = [mat[1], mat[2]];
            } else if (tp === "if") {
                reg = /if\s+([\w|\|\.]+)+\s+([\<\>\=])+\s+([\w|\|\.]+)/;
                mat = reg.exec(str);
                obs = [mat[1], mat[2], mat[3]];
            }
            return obs;
        }

var compIf=function(vara, expre, varb) { //条件对比
            switch (expre) {
                case "<":
                    tf = (vara < varb);
                    break;
                case ">":
                    tf = (vara > varb);
                    break;
                case "=":
                    tf = (vara = varb);
                    break;
            }
            return tf;
        }

var anaTag=function(htm) { //解析？？
            var regold = /\[\[(\w+)(?=\s)[\w\s\>\<\=\|\.]+\]\]/;
            var reg;
            var mat = null;
            var no = 0;
            var lf = "",
                rt = "";
            var tp = null;
            var right = "";
            var out = [];
            var temp = [];
            // var ctr=false;
            // 开始为零的时候表示最开始，最后的为零的表示最后匹配到的结束
            tp = regold.exec(htm);

            do {
                // 通过判断[[]][[/]]闭合与否来进行一次语句抽取，一次为no+=1，闭合为-=1
                // 为第一次no为0的时候，进行正则替换
                if (no === 0) {
                    if (!tp) {
                        return false;
                    } else {
                        tp = tp[1];
                    }

                    // tp为类型，比如for还是if
                    reg = new RegExp('\\[\\[' + tp + '[\\w\\s\\>\\<\\=\\|\\.]+\\]\\]|(\\[\\[\\/' + tp + '\\]\\])', 'g');
                    mat = reg.exec(htm);
                    lf = [mat.index, reg.lastIndex];
                } else {
                    mat = reg.exec(htm);
                }
                if (mat[1]) {
                    no -= 1;
                } else {
                    no += 1;
                }
                if (no === 0) {
                    rt = [mat.index, reg.lastIndex];
                    // 在当层下一个个取
                    temp = [{
                        html: htm.slice(0, lf[0])
                    }, {
                        html: htm.slice(lf[1], rt[0]),
                        express: htm.slice(lf[0] + 2, lf[1] - 2)
                    }];
                    htm = right = htm.slice(rt[1]);
                    tp = regold.exec(right);
                    out = out.concat(temp);
                }
            } while (mat && tp);
            out.push({
                html: right
            });
            return out;
        };

var filters={ //所有的filter函数都有三个参数 str,item,lg
            upper: function(str) {
                return str.toUpperCase();
            },
            lower: function(str) {
                return str.toLowerCase();
            },
            length: function(str) {
                if (typeHim(str) !== "array") {
                    return str;
                }
                return str.length;
            },
            safe: function(str) {
                if (typeof str === "string") {
                    return safeHtml(str);
                }
            }
        };
;
var JRender = function() {
        //存储相关的把[[]]这种变成？？的
        this.storeExp = {};
        //代表着变成??的与storeExp的标识符
        this.onlyItem = 0;
        // this.refItem=0;
        this.refOb = [];
    };



    JRender.prototype = {
        constructor: JRender,
        parseS: parseS,
        compIf:compIf,
        anaTag: anaTag,
        filters:filters,
        setFilter: function(opt) { //设置过滤器
            var fil = this.filters;
            miniExtend(fil, opt);
        },
        handVal: function(str, ob, item, blg) { //处理值
            var arr = str.split("|");
            var filter = arr[1],
                attr = arr[0];
            var iref = null,
                ref = null;
            var ts = this;
            var storeExp = ts.storeExp;
            var refOb = this.refOb;

            // 当为 表达式语句时候
            if (filter === "EXPRESS") {
                var res = storeExp[attr];
                var expob = ts.parseS(res.express);
                if (expob.length === 2) { //为for语句
                    var tmpob = getValue(expob[1], ob);
                    // prefix表示别名
                    if (tmpob === false) {
                        return "";
                    } else {
                        return {
                            data: tmpob,
                            template: res.html,
                            prefix: expob[0]
                        };
                    }

                } else if (expob.length === 3) { //为if语句
                    var tmpob = getValue(expob[0], ob);
                    if (tmpob === false) {
                        return "";
                    }
                    var tf = ts.compIf(getValue(expob[0], ob), expob[1], expob[2]);
                    if (!tf) {
                        return ""
                    } else {

                        return {
                            data: ob,
                            template: res.html
                        }
                    };
                }
            } else if ((iref = attr.indexOf("REF")) !== -1) {
                // ts.refItem+=1;
                ref = attr.slice(iref + 3);
                // 如果没有标识，就用一个字符表示
                ref = ref ? ref : "OTHER";
                // 为true表示相关属性下有ob
                // ts.refOb[ref]=true;
                if (refOb.indexOf(ref) === -1) {
                    refOb.push(ref);
                }
                // refOb.push({name:ref,item:item,length:blg});
                return "data-xjref=" + ref;

            } else {
                var fls = ts.filters;
                var res = getValue(attr, ob);
                if (filter) {
                    if (filter.indexOf("\,") !== -1) {
                        filter = filter.split(",");
                        var j = 0,
                            m = filter.length;
                        var fl;
                        for (; j < m; j += 1) {
                            fl = filter[j];
                            if (fl in fls) {
                                res = fls[fl](res, item, blg, ts.store);
                            }
                        }
                    } else {
                        if (filter in fls) {
                            res = fls[filter](res, item, blg, ts.store);
                        }
                    }

                }
                return res ? res : "";
            }
        },
        stringEachArr: function(lf, str, obs, item, blg) { //处理html
            var n = str.length,
                i = 0;
            var temp = "";
            var inda = 0,
                indb = -1;
            var outstr = "";
            var right = "",
                middle = "";
            var no = 0;
            var first = str.indexOf(lf);
            //如果不用解析
            if (first === -1) {
                return str;
            }

            var out = [];
            var ts = this;
            if (first === -1) {
                return false;
            }
            for (; i < n; i += 1) {
                temp = str.charAt(i)
                if (temp === lf) {
                    no += 1;
                    if (no % 2 !== 0) { //取得？左边的字符串
                        inda = i;
                        outstr += str.slice(indb + 1, inda);
                    } else {
                        indb = i;
                        //处理相关字符串，由于[[]]这种也先变成了？|express？格式，所以当判断为这种格式的时候，返回为对象
                        middle = ts.handVal(str.slice(inda + 1, indb), obs, item, blg);

                        if (["number", "string"].indexOf(typeof middle) !== -1) {
                            outstr += middle;
                        } else {
                            // console.log(middle)
                            outstr += (ts.render(middle, "middle"));
                        }
                    }
                }
            }
            right = str.slice(indb + 1);
            return outstr + right;
        },
        setEvent: function(opt) {
            this.events = opt;
        },
        runEvent: function() {
            var evts = this.events;
            // if(!evts){return false;}
            var refs = this.refOb;
            var i = 0,
                n = refs.length;
            var temp = null;
            var fun = null;
            var dm = null;
            var arg = null;

            var j = 1,
                m;

            for (; i < n; i += 1) {
                temp = refs[i];
                dm = $("[data-xjref=" + temp + "]");
                if (evts && (temp in evts)) {
                    fun = evts[temp];
                    arg = getParaName(fun);
                    if (arg.length > 1) {
                        arg[0] = dm;
                        m = arg.length;
                        for (; j < m; j += 1) {
                            arg[j] = $("[data-xjref=" + arg[j] + "]");
                        }
                        fun.apply(null, arg);
                    } else {
                        fun(dm);
                    }
                }
                dm.removeAttr("data-xjref");
            }
        },
        render: function(opt, mid) { //根据情况 来进行分拆，包括，template html，data数据，prefix表示for循环中的别名
            if (mid === undefined) {
                this.storeExp = {};
                this.onlyItem = 0;
                this.refOb = [];
                this.store = opt.data;
            }

            // console.log(opt)

            var ts = this;
            var ob = opt.data,
                strhtml = opt.template,
                prefix = opt.prefix;
            var aim = opt.aim;


            var strarr = ts.anaTag(strhtml);



            var tmp = "";
            // var ts=this;
            var oitem;
            if (typeHim(strarr) === "array") {
                var i = 0,
                    n = strarr.length,
                    temp = null;
                var otemp = null;
                var tpob = {};
                var item = 0;
                var exp = "";
                for (; i < n; i += 1) {
                    temp = strarr[i];
                    if (temp.express) {
                        oitem = ts.onlyItem += 1;
                        exp = "XJ" + oitem;
                        ts.storeExp[exp] = temp;
                        tmp += "?" + exp + "|EXPRESS?";
                    } else {
                        tmp += temp.html;
                    }
                }
            } else if (strarr === false) {

                tmp = strhtml;
            }
            var tp = typeHim(ob);
            temp = null;
            var outstr = "";
            if (tp === "array") {
                var i = 0,
                    n = ob.length;
                for (; i < n; i += 1) {
                    temp = ob[i];

                    temp.NUMBER = i.toString();
                    if (prefix) {
                        otemp = {};
                        otemp[prefix] = temp;
                    } else {
                        otemp = temp;
                    }

                    outstr += ts.stringEachArr("?", tmp, otemp, i, n);
                }
            } else {
                // prefix不会在普通对象中出现
                outstr = ts.stringEachArr("?", tmp, ob, 0, 1);
            }


            if (mid === undefined && aim !== undefined) {

                if (typeof aim === "string") {
                    aim = $(aim);
                }
                aim.html("").html(outstr);
                ts.runEvent();
            }

            // console.log(outstr)
            return outstr;

        }

    }

var amd=(typeof define == 'function' && define.amd);

    if (amd) {
        define(function(){
            return JRender;
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = JRender;
    }
gbl.JRender=JRender;
})(window)