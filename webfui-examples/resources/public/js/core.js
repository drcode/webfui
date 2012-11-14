var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__4451__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4451 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4451__delegate.call(this, array, i, idxs)
    };
    G__4451.cljs$lang$maxFixedArity = 2;
    G__4451.cljs$lang$applyTo = function(arglist__4452) {
      var array = cljs.core.first(arglist__4452);
      var i = cljs.core.first(cljs.core.next(arglist__4452));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4452));
      return G__4451__delegate(array, i, idxs)
    };
    G__4451.cljs$lang$arity$variadic = G__4451__delegate;
    return G__4451
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3546__auto____4453 = this$;
      if(and__3546__auto____4453) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3546__auto____4453
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3548__auto____4454 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4454) {
          return or__3548__auto____4454
        }else {
          var or__3548__auto____4455 = cljs.core._invoke["_"];
          if(or__3548__auto____4455) {
            return or__3548__auto____4455
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3546__auto____4456 = this$;
      if(and__3546__auto____4456) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3546__auto____4456
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3548__auto____4457 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4457) {
          return or__3548__auto____4457
        }else {
          var or__3548__auto____4458 = cljs.core._invoke["_"];
          if(or__3548__auto____4458) {
            return or__3548__auto____4458
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3546__auto____4459 = this$;
      if(and__3546__auto____4459) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3546__auto____4459
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____4460 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4460) {
          return or__3548__auto____4460
        }else {
          var or__3548__auto____4461 = cljs.core._invoke["_"];
          if(or__3548__auto____4461) {
            return or__3548__auto____4461
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3546__auto____4462 = this$;
      if(and__3546__auto____4462) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3546__auto____4462
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____4463 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4463) {
          return or__3548__auto____4463
        }else {
          var or__3548__auto____4464 = cljs.core._invoke["_"];
          if(or__3548__auto____4464) {
            return or__3548__auto____4464
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3546__auto____4465 = this$;
      if(and__3546__auto____4465) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3546__auto____4465
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____4466 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4466) {
          return or__3548__auto____4466
        }else {
          var or__3548__auto____4467 = cljs.core._invoke["_"];
          if(or__3548__auto____4467) {
            return or__3548__auto____4467
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3546__auto____4468 = this$;
      if(and__3546__auto____4468) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3546__auto____4468
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____4469 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4469) {
          return or__3548__auto____4469
        }else {
          var or__3548__auto____4470 = cljs.core._invoke["_"];
          if(or__3548__auto____4470) {
            return or__3548__auto____4470
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3546__auto____4471 = this$;
      if(and__3546__auto____4471) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3546__auto____4471
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____4472 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4472) {
          return or__3548__auto____4472
        }else {
          var or__3548__auto____4473 = cljs.core._invoke["_"];
          if(or__3548__auto____4473) {
            return or__3548__auto____4473
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3546__auto____4474 = this$;
      if(and__3546__auto____4474) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3546__auto____4474
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____4475 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4475) {
          return or__3548__auto____4475
        }else {
          var or__3548__auto____4476 = cljs.core._invoke["_"];
          if(or__3548__auto____4476) {
            return or__3548__auto____4476
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3546__auto____4477 = this$;
      if(and__3546__auto____4477) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3546__auto____4477
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____4478 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4478) {
          return or__3548__auto____4478
        }else {
          var or__3548__auto____4479 = cljs.core._invoke["_"];
          if(or__3548__auto____4479) {
            return or__3548__auto____4479
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3546__auto____4480 = this$;
      if(and__3546__auto____4480) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3546__auto____4480
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____4481 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4481) {
          return or__3548__auto____4481
        }else {
          var or__3548__auto____4482 = cljs.core._invoke["_"];
          if(or__3548__auto____4482) {
            return or__3548__auto____4482
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3546__auto____4483 = this$;
      if(and__3546__auto____4483) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3546__auto____4483
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____4484 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4484) {
          return or__3548__auto____4484
        }else {
          var or__3548__auto____4485 = cljs.core._invoke["_"];
          if(or__3548__auto____4485) {
            return or__3548__auto____4485
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3546__auto____4486 = this$;
      if(and__3546__auto____4486) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3546__auto____4486
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____4487 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4487) {
          return or__3548__auto____4487
        }else {
          var or__3548__auto____4488 = cljs.core._invoke["_"];
          if(or__3548__auto____4488) {
            return or__3548__auto____4488
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3546__auto____4489 = this$;
      if(and__3546__auto____4489) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3546__auto____4489
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____4490 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4490) {
          return or__3548__auto____4490
        }else {
          var or__3548__auto____4491 = cljs.core._invoke["_"];
          if(or__3548__auto____4491) {
            return or__3548__auto____4491
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3546__auto____4492 = this$;
      if(and__3546__auto____4492) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3546__auto____4492
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____4493 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4493) {
          return or__3548__auto____4493
        }else {
          var or__3548__auto____4494 = cljs.core._invoke["_"];
          if(or__3548__auto____4494) {
            return or__3548__auto____4494
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3546__auto____4495 = this$;
      if(and__3546__auto____4495) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3546__auto____4495
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____4496 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4496) {
          return or__3548__auto____4496
        }else {
          var or__3548__auto____4497 = cljs.core._invoke["_"];
          if(or__3548__auto____4497) {
            return or__3548__auto____4497
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3546__auto____4498 = this$;
      if(and__3546__auto____4498) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3546__auto____4498
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____4499 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4499) {
          return or__3548__auto____4499
        }else {
          var or__3548__auto____4500 = cljs.core._invoke["_"];
          if(or__3548__auto____4500) {
            return or__3548__auto____4500
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3546__auto____4501 = this$;
      if(and__3546__auto____4501) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3546__auto____4501
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____4502 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4502) {
          return or__3548__auto____4502
        }else {
          var or__3548__auto____4503 = cljs.core._invoke["_"];
          if(or__3548__auto____4503) {
            return or__3548__auto____4503
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3546__auto____4504 = this$;
      if(and__3546__auto____4504) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3546__auto____4504
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____4505 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4505) {
          return or__3548__auto____4505
        }else {
          var or__3548__auto____4506 = cljs.core._invoke["_"];
          if(or__3548__auto____4506) {
            return or__3548__auto____4506
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3546__auto____4507 = this$;
      if(and__3546__auto____4507) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3546__auto____4507
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____4508 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4508) {
          return or__3548__auto____4508
        }else {
          var or__3548__auto____4509 = cljs.core._invoke["_"];
          if(or__3548__auto____4509) {
            return or__3548__auto____4509
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3546__auto____4510 = this$;
      if(and__3546__auto____4510) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3546__auto____4510
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____4511 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4511) {
          return or__3548__auto____4511
        }else {
          var or__3548__auto____4512 = cljs.core._invoke["_"];
          if(or__3548__auto____4512) {
            return or__3548__auto____4512
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3546__auto____4513 = this$;
      if(and__3546__auto____4513) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3546__auto____4513
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____4514 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4514) {
          return or__3548__auto____4514
        }else {
          var or__3548__auto____4515 = cljs.core._invoke["_"];
          if(or__3548__auto____4515) {
            return or__3548__auto____4515
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3546__auto____4516 = coll;
    if(and__3546__auto____4516) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3546__auto____4516
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4517 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4517) {
        return or__3548__auto____4517
      }else {
        var or__3548__auto____4518 = cljs.core._count["_"];
        if(or__3548__auto____4518) {
          return or__3548__auto____4518
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3546__auto____4519 = coll;
    if(and__3546__auto____4519) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3546__auto____4519
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4520 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4520) {
        return or__3548__auto____4520
      }else {
        var or__3548__auto____4521 = cljs.core._empty["_"];
        if(or__3548__auto____4521) {
          return or__3548__auto____4521
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3546__auto____4522 = coll;
    if(and__3546__auto____4522) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3546__auto____4522
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3548__auto____4523 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4523) {
        return or__3548__auto____4523
      }else {
        var or__3548__auto____4524 = cljs.core._conj["_"];
        if(or__3548__auto____4524) {
          return or__3548__auto____4524
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3546__auto____4525 = coll;
      if(and__3546__auto____4525) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3546__auto____4525
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3548__auto____4526 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4526) {
          return or__3548__auto____4526
        }else {
          var or__3548__auto____4527 = cljs.core._nth["_"];
          if(or__3548__auto____4527) {
            return or__3548__auto____4527
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3546__auto____4528 = coll;
      if(and__3546__auto____4528) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3546__auto____4528
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____4529 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4529) {
          return or__3548__auto____4529
        }else {
          var or__3548__auto____4530 = cljs.core._nth["_"];
          if(or__3548__auto____4530) {
            return or__3548__auto____4530
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3546__auto____4531 = coll;
    if(and__3546__auto____4531) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3546__auto____4531
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4532 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4532) {
        return or__3548__auto____4532
      }else {
        var or__3548__auto____4533 = cljs.core._first["_"];
        if(or__3548__auto____4533) {
          return or__3548__auto____4533
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3546__auto____4534 = coll;
    if(and__3546__auto____4534) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3546__auto____4534
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4535 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4535) {
        return or__3548__auto____4535
      }else {
        var or__3548__auto____4536 = cljs.core._rest["_"];
        if(or__3548__auto____4536) {
          return or__3548__auto____4536
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3546__auto____4537 = o;
      if(and__3546__auto____4537) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3546__auto____4537
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3548__auto____4538 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4538) {
          return or__3548__auto____4538
        }else {
          var or__3548__auto____4539 = cljs.core._lookup["_"];
          if(or__3548__auto____4539) {
            return or__3548__auto____4539
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3546__auto____4540 = o;
      if(and__3546__auto____4540) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3546__auto____4540
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____4541 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4541) {
          return or__3548__auto____4541
        }else {
          var or__3548__auto____4542 = cljs.core._lookup["_"];
          if(or__3548__auto____4542) {
            return or__3548__auto____4542
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3546__auto____4543 = coll;
    if(and__3546__auto____4543) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3546__auto____4543
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4544 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4544) {
        return or__3548__auto____4544
      }else {
        var or__3548__auto____4545 = cljs.core._contains_key_QMARK_["_"];
        if(or__3548__auto____4545) {
          return or__3548__auto____4545
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3546__auto____4546 = coll;
    if(and__3546__auto____4546) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3546__auto____4546
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____4547 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4547) {
        return or__3548__auto____4547
      }else {
        var or__3548__auto____4548 = cljs.core._assoc["_"];
        if(or__3548__auto____4548) {
          return or__3548__auto____4548
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3546__auto____4549 = coll;
    if(and__3546__auto____4549) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3546__auto____4549
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4550 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4550) {
        return or__3548__auto____4550
      }else {
        var or__3548__auto____4551 = cljs.core._dissoc["_"];
        if(or__3548__auto____4551) {
          return or__3548__auto____4551
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3546__auto____4552 = coll;
    if(and__3546__auto____4552) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3546__auto____4552
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4553 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4553) {
        return or__3548__auto____4553
      }else {
        var or__3548__auto____4554 = cljs.core._key["_"];
        if(or__3548__auto____4554) {
          return or__3548__auto____4554
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3546__auto____4555 = coll;
    if(and__3546__auto____4555) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3546__auto____4555
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4556 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4556) {
        return or__3548__auto____4556
      }else {
        var or__3548__auto____4557 = cljs.core._val["_"];
        if(or__3548__auto____4557) {
          return or__3548__auto____4557
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3546__auto____4558 = coll;
    if(and__3546__auto____4558) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3546__auto____4558
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3548__auto____4559 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4559) {
        return or__3548__auto____4559
      }else {
        var or__3548__auto____4560 = cljs.core._disjoin["_"];
        if(or__3548__auto____4560) {
          return or__3548__auto____4560
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3546__auto____4561 = coll;
    if(and__3546__auto____4561) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3546__auto____4561
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4562 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4562) {
        return or__3548__auto____4562
      }else {
        var or__3548__auto____4563 = cljs.core._peek["_"];
        if(or__3548__auto____4563) {
          return or__3548__auto____4563
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3546__auto____4564 = coll;
    if(and__3546__auto____4564) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3546__auto____4564
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4565 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4565) {
        return or__3548__auto____4565
      }else {
        var or__3548__auto____4566 = cljs.core._pop["_"];
        if(or__3548__auto____4566) {
          return or__3548__auto____4566
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3546__auto____4567 = coll;
    if(and__3546__auto____4567) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3546__auto____4567
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____4568 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4568) {
        return or__3548__auto____4568
      }else {
        var or__3548__auto____4569 = cljs.core._assoc_n["_"];
        if(or__3548__auto____4569) {
          return or__3548__auto____4569
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3546__auto____4570 = o;
    if(and__3546__auto____4570) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3546__auto____4570
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4571 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3548__auto____4571) {
        return or__3548__auto____4571
      }else {
        var or__3548__auto____4572 = cljs.core._deref["_"];
        if(or__3548__auto____4572) {
          return or__3548__auto____4572
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3546__auto____4573 = o;
    if(and__3546__auto____4573) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3546__auto____4573
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____4574 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3548__auto____4574) {
        return or__3548__auto____4574
      }else {
        var or__3548__auto____4575 = cljs.core._deref_with_timeout["_"];
        if(or__3548__auto____4575) {
          return or__3548__auto____4575
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3546__auto____4576 = o;
    if(and__3546__auto____4576) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3546__auto____4576
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4577 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4577) {
        return or__3548__auto____4577
      }else {
        var or__3548__auto____4578 = cljs.core._meta["_"];
        if(or__3548__auto____4578) {
          return or__3548__auto____4578
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3546__auto____4579 = o;
    if(and__3546__auto____4579) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3546__auto____4579
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3548__auto____4580 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4580) {
        return or__3548__auto____4580
      }else {
        var or__3548__auto____4581 = cljs.core._with_meta["_"];
        if(or__3548__auto____4581) {
          return or__3548__auto____4581
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3546__auto____4582 = coll;
      if(and__3546__auto____4582) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3546__auto____4582
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3548__auto____4583 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4583) {
          return or__3548__auto____4583
        }else {
          var or__3548__auto____4584 = cljs.core._reduce["_"];
          if(or__3548__auto____4584) {
            return or__3548__auto____4584
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3546__auto____4585 = coll;
      if(and__3546__auto____4585) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3546__auto____4585
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____4586 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4586) {
          return or__3548__auto____4586
        }else {
          var or__3548__auto____4587 = cljs.core._reduce["_"];
          if(or__3548__auto____4587) {
            return or__3548__auto____4587
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3546__auto____4588 = coll;
    if(and__3546__auto____4588) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3546__auto____4588
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3548__auto____4589 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4589) {
        return or__3548__auto____4589
      }else {
        var or__3548__auto____4590 = cljs.core._kv_reduce["_"];
        if(or__3548__auto____4590) {
          return or__3548__auto____4590
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3546__auto____4591 = o;
    if(and__3546__auto____4591) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3546__auto____4591
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3548__auto____4592 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3548__auto____4592) {
        return or__3548__auto____4592
      }else {
        var or__3548__auto____4593 = cljs.core._equiv["_"];
        if(or__3548__auto____4593) {
          return or__3548__auto____4593
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3546__auto____4594 = o;
    if(and__3546__auto____4594) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3546__auto____4594
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4595 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3548__auto____4595) {
        return or__3548__auto____4595
      }else {
        var or__3548__auto____4596 = cljs.core._hash["_"];
        if(or__3548__auto____4596) {
          return or__3548__auto____4596
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3546__auto____4597 = o;
    if(and__3546__auto____4597) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3546__auto____4597
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4598 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4598) {
        return or__3548__auto____4598
      }else {
        var or__3548__auto____4599 = cljs.core._seq["_"];
        if(or__3548__auto____4599) {
          return or__3548__auto____4599
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3546__auto____4600 = coll;
    if(and__3546__auto____4600) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3546__auto____4600
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4601 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4601) {
        return or__3548__auto____4601
      }else {
        var or__3548__auto____4602 = cljs.core._rseq["_"];
        if(or__3548__auto____4602) {
          return or__3548__auto____4602
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____4603 = coll;
    if(and__3546__auto____4603) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3546__auto____4603
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4604 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4604) {
        return or__3548__auto____4604
      }else {
        var or__3548__auto____4605 = cljs.core._sorted_seq["_"];
        if(or__3548__auto____4605) {
          return or__3548__auto____4605
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____4606 = coll;
    if(and__3546__auto____4606) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3546__auto____4606
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4607 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4607) {
        return or__3548__auto____4607
      }else {
        var or__3548__auto____4608 = cljs.core._sorted_seq_from["_"];
        if(or__3548__auto____4608) {
          return or__3548__auto____4608
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3546__auto____4609 = coll;
    if(and__3546__auto____4609) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3546__auto____4609
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3548__auto____4610 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4610) {
        return or__3548__auto____4610
      }else {
        var or__3548__auto____4611 = cljs.core._entry_key["_"];
        if(or__3548__auto____4611) {
          return or__3548__auto____4611
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3546__auto____4612 = coll;
    if(and__3546__auto____4612) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3546__auto____4612
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4613 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4613) {
        return or__3548__auto____4613
      }else {
        var or__3548__auto____4614 = cljs.core._comparator["_"];
        if(or__3548__auto____4614) {
          return or__3548__auto____4614
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3546__auto____4615 = o;
    if(and__3546__auto____4615) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3546__auto____4615
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3548__auto____4616 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4616) {
        return or__3548__auto____4616
      }else {
        var or__3548__auto____4617 = cljs.core._pr_seq["_"];
        if(or__3548__auto____4617) {
          return or__3548__auto____4617
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3546__auto____4618 = d;
    if(and__3546__auto____4618) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3546__auto____4618
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3548__auto____4619 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3548__auto____4619) {
        return or__3548__auto____4619
      }else {
        var or__3548__auto____4620 = cljs.core._realized_QMARK_["_"];
        if(or__3548__auto____4620) {
          return or__3548__auto____4620
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3546__auto____4621 = this$;
    if(and__3546__auto____4621) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3546__auto____4621
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____4622 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4622) {
        return or__3548__auto____4622
      }else {
        var or__3548__auto____4623 = cljs.core._notify_watches["_"];
        if(or__3548__auto____4623) {
          return or__3548__auto____4623
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3546__auto____4624 = this$;
    if(and__3546__auto____4624) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3546__auto____4624
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____4625 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4625) {
        return or__3548__auto____4625
      }else {
        var or__3548__auto____4626 = cljs.core._add_watch["_"];
        if(or__3548__auto____4626) {
          return or__3548__auto____4626
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3546__auto____4627 = this$;
    if(and__3546__auto____4627) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3546__auto____4627
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3548__auto____4628 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4628) {
        return or__3548__auto____4628
      }else {
        var or__3548__auto____4629 = cljs.core._remove_watch["_"];
        if(or__3548__auto____4629) {
          return or__3548__auto____4629
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3546__auto____4630 = coll;
    if(and__3546__auto____4630) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3546__auto____4630
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4631 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4631) {
        return or__3548__auto____4631
      }else {
        var or__3548__auto____4632 = cljs.core._as_transient["_"];
        if(or__3548__auto____4632) {
          return or__3548__auto____4632
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3546__auto____4633 = tcoll;
    if(and__3546__auto____4633) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3546__auto____4633
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3548__auto____4634 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4634) {
        return or__3548__auto____4634
      }else {
        var or__3548__auto____4635 = cljs.core._conj_BANG_["_"];
        if(or__3548__auto____4635) {
          return or__3548__auto____4635
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4636 = tcoll;
    if(and__3546__auto____4636) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3546__auto____4636
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4637 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4637) {
        return or__3548__auto____4637
      }else {
        var or__3548__auto____4638 = cljs.core._persistent_BANG_["_"];
        if(or__3548__auto____4638) {
          return or__3548__auto____4638
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3546__auto____4639 = tcoll;
    if(and__3546__auto____4639) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3546__auto____4639
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3548__auto____4640 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4640) {
        return or__3548__auto____4640
      }else {
        var or__3548__auto____4641 = cljs.core._assoc_BANG_["_"];
        if(or__3548__auto____4641) {
          return or__3548__auto____4641
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3546__auto____4642 = tcoll;
    if(and__3546__auto____4642) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3546__auto____4642
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3548__auto____4643 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4643) {
        return or__3548__auto____4643
      }else {
        var or__3548__auto____4644 = cljs.core._dissoc_BANG_["_"];
        if(or__3548__auto____4644) {
          return or__3548__auto____4644
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3546__auto____4645 = tcoll;
    if(and__3546__auto____4645) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3546__auto____4645
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3548__auto____4646 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4646) {
        return or__3548__auto____4646
      }else {
        var or__3548__auto____4647 = cljs.core._assoc_n_BANG_["_"];
        if(or__3548__auto____4647) {
          return or__3548__auto____4647
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4648 = tcoll;
    if(and__3546__auto____4648) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3546__auto____4648
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4649 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4649) {
        return or__3548__auto____4649
      }else {
        var or__3548__auto____4650 = cljs.core._pop_BANG_["_"];
        if(or__3548__auto____4650) {
          return or__3548__auto____4650
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3546__auto____4651 = tcoll;
    if(and__3546__auto____4651) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3546__auto____4651
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3548__auto____4652 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4652) {
        return or__3548__auto____4652
      }else {
        var or__3548__auto____4653 = cljs.core._disjoin_BANG_["_"];
        if(or__3548__auto____4653) {
          return or__3548__auto____4653
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3548__auto____4654 = x === y;
    if(or__3548__auto____4654) {
      return or__3548__auto____4654
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4655__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4656 = y;
            var G__4657 = cljs.core.first.call(null, more);
            var G__4658 = cljs.core.next.call(null, more);
            x = G__4656;
            y = G__4657;
            more = G__4658;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4655 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4655__delegate.call(this, x, y, more)
    };
    G__4655.cljs$lang$maxFixedArity = 2;
    G__4655.cljs$lang$applyTo = function(arglist__4659) {
      var x = cljs.core.first(arglist__4659);
      var y = cljs.core.first(cljs.core.next(arglist__4659));
      var more = cljs.core.rest(cljs.core.next(arglist__4659));
      return G__4655__delegate(x, y, more)
    };
    G__4655.cljs$lang$arity$variadic = G__4655__delegate;
    return G__4655
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(function() {
    var or__3548__auto____4660 = x == null;
    if(or__3548__auto____4660) {
      return or__3548__auto____4660
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__4661 = null;
  var G__4661__2 = function(o, k) {
    return null
  };
  var G__4661__3 = function(o, k, not_found) {
    return not_found
  };
  G__4661 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4661__2.call(this, o, k);
      case 3:
        return G__4661__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4661
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__4662 = null;
  var G__4662__2 = function(_, f) {
    return f.call(null)
  };
  var G__4662__3 = function(_, f, start) {
    return start
  };
  G__4662 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4662__2.call(this, _, f);
      case 3:
        return G__4662__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4662
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__4663 = null;
  var G__4663__2 = function(_, n) {
    return null
  };
  var G__4663__3 = function(_, n, not_found) {
    return not_found
  };
  G__4663 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4663__2.call(this, _, n);
      case 3:
        return G__4663__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4663
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__4664 = cljs.core._nth.call(null, cicoll, 0);
      var n__4665 = 1;
      while(true) {
        if(n__4665 < cljs.core._count.call(null, cicoll)) {
          var nval__4666 = f.call(null, val__4664, cljs.core._nth.call(null, cicoll, n__4665));
          if(cljs.core.reduced_QMARK_.call(null, nval__4666)) {
            return cljs.core.deref.call(null, nval__4666)
          }else {
            var G__4673 = nval__4666;
            var G__4674 = n__4665 + 1;
            val__4664 = G__4673;
            n__4665 = G__4674;
            continue
          }
        }else {
          return val__4664
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__4667 = val;
    var n__4668 = 0;
    while(true) {
      if(n__4668 < cljs.core._count.call(null, cicoll)) {
        var nval__4669 = f.call(null, val__4667, cljs.core._nth.call(null, cicoll, n__4668));
        if(cljs.core.reduced_QMARK_.call(null, nval__4669)) {
          return cljs.core.deref.call(null, nval__4669)
        }else {
          var G__4675 = nval__4669;
          var G__4676 = n__4668 + 1;
          val__4667 = G__4675;
          n__4668 = G__4676;
          continue
        }
      }else {
        return val__4667
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__4670 = val;
    var n__4671 = idx;
    while(true) {
      if(n__4671 < cljs.core._count.call(null, cicoll)) {
        var nval__4672 = f.call(null, val__4670, cljs.core._nth.call(null, cicoll, n__4671));
        if(cljs.core.reduced_QMARK_.call(null, nval__4672)) {
          return cljs.core.deref.call(null, nval__4672)
        }else {
          var G__4677 = nval__4672;
          var G__4678 = n__4671 + 1;
          val__4670 = G__4677;
          n__4671 = G__4678;
          continue
        }
      }else {
        return val__4670
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4679 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4680 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__4681 = this;
  var this$__4682 = this;
  return cljs.core.pr_str.call(null, this$__4682)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__4683 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4683.a)) {
    return cljs.core.ci_reduce.call(null, this__4683.a, f, this__4683.a[this__4683.i], this__4683.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__4683.a[this__4683.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__4684 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4684.a)) {
    return cljs.core.ci_reduce.call(null, this__4684.a, f, start, this__4684.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__4685 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__4686 = this;
  return this__4686.a.length - this__4686.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__4687 = this;
  return this__4687.a[this__4687.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__4688 = this;
  if(this__4688.i + 1 < this__4688.a.length) {
    return new cljs.core.IndexedSeq(this__4688.a, this__4688.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4689 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__4690 = this;
  var i__4691 = n + this__4690.i;
  if(i__4691 < this__4690.a.length) {
    return this__4690.a[i__4691]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__4692 = this;
  var i__4693 = n + this__4692.i;
  if(i__4693 < this__4692.a.length) {
    return this__4692.a[i__4693]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__4694 = null;
  var G__4694__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__4694__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__4694 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4694__2.call(this, array, f);
      case 3:
        return G__4694__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4694
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__4695 = null;
  var G__4695__2 = function(array, k) {
    return array[k]
  };
  var G__4695__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__4695 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4695__2.call(this, array, k);
      case 3:
        return G__4695__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4695
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__4696 = null;
  var G__4696__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__4696__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__4696 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4696__2.call(this, array, n);
      case 3:
        return G__4696__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4696
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(coll != null) {
    if(function() {
      var G__4697__4698 = coll;
      if(G__4697__4698 != null) {
        if(function() {
          var or__3548__auto____4699 = G__4697__4698.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3548__auto____4699) {
            return or__3548__auto____4699
          }else {
            return G__4697__4698.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__4697__4698.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4697__4698)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4697__4698)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__4700__4701 = coll;
      if(G__4700__4701 != null) {
        if(function() {
          var or__3548__auto____4702 = G__4700__4701.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4702) {
            return or__3548__auto____4702
          }else {
            return G__4700__4701.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4700__4701.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4700__4701)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4700__4701)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__4703 = cljs.core.seq.call(null, coll);
      if(s__4703 != null) {
        return cljs.core._first.call(null, s__4703)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__4704__4705 = coll;
      if(G__4704__4705 != null) {
        if(function() {
          var or__3548__auto____4706 = G__4704__4705.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4706) {
            return or__3548__auto____4706
          }else {
            return G__4704__4705.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4704__4705.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4704__4705)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4704__4705)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__4707 = cljs.core.seq.call(null, coll);
      if(s__4707 != null) {
        return cljs.core._rest.call(null, s__4707)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__4708__4709 = coll;
      if(G__4708__4709 != null) {
        if(function() {
          var or__3548__auto____4710 = G__4708__4709.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4710) {
            return or__3548__auto____4710
          }else {
            return G__4708__4709.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4708__4709.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4708__4709)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4708__4709)
      }
    }()) {
      var coll__4711 = cljs.core._rest.call(null, coll);
      if(coll__4711 != null) {
        if(function() {
          var G__4712__4713 = coll__4711;
          if(G__4712__4713 != null) {
            if(function() {
              var or__3548__auto____4714 = G__4712__4713.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3548__auto____4714) {
                return or__3548__auto____4714
              }else {
                return G__4712__4713.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__4712__4713.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4712__4713)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4712__4713)
          }
        }()) {
          return coll__4711
        }else {
          return cljs.core._seq.call(null, coll__4711)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__4715 = cljs.core.next.call(null, s);
      s = G__4715;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__4716__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__4717 = conj.call(null, coll, x);
          var G__4718 = cljs.core.first.call(null, xs);
          var G__4719 = cljs.core.next.call(null, xs);
          coll = G__4717;
          x = G__4718;
          xs = G__4719;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__4716 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4716__delegate.call(this, coll, x, xs)
    };
    G__4716.cljs$lang$maxFixedArity = 2;
    G__4716.cljs$lang$applyTo = function(arglist__4720) {
      var coll = cljs.core.first(arglist__4720);
      var x = cljs.core.first(cljs.core.next(arglist__4720));
      var xs = cljs.core.rest(cljs.core.next(arglist__4720));
      return G__4716__delegate(coll, x, xs)
    };
    G__4716.cljs$lang$arity$variadic = G__4716__delegate;
    return G__4716
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__4721 = cljs.core.seq.call(null, coll);
  var acc__4722 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__4721)) {
      return acc__4722 + cljs.core._count.call(null, s__4721)
    }else {
      var G__4723 = cljs.core.next.call(null, s__4721);
      var G__4724 = acc__4722 + 1;
      s__4721 = G__4723;
      acc__4722 = G__4724;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll != null) {
      if(function() {
        var G__4725__4726 = coll;
        if(G__4725__4726 != null) {
          if(function() {
            var or__3548__auto____4727 = G__4725__4726.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____4727) {
              return or__3548__auto____4727
            }else {
              return G__4725__4726.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4725__4726.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4725__4726)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4725__4726)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }else {
      return null
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(coll != null) {
      if(function() {
        var G__4728__4729 = coll;
        if(G__4728__4729 != null) {
          if(function() {
            var or__3548__auto____4730 = G__4728__4729.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____4730) {
              return or__3548__auto____4730
            }else {
              return G__4728__4729.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4728__4729.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4728__4729)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4728__4729)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__4732__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__4731 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__4733 = ret__4731;
          var G__4734 = cljs.core.first.call(null, kvs);
          var G__4735 = cljs.core.second.call(null, kvs);
          var G__4736 = cljs.core.nnext.call(null, kvs);
          coll = G__4733;
          k = G__4734;
          v = G__4735;
          kvs = G__4736;
          continue
        }else {
          return ret__4731
        }
        break
      }
    };
    var G__4732 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4732__delegate.call(this, coll, k, v, kvs)
    };
    G__4732.cljs$lang$maxFixedArity = 3;
    G__4732.cljs$lang$applyTo = function(arglist__4737) {
      var coll = cljs.core.first(arglist__4737);
      var k = cljs.core.first(cljs.core.next(arglist__4737));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4737)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4737)));
      return G__4732__delegate(coll, k, v, kvs)
    };
    G__4732.cljs$lang$arity$variadic = G__4732__delegate;
    return G__4732
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__4739__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4738 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4740 = ret__4738;
          var G__4741 = cljs.core.first.call(null, ks);
          var G__4742 = cljs.core.next.call(null, ks);
          coll = G__4740;
          k = G__4741;
          ks = G__4742;
          continue
        }else {
          return ret__4738
        }
        break
      }
    };
    var G__4739 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4739__delegate.call(this, coll, k, ks)
    };
    G__4739.cljs$lang$maxFixedArity = 2;
    G__4739.cljs$lang$applyTo = function(arglist__4743) {
      var coll = cljs.core.first(arglist__4743);
      var k = cljs.core.first(cljs.core.next(arglist__4743));
      var ks = cljs.core.rest(cljs.core.next(arglist__4743));
      return G__4739__delegate(coll, k, ks)
    };
    G__4739.cljs$lang$arity$variadic = G__4739__delegate;
    return G__4739
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__4744__4745 = o;
    if(G__4744__4745 != null) {
      if(function() {
        var or__3548__auto____4746 = G__4744__4745.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3548__auto____4746) {
          return or__3548__auto____4746
        }else {
          return G__4744__4745.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__4744__4745.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4744__4745)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4744__4745)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__4748__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4747 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4749 = ret__4747;
          var G__4750 = cljs.core.first.call(null, ks);
          var G__4751 = cljs.core.next.call(null, ks);
          coll = G__4749;
          k = G__4750;
          ks = G__4751;
          continue
        }else {
          return ret__4747
        }
        break
      }
    };
    var G__4748 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4748__delegate.call(this, coll, k, ks)
    };
    G__4748.cljs$lang$maxFixedArity = 2;
    G__4748.cljs$lang$applyTo = function(arglist__4752) {
      var coll = cljs.core.first(arglist__4752);
      var k = cljs.core.first(cljs.core.next(arglist__4752));
      var ks = cljs.core.rest(cljs.core.next(arglist__4752));
      return G__4748__delegate(coll, k, ks)
    };
    G__4748.cljs$lang$arity$variadic = G__4748__delegate;
    return G__4748
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4753__4754 = x;
    if(G__4753__4754 != null) {
      if(function() {
        var or__3548__auto____4755 = G__4753__4754.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3548__auto____4755) {
          return or__3548__auto____4755
        }else {
          return G__4753__4754.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__4753__4754.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4753__4754)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4753__4754)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4756__4757 = x;
    if(G__4756__4757 != null) {
      if(function() {
        var or__3548__auto____4758 = G__4756__4757.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3548__auto____4758) {
          return or__3548__auto____4758
        }else {
          return G__4756__4757.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__4756__4757.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4756__4757)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4756__4757)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__4759__4760 = x;
  if(G__4759__4760 != null) {
    if(function() {
      var or__3548__auto____4761 = G__4759__4760.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3548__auto____4761) {
        return or__3548__auto____4761
      }else {
        return G__4759__4760.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__4759__4760.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4759__4760)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4759__4760)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__4762__4763 = x;
  if(G__4762__4763 != null) {
    if(function() {
      var or__3548__auto____4764 = G__4762__4763.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3548__auto____4764) {
        return or__3548__auto____4764
      }else {
        return G__4762__4763.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__4762__4763.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4762__4763)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4762__4763)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__4765__4766 = x;
  if(G__4765__4766 != null) {
    if(function() {
      var or__3548__auto____4767 = G__4765__4766.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3548__auto____4767) {
        return or__3548__auto____4767
      }else {
        return G__4765__4766.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__4765__4766.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4765__4766)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4765__4766)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__4768__4769 = x;
  if(G__4768__4769 != null) {
    if(function() {
      var or__3548__auto____4770 = G__4768__4769.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3548__auto____4770) {
        return or__3548__auto____4770
      }else {
        return G__4768__4769.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__4768__4769.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4768__4769)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4768__4769)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__4771__4772 = x;
  if(G__4771__4772 != null) {
    if(function() {
      var or__3548__auto____4773 = G__4771__4772.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3548__auto____4773) {
        return or__3548__auto____4773
      }else {
        return G__4771__4772.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__4771__4772.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4771__4772)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4771__4772)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4774__4775 = x;
    if(G__4774__4775 != null) {
      if(function() {
        var or__3548__auto____4776 = G__4774__4775.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3548__auto____4776) {
          return or__3548__auto____4776
        }else {
          return G__4774__4775.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__4774__4775.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4774__4775)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4774__4775)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__4777__4778 = x;
  if(G__4777__4778 != null) {
    if(function() {
      var or__3548__auto____4779 = G__4777__4778.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3548__auto____4779) {
        return or__3548__auto____4779
      }else {
        return G__4777__4778.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__4777__4778.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4777__4778)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4777__4778)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__4780__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__4780 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4780__delegate.call(this, keyvals)
    };
    G__4780.cljs$lang$maxFixedArity = 0;
    G__4780.cljs$lang$applyTo = function(arglist__4781) {
      var keyvals = cljs.core.seq(arglist__4781);
      return G__4780__delegate(keyvals)
    };
    G__4780.cljs$lang$arity$variadic = G__4780__delegate;
    return G__4780
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__4782 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__4782.push(key)
  });
  return keys__4782
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__4783 = i;
  var j__4784 = j;
  var len__4785 = len;
  while(true) {
    if(len__4785 === 0) {
      return to
    }else {
      to[j__4784] = from[i__4783];
      var G__4786 = i__4783 + 1;
      var G__4787 = j__4784 + 1;
      var G__4788 = len__4785 - 1;
      i__4783 = G__4786;
      j__4784 = G__4787;
      len__4785 = G__4788;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__4789 = i + (len - 1);
  var j__4790 = j + (len - 1);
  var len__4791 = len;
  while(true) {
    if(len__4791 === 0) {
      return to
    }else {
      to[j__4790] = from[i__4789];
      var G__4792 = i__4789 - 1;
      var G__4793 = j__4790 - 1;
      var G__4794 = len__4791 - 1;
      i__4789 = G__4792;
      j__4790 = G__4793;
      len__4791 = G__4794;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__4795__4796 = s;
    if(G__4795__4796 != null) {
      if(function() {
        var or__3548__auto____4797 = G__4795__4796.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3548__auto____4797) {
          return or__3548__auto____4797
        }else {
          return G__4795__4796.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__4795__4796.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4795__4796)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4795__4796)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__4798__4799 = s;
  if(G__4798__4799 != null) {
    if(function() {
      var or__3548__auto____4800 = G__4798__4799.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3548__auto____4800) {
        return or__3548__auto____4800
      }else {
        return G__4798__4799.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__4798__4799.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4798__4799)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4798__4799)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____4801 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4801)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____4802 = x.charAt(0) === "\ufdd0";
      if(or__3548__auto____4802) {
        return or__3548__auto____4802
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3546__auto____4801
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____4803 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4803)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3546__auto____4803
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____4804 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4804)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3546__auto____4804
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3548__auto____4805 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3548__auto____4805) {
    return or__3548__auto____4805
  }else {
    var G__4806__4807 = f;
    if(G__4806__4807 != null) {
      if(function() {
        var or__3548__auto____4808 = G__4806__4807.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3548__auto____4808) {
          return or__3548__auto____4808
        }else {
          return G__4806__4807.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__4806__4807.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4806__4807)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4806__4807)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____4809 = cljs.core.number_QMARK_.call(null, n);
  if(and__3546__auto____4809) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____4809
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4810 = coll;
    if(cljs.core.truth_(and__3546__auto____4810)) {
      var and__3546__auto____4811 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3546__auto____4811) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____4811
      }
    }else {
      return and__3546__auto____4810
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__4816__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__4812 = cljs.core.set([y, x]);
        var xs__4813 = more;
        while(true) {
          var x__4814 = cljs.core.first.call(null, xs__4813);
          var etc__4815 = cljs.core.next.call(null, xs__4813);
          if(cljs.core.truth_(xs__4813)) {
            if(cljs.core.contains_QMARK_.call(null, s__4812, x__4814)) {
              return false
            }else {
              var G__4817 = cljs.core.conj.call(null, s__4812, x__4814);
              var G__4818 = etc__4815;
              s__4812 = G__4817;
              xs__4813 = G__4818;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__4816 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4816__delegate.call(this, x, y, more)
    };
    G__4816.cljs$lang$maxFixedArity = 2;
    G__4816.cljs$lang$applyTo = function(arglist__4819) {
      var x = cljs.core.first(arglist__4819);
      var y = cljs.core.first(cljs.core.next(arglist__4819));
      var more = cljs.core.rest(cljs.core.next(arglist__4819));
      return G__4816__delegate(x, y, more)
    };
    G__4816.cljs$lang$arity$variadic = G__4816__delegate;
    return G__4816
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__4820 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__4820)) {
        return r__4820
      }else {
        if(cljs.core.truth_(r__4820)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__4821 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__4821, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__4821)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3695__auto____4822 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____4822)) {
      var s__4823 = temp__3695__auto____4822;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__4823), cljs.core.next.call(null, s__4823))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__4824 = val;
    var coll__4825 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__4825)) {
        var nval__4826 = f.call(null, val__4824, cljs.core.first.call(null, coll__4825));
        if(cljs.core.reduced_QMARK_.call(null, nval__4826)) {
          return cljs.core.deref.call(null, nval__4826)
        }else {
          var G__4827 = nval__4826;
          var G__4828 = cljs.core.next.call(null, coll__4825);
          val__4824 = G__4827;
          coll__4825 = G__4828;
          continue
        }
      }else {
        return val__4824
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__4829__4830 = coll;
      if(G__4829__4830 != null) {
        if(function() {
          var or__3548__auto____4831 = G__4829__4830.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____4831) {
            return or__3548__auto____4831
          }else {
            return G__4829__4830.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4829__4830.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4829__4830)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4829__4830)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__4832__4833 = coll;
      if(G__4832__4833 != null) {
        if(function() {
          var or__3548__auto____4834 = G__4832__4833.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____4834) {
            return or__3548__auto____4834
          }else {
            return G__4832__4833.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4832__4833.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4832__4833)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4832__4833)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__4835 = this;
  return this__4835.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__4836__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__4836 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4836__delegate.call(this, x, y, more)
    };
    G__4836.cljs$lang$maxFixedArity = 2;
    G__4836.cljs$lang$applyTo = function(arglist__4837) {
      var x = cljs.core.first(arglist__4837);
      var y = cljs.core.first(cljs.core.next(arglist__4837));
      var more = cljs.core.rest(cljs.core.next(arglist__4837));
      return G__4836__delegate(x, y, more)
    };
    G__4836.cljs$lang$arity$variadic = G__4836__delegate;
    return G__4836
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__4838__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__4838 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4838__delegate.call(this, x, y, more)
    };
    G__4838.cljs$lang$maxFixedArity = 2;
    G__4838.cljs$lang$applyTo = function(arglist__4839) {
      var x = cljs.core.first(arglist__4839);
      var y = cljs.core.first(cljs.core.next(arglist__4839));
      var more = cljs.core.rest(cljs.core.next(arglist__4839));
      return G__4838__delegate(x, y, more)
    };
    G__4838.cljs$lang$arity$variadic = G__4838__delegate;
    return G__4838
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__4840__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__4840 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4840__delegate.call(this, x, y, more)
    };
    G__4840.cljs$lang$maxFixedArity = 2;
    G__4840.cljs$lang$applyTo = function(arglist__4841) {
      var x = cljs.core.first(arglist__4841);
      var y = cljs.core.first(cljs.core.next(arglist__4841));
      var more = cljs.core.rest(cljs.core.next(arglist__4841));
      return G__4840__delegate(x, y, more)
    };
    G__4840.cljs$lang$arity$variadic = G__4840__delegate;
    return G__4840
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__4842__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__4842 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4842__delegate.call(this, x, y, more)
    };
    G__4842.cljs$lang$maxFixedArity = 2;
    G__4842.cljs$lang$applyTo = function(arglist__4843) {
      var x = cljs.core.first(arglist__4843);
      var y = cljs.core.first(cljs.core.next(arglist__4843));
      var more = cljs.core.rest(cljs.core.next(arglist__4843));
      return G__4842__delegate(x, y, more)
    };
    G__4842.cljs$lang$arity$variadic = G__4842__delegate;
    return G__4842
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__4844__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4845 = y;
            var G__4846 = cljs.core.first.call(null, more);
            var G__4847 = cljs.core.next.call(null, more);
            x = G__4845;
            y = G__4846;
            more = G__4847;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4844 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4844__delegate.call(this, x, y, more)
    };
    G__4844.cljs$lang$maxFixedArity = 2;
    G__4844.cljs$lang$applyTo = function(arglist__4848) {
      var x = cljs.core.first(arglist__4848);
      var y = cljs.core.first(cljs.core.next(arglist__4848));
      var more = cljs.core.rest(cljs.core.next(arglist__4848));
      return G__4844__delegate(x, y, more)
    };
    G__4844.cljs$lang$arity$variadic = G__4844__delegate;
    return G__4844
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__4849__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4850 = y;
            var G__4851 = cljs.core.first.call(null, more);
            var G__4852 = cljs.core.next.call(null, more);
            x = G__4850;
            y = G__4851;
            more = G__4852;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4849 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4849__delegate.call(this, x, y, more)
    };
    G__4849.cljs$lang$maxFixedArity = 2;
    G__4849.cljs$lang$applyTo = function(arglist__4853) {
      var x = cljs.core.first(arglist__4853);
      var y = cljs.core.first(cljs.core.next(arglist__4853));
      var more = cljs.core.rest(cljs.core.next(arglist__4853));
      return G__4849__delegate(x, y, more)
    };
    G__4849.cljs$lang$arity$variadic = G__4849__delegate;
    return G__4849
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__4854__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4855 = y;
            var G__4856 = cljs.core.first.call(null, more);
            var G__4857 = cljs.core.next.call(null, more);
            x = G__4855;
            y = G__4856;
            more = G__4857;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4854 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4854__delegate.call(this, x, y, more)
    };
    G__4854.cljs$lang$maxFixedArity = 2;
    G__4854.cljs$lang$applyTo = function(arglist__4858) {
      var x = cljs.core.first(arglist__4858);
      var y = cljs.core.first(cljs.core.next(arglist__4858));
      var more = cljs.core.rest(cljs.core.next(arglist__4858));
      return G__4854__delegate(x, y, more)
    };
    G__4854.cljs$lang$arity$variadic = G__4854__delegate;
    return G__4854
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__4859__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4860 = y;
            var G__4861 = cljs.core.first.call(null, more);
            var G__4862 = cljs.core.next.call(null, more);
            x = G__4860;
            y = G__4861;
            more = G__4862;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4859 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4859__delegate.call(this, x, y, more)
    };
    G__4859.cljs$lang$maxFixedArity = 2;
    G__4859.cljs$lang$applyTo = function(arglist__4863) {
      var x = cljs.core.first(arglist__4863);
      var y = cljs.core.first(cljs.core.next(arglist__4863));
      var more = cljs.core.rest(cljs.core.next(arglist__4863));
      return G__4859__delegate(x, y, more)
    };
    G__4859.cljs$lang$arity$variadic = G__4859__delegate;
    return G__4859
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__4864__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__4864 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4864__delegate.call(this, x, y, more)
    };
    G__4864.cljs$lang$maxFixedArity = 2;
    G__4864.cljs$lang$applyTo = function(arglist__4865) {
      var x = cljs.core.first(arglist__4865);
      var y = cljs.core.first(cljs.core.next(arglist__4865));
      var more = cljs.core.rest(cljs.core.next(arglist__4865));
      return G__4864__delegate(x, y, more)
    };
    G__4864.cljs$lang$arity$variadic = G__4864__delegate;
    return G__4864
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__4866__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__4866 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4866__delegate.call(this, x, y, more)
    };
    G__4866.cljs$lang$maxFixedArity = 2;
    G__4866.cljs$lang$applyTo = function(arglist__4867) {
      var x = cljs.core.first(arglist__4867);
      var y = cljs.core.first(cljs.core.next(arglist__4867));
      var more = cljs.core.rest(cljs.core.next(arglist__4867));
      return G__4866__delegate(x, y, more)
    };
    G__4866.cljs$lang$arity$variadic = G__4866__delegate;
    return G__4866
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__4868 = n % d;
  return cljs.core.fix.call(null, (n - rem__4868) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__4869 = cljs.core.quot.call(null, n, d);
  return n - d * q__4869
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(n) {
  var c__4870 = 0;
  var n__4871 = n;
  while(true) {
    if(n__4871 === 0) {
      return c__4870
    }else {
      var G__4872 = c__4870 + 1;
      var G__4873 = n__4871 & n__4871 - 1;
      c__4870 = G__4872;
      n__4871 = G__4873;
      continue
    }
    break
  }
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__4874__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4875 = y;
            var G__4876 = cljs.core.first.call(null, more);
            var G__4877 = cljs.core.next.call(null, more);
            x = G__4875;
            y = G__4876;
            more = G__4877;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4874 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4874__delegate.call(this, x, y, more)
    };
    G__4874.cljs$lang$maxFixedArity = 2;
    G__4874.cljs$lang$applyTo = function(arglist__4878) {
      var x = cljs.core.first(arglist__4878);
      var y = cljs.core.first(cljs.core.next(arglist__4878));
      var more = cljs.core.rest(cljs.core.next(arglist__4878));
      return G__4874__delegate(x, y, more)
    };
    G__4874.cljs$lang$arity$variadic = G__4874__delegate;
    return G__4874
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__4879 = n;
  var xs__4880 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____4881 = xs__4880;
      if(cljs.core.truth_(and__3546__auto____4881)) {
        return n__4879 > 0
      }else {
        return and__3546__auto____4881
      }
    }())) {
      var G__4882 = n__4879 - 1;
      var G__4883 = cljs.core.next.call(null, xs__4880);
      n__4879 = G__4882;
      xs__4880 = G__4883;
      continue
    }else {
      return xs__4880
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__4884__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4885 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__4886 = cljs.core.next.call(null, more);
            sb = G__4885;
            more = G__4886;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__4884 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4884__delegate.call(this, x, ys)
    };
    G__4884.cljs$lang$maxFixedArity = 1;
    G__4884.cljs$lang$applyTo = function(arglist__4887) {
      var x = cljs.core.first(arglist__4887);
      var ys = cljs.core.rest(arglist__4887);
      return G__4884__delegate(x, ys)
    };
    G__4884.cljs$lang$arity$variadic = G__4884__delegate;
    return G__4884
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__4888__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4889 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__4890 = cljs.core.next.call(null, more);
            sb = G__4889;
            more = G__4890;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__4888 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4888__delegate.call(this, x, ys)
    };
    G__4888.cljs$lang$maxFixedArity = 1;
    G__4888.cljs$lang$applyTo = function(arglist__4891) {
      var x = cljs.core.first(arglist__4891);
      var ys = cljs.core.rest(arglist__4891);
      return G__4888__delegate(x, ys)
    };
    G__4888.cljs$lang$arity$variadic = G__4888__delegate;
    return G__4888
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__4892 = cljs.core.seq.call(null, x);
    var ys__4893 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__4892 == null) {
        return ys__4893 == null
      }else {
        if(ys__4893 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__4892), cljs.core.first.call(null, ys__4893))) {
            var G__4894 = cljs.core.next.call(null, xs__4892);
            var G__4895 = cljs.core.next.call(null, ys__4893);
            xs__4892 = G__4894;
            ys__4893 = G__4895;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__4896_SHARP_, p2__4897_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__4896_SHARP_, cljs.core.hash.call(null, p2__4897_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__4898 = 0;
  var s__4899 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__4899)) {
      var e__4900 = cljs.core.first.call(null, s__4899);
      var G__4901 = (h__4898 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__4900)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__4900)))) % 4503599627370496;
      var G__4902 = cljs.core.next.call(null, s__4899);
      h__4898 = G__4901;
      s__4899 = G__4902;
      continue
    }else {
      return h__4898
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__4903 = 0;
  var s__4904 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__4904)) {
      var e__4905 = cljs.core.first.call(null, s__4904);
      var G__4906 = (h__4903 + cljs.core.hash.call(null, e__4905)) % 4503599627370496;
      var G__4907 = cljs.core.next.call(null, s__4904);
      h__4903 = G__4906;
      s__4904 = G__4907;
      continue
    }else {
      return h__4903
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__4908__4909 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__4908__4909)) {
    var G__4911__4913 = cljs.core.first.call(null, G__4908__4909);
    var vec__4912__4914 = G__4911__4913;
    var key_name__4915 = cljs.core.nth.call(null, vec__4912__4914, 0, null);
    var f__4916 = cljs.core.nth.call(null, vec__4912__4914, 1, null);
    var G__4908__4917 = G__4908__4909;
    var G__4911__4918 = G__4911__4913;
    var G__4908__4919 = G__4908__4917;
    while(true) {
      var vec__4920__4921 = G__4911__4918;
      var key_name__4922 = cljs.core.nth.call(null, vec__4920__4921, 0, null);
      var f__4923 = cljs.core.nth.call(null, vec__4920__4921, 1, null);
      var G__4908__4924 = G__4908__4919;
      var str_name__4925 = cljs.core.name.call(null, key_name__4922);
      obj[str_name__4925] = f__4923;
      var temp__3698__auto____4926 = cljs.core.next.call(null, G__4908__4924);
      if(cljs.core.truth_(temp__3698__auto____4926)) {
        var G__4908__4927 = temp__3698__auto____4926;
        var G__4928 = cljs.core.first.call(null, G__4908__4927);
        var G__4929 = G__4908__4927;
        G__4911__4918 = G__4928;
        G__4908__4919 = G__4929;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4930 = this;
  var h__364__auto____4931 = this__4930.__hash;
  if(h__364__auto____4931 != null) {
    return h__364__auto____4931
  }else {
    var h__364__auto____4932 = cljs.core.hash_coll.call(null, coll);
    this__4930.__hash = h__364__auto____4932;
    return h__364__auto____4932
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4933 = this;
  return new cljs.core.List(this__4933.meta, o, coll, this__4933.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__4934 = this;
  var this$__4935 = this;
  return cljs.core.pr_str.call(null, this$__4935)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4936 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4937 = this;
  return this__4937.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4938 = this;
  return this__4938.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4939 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4940 = this;
  return this__4940.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4941 = this;
  return this__4941.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4942 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4943 = this;
  return new cljs.core.List(meta, this__4943.first, this__4943.rest, this__4943.count, this__4943.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4944 = this;
  return this__4944.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4945 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4946 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4947 = this;
  return new cljs.core.List(this__4947.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__4948 = this;
  var this$__4949 = this;
  return cljs.core.pr_str.call(null, this$__4949)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4950 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4951 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4952 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4953 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4954 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4955 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4956 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4957 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4958 = this;
  return this__4958.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4959 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__4960__4961 = coll;
  if(G__4960__4961 != null) {
    if(function() {
      var or__3548__auto____4962 = G__4960__4961.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3548__auto____4962) {
        return or__3548__auto____4962
      }else {
        return G__4960__4961.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__4960__4961.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4960__4961)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4960__4961)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__4963) {
    var items = cljs.core.seq(arglist__4963);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4964 = this;
  var h__364__auto____4965 = this__4964.__hash;
  if(h__364__auto____4965 != null) {
    return h__364__auto____4965
  }else {
    var h__364__auto____4966 = cljs.core.hash_coll.call(null, coll);
    this__4964.__hash = h__364__auto____4966;
    return h__364__auto____4966
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4967 = this;
  return new cljs.core.Cons(null, o, coll, this__4967.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__4968 = this;
  var this$__4969 = this;
  return cljs.core.pr_str.call(null, this$__4969)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4970 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4971 = this;
  return this__4971.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4972 = this;
  if(this__4972.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__4972.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4973 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4974 = this;
  return new cljs.core.Cons(meta, this__4974.first, this__4974.rest, this__4974.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4975 = this;
  return this__4975.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4976 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4976.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3548__auto____4977 = coll == null;
    if(or__3548__auto____4977) {
      return or__3548__auto____4977
    }else {
      var G__4978__4979 = coll;
      if(G__4978__4979 != null) {
        if(function() {
          var or__3548__auto____4980 = G__4978__4979.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4980) {
            return or__3548__auto____4980
          }else {
            return G__4978__4979.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4978__4979.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4978__4979)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4978__4979)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__4981__4982 = x;
  if(G__4981__4982 != null) {
    if(function() {
      var or__3548__auto____4983 = G__4981__4982.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3548__auto____4983) {
        return or__3548__auto____4983
      }else {
        return G__4981__4982.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__4981__4982.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4981__4982)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4981__4982)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__4984 = null;
  var G__4984__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__4984__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__4984 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4984__2.call(this, string, f);
      case 3:
        return G__4984__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4984
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__4985 = null;
  var G__4985__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__4985__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__4985 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4985__2.call(this, string, k);
      case 3:
        return G__4985__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4985
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__4986 = null;
  var G__4986__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__4986__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__4986 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4986__2.call(this, string, n);
      case 3:
        return G__4986__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4986
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__4995 = null;
  var G__4995__2 = function(tsym4989, coll) {
    var tsym4989__4991 = this;
    var this$__4992 = tsym4989__4991;
    return cljs.core.get.call(null, coll, this$__4992.toString())
  };
  var G__4995__3 = function(tsym4990, coll, not_found) {
    var tsym4990__4993 = this;
    var this$__4994 = tsym4990__4993;
    return cljs.core.get.call(null, coll, this$__4994.toString(), not_found)
  };
  G__4995 = function(tsym4990, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4995__2.call(this, tsym4990, coll);
      case 3:
        return G__4995__3.call(this, tsym4990, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4995
}();
String.prototype.apply = function(tsym4987, args4988) {
  return tsym4987.call.apply(tsym4987, [tsym4987].concat(cljs.core.aclone.call(null, args4988)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__4996 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__4996
  }else {
    lazy_seq.x = x__4996.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4997 = this;
  var h__364__auto____4998 = this__4997.__hash;
  if(h__364__auto____4998 != null) {
    return h__364__auto____4998
  }else {
    var h__364__auto____4999 = cljs.core.hash_coll.call(null, coll);
    this__4997.__hash = h__364__auto____4999;
    return h__364__auto____4999
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5000 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__5001 = this;
  var this$__5002 = this;
  return cljs.core.pr_str.call(null, this$__5002)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5003 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5004 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5005 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5006 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5007 = this;
  return new cljs.core.LazySeq(meta, this__5007.realized, this__5007.x, this__5007.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5008 = this;
  return this__5008.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5009 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5009.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__5010 = [];
  var s__5011 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__5011))) {
      ary__5010.push(cljs.core.first.call(null, s__5011));
      var G__5012 = cljs.core.next.call(null, s__5011);
      s__5011 = G__5012;
      continue
    }else {
      return ary__5010
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__5013 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__5014 = 0;
  var xs__5015 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__5015)) {
      ret__5013[i__5014] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__5015));
      var G__5016 = i__5014 + 1;
      var G__5017 = cljs.core.next.call(null, xs__5015);
      i__5014 = G__5016;
      xs__5015 = G__5017;
      continue
    }else {
    }
    break
  }
  return ret__5013
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__5018 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5019 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5020 = 0;
      var s__5021 = s__5019;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5022 = s__5021;
          if(cljs.core.truth_(and__3546__auto____5022)) {
            return i__5020 < size
          }else {
            return and__3546__auto____5022
          }
        }())) {
          a__5018[i__5020] = cljs.core.first.call(null, s__5021);
          var G__5025 = i__5020 + 1;
          var G__5026 = cljs.core.next.call(null, s__5021);
          i__5020 = G__5025;
          s__5021 = G__5026;
          continue
        }else {
          return a__5018
        }
        break
      }
    }else {
      var n__685__auto____5023 = size;
      var i__5024 = 0;
      while(true) {
        if(i__5024 < n__685__auto____5023) {
          a__5018[i__5024] = init_val_or_seq;
          var G__5027 = i__5024 + 1;
          i__5024 = G__5027;
          continue
        }else {
        }
        break
      }
      return a__5018
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__5028 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5029 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5030 = 0;
      var s__5031 = s__5029;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5032 = s__5031;
          if(cljs.core.truth_(and__3546__auto____5032)) {
            return i__5030 < size
          }else {
            return and__3546__auto____5032
          }
        }())) {
          a__5028[i__5030] = cljs.core.first.call(null, s__5031);
          var G__5035 = i__5030 + 1;
          var G__5036 = cljs.core.next.call(null, s__5031);
          i__5030 = G__5035;
          s__5031 = G__5036;
          continue
        }else {
          return a__5028
        }
        break
      }
    }else {
      var n__685__auto____5033 = size;
      var i__5034 = 0;
      while(true) {
        if(i__5034 < n__685__auto____5033) {
          a__5028[i__5034] = init_val_or_seq;
          var G__5037 = i__5034 + 1;
          i__5034 = G__5037;
          continue
        }else {
        }
        break
      }
      return a__5028
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__5038 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5039 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5040 = 0;
      var s__5041 = s__5039;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5042 = s__5041;
          if(cljs.core.truth_(and__3546__auto____5042)) {
            return i__5040 < size
          }else {
            return and__3546__auto____5042
          }
        }())) {
          a__5038[i__5040] = cljs.core.first.call(null, s__5041);
          var G__5045 = i__5040 + 1;
          var G__5046 = cljs.core.next.call(null, s__5041);
          i__5040 = G__5045;
          s__5041 = G__5046;
          continue
        }else {
          return a__5038
        }
        break
      }
    }else {
      var n__685__auto____5043 = size;
      var i__5044 = 0;
      while(true) {
        if(i__5044 < n__685__auto____5043) {
          a__5038[i__5044] = init_val_or_seq;
          var G__5047 = i__5044 + 1;
          i__5044 = G__5047;
          continue
        }else {
        }
        break
      }
      return a__5038
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__5048 = s;
    var i__5049 = n;
    var sum__5050 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____5051 = i__5049 > 0;
        if(and__3546__auto____5051) {
          return cljs.core.seq.call(null, s__5048)
        }else {
          return and__3546__auto____5051
        }
      }())) {
        var G__5052 = cljs.core.next.call(null, s__5048);
        var G__5053 = i__5049 - 1;
        var G__5054 = sum__5050 + 1;
        s__5048 = G__5052;
        i__5049 = G__5053;
        sum__5050 = G__5054;
        continue
      }else {
        return sum__5050
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__5055 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__5055)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5055), concat.call(null, cljs.core.rest.call(null, s__5055), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__5058__delegate = function(x, y, zs) {
      var cat__5057 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__5056 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__5056)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__5056), cat.call(null, cljs.core.rest.call(null, xys__5056), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__5057.call(null, concat.call(null, x, y), zs)
    };
    var G__5058 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5058__delegate.call(this, x, y, zs)
    };
    G__5058.cljs$lang$maxFixedArity = 2;
    G__5058.cljs$lang$applyTo = function(arglist__5059) {
      var x = cljs.core.first(arglist__5059);
      var y = cljs.core.first(cljs.core.next(arglist__5059));
      var zs = cljs.core.rest(cljs.core.next(arglist__5059));
      return G__5058__delegate(x, y, zs)
    };
    G__5058.cljs$lang$arity$variadic = G__5058__delegate;
    return G__5058
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__5060__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__5060 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5060__delegate.call(this, a, b, c, d, more)
    };
    G__5060.cljs$lang$maxFixedArity = 4;
    G__5060.cljs$lang$applyTo = function(arglist__5061) {
      var a = cljs.core.first(arglist__5061);
      var b = cljs.core.first(cljs.core.next(arglist__5061));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5061)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5061))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5061))));
      return G__5060__delegate(a, b, c, d, more)
    };
    G__5060.cljs$lang$arity$variadic = G__5060__delegate;
    return G__5060
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__5062 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__5063 = cljs.core._first.call(null, args__5062);
    var args__5064 = cljs.core._rest.call(null, args__5062);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__5063)
      }else {
        return f.call(null, a__5063)
      }
    }else {
      var b__5065 = cljs.core._first.call(null, args__5064);
      var args__5066 = cljs.core._rest.call(null, args__5064);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__5063, b__5065)
        }else {
          return f.call(null, a__5063, b__5065)
        }
      }else {
        var c__5067 = cljs.core._first.call(null, args__5066);
        var args__5068 = cljs.core._rest.call(null, args__5066);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__5063, b__5065, c__5067)
          }else {
            return f.call(null, a__5063, b__5065, c__5067)
          }
        }else {
          var d__5069 = cljs.core._first.call(null, args__5068);
          var args__5070 = cljs.core._rest.call(null, args__5068);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__5063, b__5065, c__5067, d__5069)
            }else {
              return f.call(null, a__5063, b__5065, c__5067, d__5069)
            }
          }else {
            var e__5071 = cljs.core._first.call(null, args__5070);
            var args__5072 = cljs.core._rest.call(null, args__5070);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__5063, b__5065, c__5067, d__5069, e__5071)
              }else {
                return f.call(null, a__5063, b__5065, c__5067, d__5069, e__5071)
              }
            }else {
              var f__5073 = cljs.core._first.call(null, args__5072);
              var args__5074 = cljs.core._rest.call(null, args__5072);
              if(argc === 6) {
                if(f__5073.cljs$lang$arity$6) {
                  return f__5073.cljs$lang$arity$6(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073)
                }else {
                  return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073)
                }
              }else {
                var g__5075 = cljs.core._first.call(null, args__5074);
                var args__5076 = cljs.core._rest.call(null, args__5074);
                if(argc === 7) {
                  if(f__5073.cljs$lang$arity$7) {
                    return f__5073.cljs$lang$arity$7(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075)
                  }else {
                    return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075)
                  }
                }else {
                  var h__5077 = cljs.core._first.call(null, args__5076);
                  var args__5078 = cljs.core._rest.call(null, args__5076);
                  if(argc === 8) {
                    if(f__5073.cljs$lang$arity$8) {
                      return f__5073.cljs$lang$arity$8(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077)
                    }else {
                      return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077)
                    }
                  }else {
                    var i__5079 = cljs.core._first.call(null, args__5078);
                    var args__5080 = cljs.core._rest.call(null, args__5078);
                    if(argc === 9) {
                      if(f__5073.cljs$lang$arity$9) {
                        return f__5073.cljs$lang$arity$9(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079)
                      }else {
                        return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079)
                      }
                    }else {
                      var j__5081 = cljs.core._first.call(null, args__5080);
                      var args__5082 = cljs.core._rest.call(null, args__5080);
                      if(argc === 10) {
                        if(f__5073.cljs$lang$arity$10) {
                          return f__5073.cljs$lang$arity$10(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081)
                        }else {
                          return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081)
                        }
                      }else {
                        var k__5083 = cljs.core._first.call(null, args__5082);
                        var args__5084 = cljs.core._rest.call(null, args__5082);
                        if(argc === 11) {
                          if(f__5073.cljs$lang$arity$11) {
                            return f__5073.cljs$lang$arity$11(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083)
                          }else {
                            return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083)
                          }
                        }else {
                          var l__5085 = cljs.core._first.call(null, args__5084);
                          var args__5086 = cljs.core._rest.call(null, args__5084);
                          if(argc === 12) {
                            if(f__5073.cljs$lang$arity$12) {
                              return f__5073.cljs$lang$arity$12(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085)
                            }else {
                              return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085)
                            }
                          }else {
                            var m__5087 = cljs.core._first.call(null, args__5086);
                            var args__5088 = cljs.core._rest.call(null, args__5086);
                            if(argc === 13) {
                              if(f__5073.cljs$lang$arity$13) {
                                return f__5073.cljs$lang$arity$13(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087)
                              }else {
                                return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087)
                              }
                            }else {
                              var n__5089 = cljs.core._first.call(null, args__5088);
                              var args__5090 = cljs.core._rest.call(null, args__5088);
                              if(argc === 14) {
                                if(f__5073.cljs$lang$arity$14) {
                                  return f__5073.cljs$lang$arity$14(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089)
                                }else {
                                  return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089)
                                }
                              }else {
                                var o__5091 = cljs.core._first.call(null, args__5090);
                                var args__5092 = cljs.core._rest.call(null, args__5090);
                                if(argc === 15) {
                                  if(f__5073.cljs$lang$arity$15) {
                                    return f__5073.cljs$lang$arity$15(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091)
                                  }else {
                                    return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091)
                                  }
                                }else {
                                  var p__5093 = cljs.core._first.call(null, args__5092);
                                  var args__5094 = cljs.core._rest.call(null, args__5092);
                                  if(argc === 16) {
                                    if(f__5073.cljs$lang$arity$16) {
                                      return f__5073.cljs$lang$arity$16(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091, p__5093)
                                    }else {
                                      return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091, p__5093)
                                    }
                                  }else {
                                    var q__5095 = cljs.core._first.call(null, args__5094);
                                    var args__5096 = cljs.core._rest.call(null, args__5094);
                                    if(argc === 17) {
                                      if(f__5073.cljs$lang$arity$17) {
                                        return f__5073.cljs$lang$arity$17(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091, p__5093, q__5095)
                                      }else {
                                        return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091, p__5093, q__5095)
                                      }
                                    }else {
                                      var r__5097 = cljs.core._first.call(null, args__5096);
                                      var args__5098 = cljs.core._rest.call(null, args__5096);
                                      if(argc === 18) {
                                        if(f__5073.cljs$lang$arity$18) {
                                          return f__5073.cljs$lang$arity$18(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091, p__5093, q__5095, r__5097)
                                        }else {
                                          return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091, p__5093, q__5095, r__5097)
                                        }
                                      }else {
                                        var s__5099 = cljs.core._first.call(null, args__5098);
                                        var args__5100 = cljs.core._rest.call(null, args__5098);
                                        if(argc === 19) {
                                          if(f__5073.cljs$lang$arity$19) {
                                            return f__5073.cljs$lang$arity$19(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091, p__5093, q__5095, r__5097, s__5099)
                                          }else {
                                            return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091, p__5093, q__5095, r__5097, s__5099)
                                          }
                                        }else {
                                          var t__5101 = cljs.core._first.call(null, args__5100);
                                          var args__5102 = cljs.core._rest.call(null, args__5100);
                                          if(argc === 20) {
                                            if(f__5073.cljs$lang$arity$20) {
                                              return f__5073.cljs$lang$arity$20(a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091, p__5093, q__5095, r__5097, s__5099, t__5101)
                                            }else {
                                              return f__5073.call(null, a__5063, b__5065, c__5067, d__5069, e__5071, f__5073, g__5075, h__5077, i__5079, j__5081, k__5083, l__5085, m__5087, n__5089, o__5091, p__5093, q__5095, r__5097, s__5099, t__5101)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__5103 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5104 = cljs.core.bounded_count.call(null, args, fixed_arity__5103 + 1);
      if(bc__5104 <= fixed_arity__5103) {
        return cljs.core.apply_to.call(null, f, bc__5104, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__5105 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__5106 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5107 = cljs.core.bounded_count.call(null, arglist__5105, fixed_arity__5106 + 1);
      if(bc__5107 <= fixed_arity__5106) {
        return cljs.core.apply_to.call(null, f, bc__5107, arglist__5105)
      }else {
        return f.cljs$lang$applyTo(arglist__5105)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5105))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__5108 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__5109 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5110 = cljs.core.bounded_count.call(null, arglist__5108, fixed_arity__5109 + 1);
      if(bc__5110 <= fixed_arity__5109) {
        return cljs.core.apply_to.call(null, f, bc__5110, arglist__5108)
      }else {
        return f.cljs$lang$applyTo(arglist__5108)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5108))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__5111 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__5112 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5113 = cljs.core.bounded_count.call(null, arglist__5111, fixed_arity__5112 + 1);
      if(bc__5113 <= fixed_arity__5112) {
        return cljs.core.apply_to.call(null, f, bc__5113, arglist__5111)
      }else {
        return f.cljs$lang$applyTo(arglist__5111)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5111))
    }
  };
  var apply__6 = function() {
    var G__5117__delegate = function(f, a, b, c, d, args) {
      var arglist__5114 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__5115 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__5116 = cljs.core.bounded_count.call(null, arglist__5114, fixed_arity__5115 + 1);
        if(bc__5116 <= fixed_arity__5115) {
          return cljs.core.apply_to.call(null, f, bc__5116, arglist__5114)
        }else {
          return f.cljs$lang$applyTo(arglist__5114)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5114))
      }
    };
    var G__5117 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5117__delegate.call(this, f, a, b, c, d, args)
    };
    G__5117.cljs$lang$maxFixedArity = 5;
    G__5117.cljs$lang$applyTo = function(arglist__5118) {
      var f = cljs.core.first(arglist__5118);
      var a = cljs.core.first(cljs.core.next(arglist__5118));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5118)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5118))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5118)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5118)))));
      return G__5117__delegate(f, a, b, c, d, args)
    };
    G__5117.cljs$lang$arity$variadic = G__5117__delegate;
    return G__5117
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__5119) {
    var obj = cljs.core.first(arglist__5119);
    var f = cljs.core.first(cljs.core.next(arglist__5119));
    var args = cljs.core.rest(cljs.core.next(arglist__5119));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__5120__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__5120 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5120__delegate.call(this, x, y, more)
    };
    G__5120.cljs$lang$maxFixedArity = 2;
    G__5120.cljs$lang$applyTo = function(arglist__5121) {
      var x = cljs.core.first(arglist__5121);
      var y = cljs.core.first(cljs.core.next(arglist__5121));
      var more = cljs.core.rest(cljs.core.next(arglist__5121));
      return G__5120__delegate(x, y, more)
    };
    G__5120.cljs$lang$arity$variadic = G__5120__delegate;
    return G__5120
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__5122 = pred;
        var G__5123 = cljs.core.next.call(null, coll);
        pred = G__5122;
        coll = G__5123;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____5124 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____5124)) {
        return or__3548__auto____5124
      }else {
        var G__5125 = pred;
        var G__5126 = cljs.core.next.call(null, coll);
        pred = G__5125;
        coll = G__5126;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__5127 = null;
    var G__5127__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__5127__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__5127__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__5127__3 = function() {
      var G__5128__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__5128 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__5128__delegate.call(this, x, y, zs)
      };
      G__5128.cljs$lang$maxFixedArity = 2;
      G__5128.cljs$lang$applyTo = function(arglist__5129) {
        var x = cljs.core.first(arglist__5129);
        var y = cljs.core.first(cljs.core.next(arglist__5129));
        var zs = cljs.core.rest(cljs.core.next(arglist__5129));
        return G__5128__delegate(x, y, zs)
      };
      G__5128.cljs$lang$arity$variadic = G__5128__delegate;
      return G__5128
    }();
    G__5127 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__5127__0.call(this);
        case 1:
          return G__5127__1.call(this, x);
        case 2:
          return G__5127__2.call(this, x, y);
        default:
          return G__5127__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__5127.cljs$lang$maxFixedArity = 2;
    G__5127.cljs$lang$applyTo = G__5127__3.cljs$lang$applyTo;
    return G__5127
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__5130__delegate = function(args) {
      return x
    };
    var G__5130 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5130__delegate.call(this, args)
    };
    G__5130.cljs$lang$maxFixedArity = 0;
    G__5130.cljs$lang$applyTo = function(arglist__5131) {
      var args = cljs.core.seq(arglist__5131);
      return G__5130__delegate(args)
    };
    G__5130.cljs$lang$arity$variadic = G__5130__delegate;
    return G__5130
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__5135 = null;
      var G__5135__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__5135__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__5135__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__5135__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__5135__4 = function() {
        var G__5136__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__5136 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5136__delegate.call(this, x, y, z, args)
        };
        G__5136.cljs$lang$maxFixedArity = 3;
        G__5136.cljs$lang$applyTo = function(arglist__5137) {
          var x = cljs.core.first(arglist__5137);
          var y = cljs.core.first(cljs.core.next(arglist__5137));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5137)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5137)));
          return G__5136__delegate(x, y, z, args)
        };
        G__5136.cljs$lang$arity$variadic = G__5136__delegate;
        return G__5136
      }();
      G__5135 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5135__0.call(this);
          case 1:
            return G__5135__1.call(this, x);
          case 2:
            return G__5135__2.call(this, x, y);
          case 3:
            return G__5135__3.call(this, x, y, z);
          default:
            return G__5135__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5135.cljs$lang$maxFixedArity = 3;
      G__5135.cljs$lang$applyTo = G__5135__4.cljs$lang$applyTo;
      return G__5135
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__5138 = null;
      var G__5138__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__5138__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__5138__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__5138__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__5138__4 = function() {
        var G__5139__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__5139 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5139__delegate.call(this, x, y, z, args)
        };
        G__5139.cljs$lang$maxFixedArity = 3;
        G__5139.cljs$lang$applyTo = function(arglist__5140) {
          var x = cljs.core.first(arglist__5140);
          var y = cljs.core.first(cljs.core.next(arglist__5140));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5140)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5140)));
          return G__5139__delegate(x, y, z, args)
        };
        G__5139.cljs$lang$arity$variadic = G__5139__delegate;
        return G__5139
      }();
      G__5138 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5138__0.call(this);
          case 1:
            return G__5138__1.call(this, x);
          case 2:
            return G__5138__2.call(this, x, y);
          case 3:
            return G__5138__3.call(this, x, y, z);
          default:
            return G__5138__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5138.cljs$lang$maxFixedArity = 3;
      G__5138.cljs$lang$applyTo = G__5138__4.cljs$lang$applyTo;
      return G__5138
    }()
  };
  var comp__4 = function() {
    var G__5141__delegate = function(f1, f2, f3, fs) {
      var fs__5132 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__5142__delegate = function(args) {
          var ret__5133 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__5132), args);
          var fs__5134 = cljs.core.next.call(null, fs__5132);
          while(true) {
            if(cljs.core.truth_(fs__5134)) {
              var G__5143 = cljs.core.first.call(null, fs__5134).call(null, ret__5133);
              var G__5144 = cljs.core.next.call(null, fs__5134);
              ret__5133 = G__5143;
              fs__5134 = G__5144;
              continue
            }else {
              return ret__5133
            }
            break
          }
        };
        var G__5142 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5142__delegate.call(this, args)
        };
        G__5142.cljs$lang$maxFixedArity = 0;
        G__5142.cljs$lang$applyTo = function(arglist__5145) {
          var args = cljs.core.seq(arglist__5145);
          return G__5142__delegate(args)
        };
        G__5142.cljs$lang$arity$variadic = G__5142__delegate;
        return G__5142
      }()
    };
    var G__5141 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5141__delegate.call(this, f1, f2, f3, fs)
    };
    G__5141.cljs$lang$maxFixedArity = 3;
    G__5141.cljs$lang$applyTo = function(arglist__5146) {
      var f1 = cljs.core.first(arglist__5146);
      var f2 = cljs.core.first(cljs.core.next(arglist__5146));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5146)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5146)));
      return G__5141__delegate(f1, f2, f3, fs)
    };
    G__5141.cljs$lang$arity$variadic = G__5141__delegate;
    return G__5141
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__5147__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__5147 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5147__delegate.call(this, args)
      };
      G__5147.cljs$lang$maxFixedArity = 0;
      G__5147.cljs$lang$applyTo = function(arglist__5148) {
        var args = cljs.core.seq(arglist__5148);
        return G__5147__delegate(args)
      };
      G__5147.cljs$lang$arity$variadic = G__5147__delegate;
      return G__5147
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__5149__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__5149 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5149__delegate.call(this, args)
      };
      G__5149.cljs$lang$maxFixedArity = 0;
      G__5149.cljs$lang$applyTo = function(arglist__5150) {
        var args = cljs.core.seq(arglist__5150);
        return G__5149__delegate(args)
      };
      G__5149.cljs$lang$arity$variadic = G__5149__delegate;
      return G__5149
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__5151__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__5151 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5151__delegate.call(this, args)
      };
      G__5151.cljs$lang$maxFixedArity = 0;
      G__5151.cljs$lang$applyTo = function(arglist__5152) {
        var args = cljs.core.seq(arglist__5152);
        return G__5151__delegate(args)
      };
      G__5151.cljs$lang$arity$variadic = G__5151__delegate;
      return G__5151
    }()
  };
  var partial__5 = function() {
    var G__5153__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__5154__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__5154 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5154__delegate.call(this, args)
        };
        G__5154.cljs$lang$maxFixedArity = 0;
        G__5154.cljs$lang$applyTo = function(arglist__5155) {
          var args = cljs.core.seq(arglist__5155);
          return G__5154__delegate(args)
        };
        G__5154.cljs$lang$arity$variadic = G__5154__delegate;
        return G__5154
      }()
    };
    var G__5153 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5153__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__5153.cljs$lang$maxFixedArity = 4;
    G__5153.cljs$lang$applyTo = function(arglist__5156) {
      var f = cljs.core.first(arglist__5156);
      var arg1 = cljs.core.first(cljs.core.next(arglist__5156));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5156)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5156))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5156))));
      return G__5153__delegate(f, arg1, arg2, arg3, more)
    };
    G__5153.cljs$lang$arity$variadic = G__5153__delegate;
    return G__5153
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__5157 = null;
      var G__5157__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__5157__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__5157__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__5157__4 = function() {
        var G__5158__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__5158 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5158__delegate.call(this, a, b, c, ds)
        };
        G__5158.cljs$lang$maxFixedArity = 3;
        G__5158.cljs$lang$applyTo = function(arglist__5159) {
          var a = cljs.core.first(arglist__5159);
          var b = cljs.core.first(cljs.core.next(arglist__5159));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5159)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5159)));
          return G__5158__delegate(a, b, c, ds)
        };
        G__5158.cljs$lang$arity$variadic = G__5158__delegate;
        return G__5158
      }();
      G__5157 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__5157__1.call(this, a);
          case 2:
            return G__5157__2.call(this, a, b);
          case 3:
            return G__5157__3.call(this, a, b, c);
          default:
            return G__5157__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5157.cljs$lang$maxFixedArity = 3;
      G__5157.cljs$lang$applyTo = G__5157__4.cljs$lang$applyTo;
      return G__5157
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__5160 = null;
      var G__5160__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5160__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__5160__4 = function() {
        var G__5161__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__5161 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5161__delegate.call(this, a, b, c, ds)
        };
        G__5161.cljs$lang$maxFixedArity = 3;
        G__5161.cljs$lang$applyTo = function(arglist__5162) {
          var a = cljs.core.first(arglist__5162);
          var b = cljs.core.first(cljs.core.next(arglist__5162));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5162)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5162)));
          return G__5161__delegate(a, b, c, ds)
        };
        G__5161.cljs$lang$arity$variadic = G__5161__delegate;
        return G__5161
      }();
      G__5160 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5160__2.call(this, a, b);
          case 3:
            return G__5160__3.call(this, a, b, c);
          default:
            return G__5160__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5160.cljs$lang$maxFixedArity = 3;
      G__5160.cljs$lang$applyTo = G__5160__4.cljs$lang$applyTo;
      return G__5160
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__5163 = null;
      var G__5163__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5163__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__5163__4 = function() {
        var G__5164__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__5164 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5164__delegate.call(this, a, b, c, ds)
        };
        G__5164.cljs$lang$maxFixedArity = 3;
        G__5164.cljs$lang$applyTo = function(arglist__5165) {
          var a = cljs.core.first(arglist__5165);
          var b = cljs.core.first(cljs.core.next(arglist__5165));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5165)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5165)));
          return G__5164__delegate(a, b, c, ds)
        };
        G__5164.cljs$lang$arity$variadic = G__5164__delegate;
        return G__5164
      }();
      G__5163 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5163__2.call(this, a, b);
          case 3:
            return G__5163__3.call(this, a, b, c);
          default:
            return G__5163__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5163.cljs$lang$maxFixedArity = 3;
      G__5163.cljs$lang$applyTo = G__5163__4.cljs$lang$applyTo;
      return G__5163
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__5168 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5166 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5166)) {
        var s__5167 = temp__3698__auto____5166;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__5167)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__5167)))
      }else {
        return null
      }
    })
  };
  return mapi__5168.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5169 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5169)) {
      var s__5170 = temp__3698__auto____5169;
      var x__5171 = f.call(null, cljs.core.first.call(null, s__5170));
      if(x__5171 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__5170))
      }else {
        return cljs.core.cons.call(null, x__5171, keep.call(null, f, cljs.core.rest.call(null, s__5170)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__5181 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5178 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5178)) {
        var s__5179 = temp__3698__auto____5178;
        var x__5180 = f.call(null, idx, cljs.core.first.call(null, s__5179));
        if(x__5180 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5179))
        }else {
          return cljs.core.cons.call(null, x__5180, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5179)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__5181.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5188 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5188)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____5188
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5189 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5189)) {
            var and__3546__auto____5190 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5190)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____5190
            }
          }else {
            return and__3546__auto____5189
          }
        }())
      };
      var ep1__4 = function() {
        var G__5226__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5191 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5191)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____5191
            }
          }())
        };
        var G__5226 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5226__delegate.call(this, x, y, z, args)
        };
        G__5226.cljs$lang$maxFixedArity = 3;
        G__5226.cljs$lang$applyTo = function(arglist__5227) {
          var x = cljs.core.first(arglist__5227);
          var y = cljs.core.first(cljs.core.next(arglist__5227));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5227)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5227)));
          return G__5226__delegate(x, y, z, args)
        };
        G__5226.cljs$lang$arity$variadic = G__5226__delegate;
        return G__5226
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5192 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5192)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____5192
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5193 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5193)) {
            var and__3546__auto____5194 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5194)) {
              var and__3546__auto____5195 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5195)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____5195
              }
            }else {
              return and__3546__auto____5194
            }
          }else {
            return and__3546__auto____5193
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5196 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5196)) {
            var and__3546__auto____5197 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5197)) {
              var and__3546__auto____5198 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____5198)) {
                var and__3546__auto____5199 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____5199)) {
                  var and__3546__auto____5200 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5200)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____5200
                  }
                }else {
                  return and__3546__auto____5199
                }
              }else {
                return and__3546__auto____5198
              }
            }else {
              return and__3546__auto____5197
            }
          }else {
            return and__3546__auto____5196
          }
        }())
      };
      var ep2__4 = function() {
        var G__5228__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5201 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5201)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5172_SHARP_) {
                var and__3546__auto____5202 = p1.call(null, p1__5172_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5202)) {
                  return p2.call(null, p1__5172_SHARP_)
                }else {
                  return and__3546__auto____5202
                }
              }, args)
            }else {
              return and__3546__auto____5201
            }
          }())
        };
        var G__5228 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5228__delegate.call(this, x, y, z, args)
        };
        G__5228.cljs$lang$maxFixedArity = 3;
        G__5228.cljs$lang$applyTo = function(arglist__5229) {
          var x = cljs.core.first(arglist__5229);
          var y = cljs.core.first(cljs.core.next(arglist__5229));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5229)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5229)));
          return G__5228__delegate(x, y, z, args)
        };
        G__5228.cljs$lang$arity$variadic = G__5228__delegate;
        return G__5228
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5203 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5203)) {
            var and__3546__auto____5204 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5204)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____5204
            }
          }else {
            return and__3546__auto____5203
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5205 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5205)) {
            var and__3546__auto____5206 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5206)) {
              var and__3546__auto____5207 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5207)) {
                var and__3546__auto____5208 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5208)) {
                  var and__3546__auto____5209 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5209)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____5209
                  }
                }else {
                  return and__3546__auto____5208
                }
              }else {
                return and__3546__auto____5207
              }
            }else {
              return and__3546__auto____5206
            }
          }else {
            return and__3546__auto____5205
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5210 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5210)) {
            var and__3546__auto____5211 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5211)) {
              var and__3546__auto____5212 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5212)) {
                var and__3546__auto____5213 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5213)) {
                  var and__3546__auto____5214 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5214)) {
                    var and__3546__auto____5215 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____5215)) {
                      var and__3546__auto____5216 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____5216)) {
                        var and__3546__auto____5217 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____5217)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____5217
                        }
                      }else {
                        return and__3546__auto____5216
                      }
                    }else {
                      return and__3546__auto____5215
                    }
                  }else {
                    return and__3546__auto____5214
                  }
                }else {
                  return and__3546__auto____5213
                }
              }else {
                return and__3546__auto____5212
              }
            }else {
              return and__3546__auto____5211
            }
          }else {
            return and__3546__auto____5210
          }
        }())
      };
      var ep3__4 = function() {
        var G__5230__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5218 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5218)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5173_SHARP_) {
                var and__3546__auto____5219 = p1.call(null, p1__5173_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5219)) {
                  var and__3546__auto____5220 = p2.call(null, p1__5173_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____5220)) {
                    return p3.call(null, p1__5173_SHARP_)
                  }else {
                    return and__3546__auto____5220
                  }
                }else {
                  return and__3546__auto____5219
                }
              }, args)
            }else {
              return and__3546__auto____5218
            }
          }())
        };
        var G__5230 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5230__delegate.call(this, x, y, z, args)
        };
        G__5230.cljs$lang$maxFixedArity = 3;
        G__5230.cljs$lang$applyTo = function(arglist__5231) {
          var x = cljs.core.first(arglist__5231);
          var y = cljs.core.first(cljs.core.next(arglist__5231));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5231)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5231)));
          return G__5230__delegate(x, y, z, args)
        };
        G__5230.cljs$lang$arity$variadic = G__5230__delegate;
        return G__5230
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__5232__delegate = function(p1, p2, p3, ps) {
      var ps__5221 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__5174_SHARP_) {
            return p1__5174_SHARP_.call(null, x)
          }, ps__5221)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__5175_SHARP_) {
            var and__3546__auto____5222 = p1__5175_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5222)) {
              return p1__5175_SHARP_.call(null, y)
            }else {
              return and__3546__auto____5222
            }
          }, ps__5221)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__5176_SHARP_) {
            var and__3546__auto____5223 = p1__5176_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5223)) {
              var and__3546__auto____5224 = p1__5176_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____5224)) {
                return p1__5176_SHARP_.call(null, z)
              }else {
                return and__3546__auto____5224
              }
            }else {
              return and__3546__auto____5223
            }
          }, ps__5221)
        };
        var epn__4 = function() {
          var G__5233__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____5225 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____5225)) {
                return cljs.core.every_QMARK_.call(null, function(p1__5177_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__5177_SHARP_, args)
                }, ps__5221)
              }else {
                return and__3546__auto____5225
              }
            }())
          };
          var G__5233 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5233__delegate.call(this, x, y, z, args)
          };
          G__5233.cljs$lang$maxFixedArity = 3;
          G__5233.cljs$lang$applyTo = function(arglist__5234) {
            var x = cljs.core.first(arglist__5234);
            var y = cljs.core.first(cljs.core.next(arglist__5234));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5234)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5234)));
            return G__5233__delegate(x, y, z, args)
          };
          G__5233.cljs$lang$arity$variadic = G__5233__delegate;
          return G__5233
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__5232 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5232__delegate.call(this, p1, p2, p3, ps)
    };
    G__5232.cljs$lang$maxFixedArity = 3;
    G__5232.cljs$lang$applyTo = function(arglist__5235) {
      var p1 = cljs.core.first(arglist__5235);
      var p2 = cljs.core.first(cljs.core.next(arglist__5235));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5235)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5235)));
      return G__5232__delegate(p1, p2, p3, ps)
    };
    G__5232.cljs$lang$arity$variadic = G__5232__delegate;
    return G__5232
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3548__auto____5237 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5237)) {
          return or__3548__auto____5237
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3548__auto____5238 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5238)) {
          return or__3548__auto____5238
        }else {
          var or__3548__auto____5239 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5239)) {
            return or__3548__auto____5239
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__5275__delegate = function(x, y, z, args) {
          var or__3548__auto____5240 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5240)) {
            return or__3548__auto____5240
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__5275 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5275__delegate.call(this, x, y, z, args)
        };
        G__5275.cljs$lang$maxFixedArity = 3;
        G__5275.cljs$lang$applyTo = function(arglist__5276) {
          var x = cljs.core.first(arglist__5276);
          var y = cljs.core.first(cljs.core.next(arglist__5276));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5276)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5276)));
          return G__5275__delegate(x, y, z, args)
        };
        G__5275.cljs$lang$arity$variadic = G__5275__delegate;
        return G__5275
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3548__auto____5241 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5241)) {
          return or__3548__auto____5241
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3548__auto____5242 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5242)) {
          return or__3548__auto____5242
        }else {
          var or__3548__auto____5243 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5243)) {
            return or__3548__auto____5243
          }else {
            var or__3548__auto____5244 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5244)) {
              return or__3548__auto____5244
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3548__auto____5245 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5245)) {
          return or__3548__auto____5245
        }else {
          var or__3548__auto____5246 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5246)) {
            return or__3548__auto____5246
          }else {
            var or__3548__auto____5247 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____5247)) {
              return or__3548__auto____5247
            }else {
              var or__3548__auto____5248 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____5248)) {
                return or__3548__auto____5248
              }else {
                var or__3548__auto____5249 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5249)) {
                  return or__3548__auto____5249
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__5277__delegate = function(x, y, z, args) {
          var or__3548__auto____5250 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5250)) {
            return or__3548__auto____5250
          }else {
            return cljs.core.some.call(null, function(p1__5182_SHARP_) {
              var or__3548__auto____5251 = p1.call(null, p1__5182_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5251)) {
                return or__3548__auto____5251
              }else {
                return p2.call(null, p1__5182_SHARP_)
              }
            }, args)
          }
        };
        var G__5277 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5277__delegate.call(this, x, y, z, args)
        };
        G__5277.cljs$lang$maxFixedArity = 3;
        G__5277.cljs$lang$applyTo = function(arglist__5278) {
          var x = cljs.core.first(arglist__5278);
          var y = cljs.core.first(cljs.core.next(arglist__5278));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5278)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5278)));
          return G__5277__delegate(x, y, z, args)
        };
        G__5277.cljs$lang$arity$variadic = G__5277__delegate;
        return G__5277
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3548__auto____5252 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5252)) {
          return or__3548__auto____5252
        }else {
          var or__3548__auto____5253 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5253)) {
            return or__3548__auto____5253
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3548__auto____5254 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5254)) {
          return or__3548__auto____5254
        }else {
          var or__3548__auto____5255 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5255)) {
            return or__3548__auto____5255
          }else {
            var or__3548__auto____5256 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5256)) {
              return or__3548__auto____5256
            }else {
              var or__3548__auto____5257 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5257)) {
                return or__3548__auto____5257
              }else {
                var or__3548__auto____5258 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5258)) {
                  return or__3548__auto____5258
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3548__auto____5259 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5259)) {
          return or__3548__auto____5259
        }else {
          var or__3548__auto____5260 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5260)) {
            return or__3548__auto____5260
          }else {
            var or__3548__auto____5261 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5261)) {
              return or__3548__auto____5261
            }else {
              var or__3548__auto____5262 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5262)) {
                return or__3548__auto____5262
              }else {
                var or__3548__auto____5263 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5263)) {
                  return or__3548__auto____5263
                }else {
                  var or__3548__auto____5264 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____5264)) {
                    return or__3548__auto____5264
                  }else {
                    var or__3548__auto____5265 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____5265)) {
                      return or__3548__auto____5265
                    }else {
                      var or__3548__auto____5266 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____5266)) {
                        return or__3548__auto____5266
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__5279__delegate = function(x, y, z, args) {
          var or__3548__auto____5267 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5267)) {
            return or__3548__auto____5267
          }else {
            return cljs.core.some.call(null, function(p1__5183_SHARP_) {
              var or__3548__auto____5268 = p1.call(null, p1__5183_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5268)) {
                return or__3548__auto____5268
              }else {
                var or__3548__auto____5269 = p2.call(null, p1__5183_SHARP_);
                if(cljs.core.truth_(or__3548__auto____5269)) {
                  return or__3548__auto____5269
                }else {
                  return p3.call(null, p1__5183_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__5279 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5279__delegate.call(this, x, y, z, args)
        };
        G__5279.cljs$lang$maxFixedArity = 3;
        G__5279.cljs$lang$applyTo = function(arglist__5280) {
          var x = cljs.core.first(arglist__5280);
          var y = cljs.core.first(cljs.core.next(arglist__5280));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5280)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5280)));
          return G__5279__delegate(x, y, z, args)
        };
        G__5279.cljs$lang$arity$variadic = G__5279__delegate;
        return G__5279
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__5281__delegate = function(p1, p2, p3, ps) {
      var ps__5270 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__5184_SHARP_) {
            return p1__5184_SHARP_.call(null, x)
          }, ps__5270)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__5185_SHARP_) {
            var or__3548__auto____5271 = p1__5185_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5271)) {
              return or__3548__auto____5271
            }else {
              return p1__5185_SHARP_.call(null, y)
            }
          }, ps__5270)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__5186_SHARP_) {
            var or__3548__auto____5272 = p1__5186_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5272)) {
              return or__3548__auto____5272
            }else {
              var or__3548__auto____5273 = p1__5186_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5273)) {
                return or__3548__auto____5273
              }else {
                return p1__5186_SHARP_.call(null, z)
              }
            }
          }, ps__5270)
        };
        var spn__4 = function() {
          var G__5282__delegate = function(x, y, z, args) {
            var or__3548__auto____5274 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____5274)) {
              return or__3548__auto____5274
            }else {
              return cljs.core.some.call(null, function(p1__5187_SHARP_) {
                return cljs.core.some.call(null, p1__5187_SHARP_, args)
              }, ps__5270)
            }
          };
          var G__5282 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5282__delegate.call(this, x, y, z, args)
          };
          G__5282.cljs$lang$maxFixedArity = 3;
          G__5282.cljs$lang$applyTo = function(arglist__5283) {
            var x = cljs.core.first(arglist__5283);
            var y = cljs.core.first(cljs.core.next(arglist__5283));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5283)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5283)));
            return G__5282__delegate(x, y, z, args)
          };
          G__5282.cljs$lang$arity$variadic = G__5282__delegate;
          return G__5282
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__5281 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5281__delegate.call(this, p1, p2, p3, ps)
    };
    G__5281.cljs$lang$maxFixedArity = 3;
    G__5281.cljs$lang$applyTo = function(arglist__5284) {
      var p1 = cljs.core.first(arglist__5284);
      var p2 = cljs.core.first(cljs.core.next(arglist__5284));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5284)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5284)));
      return G__5281__delegate(p1, p2, p3, ps)
    };
    G__5281.cljs$lang$arity$variadic = G__5281__delegate;
    return G__5281
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5285 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5285)) {
        var s__5286 = temp__3698__auto____5285;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__5286)), map.call(null, f, cljs.core.rest.call(null, s__5286)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5287 = cljs.core.seq.call(null, c1);
      var s2__5288 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5289 = s1__5287;
        if(cljs.core.truth_(and__3546__auto____5289)) {
          return s2__5288
        }else {
          return and__3546__auto____5289
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5287), cljs.core.first.call(null, s2__5288)), map.call(null, f, cljs.core.rest.call(null, s1__5287), cljs.core.rest.call(null, s2__5288)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5290 = cljs.core.seq.call(null, c1);
      var s2__5291 = cljs.core.seq.call(null, c2);
      var s3__5292 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5293 = s1__5290;
        if(cljs.core.truth_(and__3546__auto____5293)) {
          var and__3546__auto____5294 = s2__5291;
          if(cljs.core.truth_(and__3546__auto____5294)) {
            return s3__5292
          }else {
            return and__3546__auto____5294
          }
        }else {
          return and__3546__auto____5293
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5290), cljs.core.first.call(null, s2__5291), cljs.core.first.call(null, s3__5292)), map.call(null, f, cljs.core.rest.call(null, s1__5290), cljs.core.rest.call(null, s2__5291), cljs.core.rest.call(null, s3__5292)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__5297__delegate = function(f, c1, c2, c3, colls) {
      var step__5296 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__5295 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5295)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__5295), step.call(null, map.call(null, cljs.core.rest, ss__5295)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__5236_SHARP_) {
        return cljs.core.apply.call(null, f, p1__5236_SHARP_)
      }, step__5296.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__5297 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5297__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5297.cljs$lang$maxFixedArity = 4;
    G__5297.cljs$lang$applyTo = function(arglist__5298) {
      var f = cljs.core.first(arglist__5298);
      var c1 = cljs.core.first(cljs.core.next(arglist__5298));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5298)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5298))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5298))));
      return G__5297__delegate(f, c1, c2, c3, colls)
    };
    G__5297.cljs$lang$arity$variadic = G__5297__delegate;
    return G__5297
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3698__auto____5299 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5299)) {
        var s__5300 = temp__3698__auto____5299;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5300), take.call(null, n - 1, cljs.core.rest.call(null, s__5300)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__5303 = function(n, coll) {
    while(true) {
      var s__5301 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5302 = n > 0;
        if(and__3546__auto____5302) {
          return s__5301
        }else {
          return and__3546__auto____5302
        }
      }())) {
        var G__5304 = n - 1;
        var G__5305 = cljs.core.rest.call(null, s__5301);
        n = G__5304;
        coll = G__5305;
        continue
      }else {
        return s__5301
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5303.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__5306 = cljs.core.seq.call(null, coll);
  var lead__5307 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__5307)) {
      var G__5308 = cljs.core.next.call(null, s__5306);
      var G__5309 = cljs.core.next.call(null, lead__5307);
      s__5306 = G__5308;
      lead__5307 = G__5309;
      continue
    }else {
      return s__5306
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__5312 = function(pred, coll) {
    while(true) {
      var s__5310 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5311 = s__5310;
        if(cljs.core.truth_(and__3546__auto____5311)) {
          return pred.call(null, cljs.core.first.call(null, s__5310))
        }else {
          return and__3546__auto____5311
        }
      }())) {
        var G__5313 = pred;
        var G__5314 = cljs.core.rest.call(null, s__5310);
        pred = G__5313;
        coll = G__5314;
        continue
      }else {
        return s__5310
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5312.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5315 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5315)) {
      var s__5316 = temp__3698__auto____5315;
      return cljs.core.concat.call(null, s__5316, cycle.call(null, s__5316))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5317 = cljs.core.seq.call(null, c1);
      var s2__5318 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5319 = s1__5317;
        if(cljs.core.truth_(and__3546__auto____5319)) {
          return s2__5318
        }else {
          return and__3546__auto____5319
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__5317), cljs.core.cons.call(null, cljs.core.first.call(null, s2__5318), interleave.call(null, cljs.core.rest.call(null, s1__5317), cljs.core.rest.call(null, s2__5318))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__5321__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__5320 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5320)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__5320), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__5320)))
        }else {
          return null
        }
      })
    };
    var G__5321 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5321__delegate.call(this, c1, c2, colls)
    };
    G__5321.cljs$lang$maxFixedArity = 2;
    G__5321.cljs$lang$applyTo = function(arglist__5322) {
      var c1 = cljs.core.first(arglist__5322);
      var c2 = cljs.core.first(cljs.core.next(arglist__5322));
      var colls = cljs.core.rest(cljs.core.next(arglist__5322));
      return G__5321__delegate(c1, c2, colls)
    };
    G__5321.cljs$lang$arity$variadic = G__5321__delegate;
    return G__5321
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__5325 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____5323 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____5323)) {
        var coll__5324 = temp__3695__auto____5323;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__5324), cat.call(null, cljs.core.rest.call(null, coll__5324), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__5325.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__5326__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__5326 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5326__delegate.call(this, f, coll, colls)
    };
    G__5326.cljs$lang$maxFixedArity = 2;
    G__5326.cljs$lang$applyTo = function(arglist__5327) {
      var f = cljs.core.first(arglist__5327);
      var coll = cljs.core.first(cljs.core.next(arglist__5327));
      var colls = cljs.core.rest(cljs.core.next(arglist__5327));
      return G__5326__delegate(f, coll, colls)
    };
    G__5326.cljs$lang$arity$variadic = G__5326__delegate;
    return G__5326
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5328 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5328)) {
      var s__5329 = temp__3698__auto____5328;
      var f__5330 = cljs.core.first.call(null, s__5329);
      var r__5331 = cljs.core.rest.call(null, s__5329);
      if(cljs.core.truth_(pred.call(null, f__5330))) {
        return cljs.core.cons.call(null, f__5330, filter.call(null, pred, r__5331))
      }else {
        return filter.call(null, pred, r__5331)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__5333 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__5333.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__5332_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__5332_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__5334__5335 = to;
    if(G__5334__5335 != null) {
      if(function() {
        var or__3548__auto____5336 = G__5334__5335.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3548__auto____5336) {
          return or__3548__auto____5336
        }else {
          return G__5334__5335.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__5334__5335.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5334__5335)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5334__5335)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__5337__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__5337 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5337__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5337.cljs$lang$maxFixedArity = 4;
    G__5337.cljs$lang$applyTo = function(arglist__5338) {
      var f = cljs.core.first(arglist__5338);
      var c1 = cljs.core.first(cljs.core.next(arglist__5338));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5338)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5338))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5338))));
      return G__5337__delegate(f, c1, c2, c3, colls)
    };
    G__5337.cljs$lang$arity$variadic = G__5337__delegate;
    return G__5337
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5339 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5339)) {
        var s__5340 = temp__3698__auto____5339;
        var p__5341 = cljs.core.take.call(null, n, s__5340);
        if(n === cljs.core.count.call(null, p__5341)) {
          return cljs.core.cons.call(null, p__5341, partition.call(null, n, step, cljs.core.drop.call(null, step, s__5340)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5342 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5342)) {
        var s__5343 = temp__3698__auto____5342;
        var p__5344 = cljs.core.take.call(null, n, s__5343);
        if(n === cljs.core.count.call(null, p__5344)) {
          return cljs.core.cons.call(null, p__5344, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__5343)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__5344, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__5345 = cljs.core.lookup_sentinel;
    var m__5346 = m;
    var ks__5347 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__5347)) {
        var m__5348 = cljs.core.get.call(null, m__5346, cljs.core.first.call(null, ks__5347), sentinel__5345);
        if(sentinel__5345 === m__5348) {
          return not_found
        }else {
          var G__5349 = sentinel__5345;
          var G__5350 = m__5348;
          var G__5351 = cljs.core.next.call(null, ks__5347);
          sentinel__5345 = G__5349;
          m__5346 = G__5350;
          ks__5347 = G__5351;
          continue
        }
      }else {
        return m__5346
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__5352, v) {
  var vec__5353__5354 = p__5352;
  var k__5355 = cljs.core.nth.call(null, vec__5353__5354, 0, null);
  var ks__5356 = cljs.core.nthnext.call(null, vec__5353__5354, 1);
  if(cljs.core.truth_(ks__5356)) {
    return cljs.core.assoc.call(null, m, k__5355, assoc_in.call(null, cljs.core.get.call(null, m, k__5355), ks__5356, v))
  }else {
    return cljs.core.assoc.call(null, m, k__5355, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__5357, f, args) {
    var vec__5358__5359 = p__5357;
    var k__5360 = cljs.core.nth.call(null, vec__5358__5359, 0, null);
    var ks__5361 = cljs.core.nthnext.call(null, vec__5358__5359, 1);
    if(cljs.core.truth_(ks__5361)) {
      return cljs.core.assoc.call(null, m, k__5360, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__5360), ks__5361, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__5360, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__5360), args))
    }
  };
  var update_in = function(m, p__5357, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__5357, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__5362) {
    var m = cljs.core.first(arglist__5362);
    var p__5357 = cljs.core.first(cljs.core.next(arglist__5362));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5362)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5362)));
    return update_in__delegate(m, p__5357, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5367 = this;
  var h__364__auto____5368 = this__5367.__hash;
  if(h__364__auto____5368 != null) {
    return h__364__auto____5368
  }else {
    var h__364__auto____5369 = cljs.core.hash_coll.call(null, coll);
    this__5367.__hash = h__364__auto____5369;
    return h__364__auto____5369
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5370 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5371 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5372 = this;
  var new_array__5373 = cljs.core.aclone.call(null, this__5372.array);
  new_array__5373[k] = v;
  return new cljs.core.Vector(this__5372.meta, new_array__5373, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__5402 = null;
  var G__5402__2 = function(tsym5365, k) {
    var this__5374 = this;
    var tsym5365__5375 = this;
    var coll__5376 = tsym5365__5375;
    return cljs.core._lookup.call(null, coll__5376, k)
  };
  var G__5402__3 = function(tsym5366, k, not_found) {
    var this__5377 = this;
    var tsym5366__5378 = this;
    var coll__5379 = tsym5366__5378;
    return cljs.core._lookup.call(null, coll__5379, k, not_found)
  };
  G__5402 = function(tsym5366, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5402__2.call(this, tsym5366, k);
      case 3:
        return G__5402__3.call(this, tsym5366, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5402
}();
cljs.core.Vector.prototype.apply = function(tsym5363, args5364) {
  return tsym5363.call.apply(tsym5363, [tsym5363].concat(cljs.core.aclone.call(null, args5364)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5380 = this;
  var new_array__5381 = cljs.core.aclone.call(null, this__5380.array);
  new_array__5381.push(o);
  return new cljs.core.Vector(this__5380.meta, new_array__5381, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__5382 = this;
  var this$__5383 = this;
  return cljs.core.pr_str.call(null, this$__5383)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5384 = this;
  return cljs.core.ci_reduce.call(null, this__5384.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5385 = this;
  return cljs.core.ci_reduce.call(null, this__5385.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5386 = this;
  if(this__5386.array.length > 0) {
    var vector_seq__5387 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5386.array.length) {
          return cljs.core.cons.call(null, this__5386.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5387.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5388 = this;
  return this__5388.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5389 = this;
  var count__5390 = this__5389.array.length;
  if(count__5390 > 0) {
    return this__5389.array[count__5390 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5391 = this;
  if(this__5391.array.length > 0) {
    var new_array__5392 = cljs.core.aclone.call(null, this__5391.array);
    new_array__5392.pop();
    return new cljs.core.Vector(this__5391.meta, new_array__5392, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5393 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5394 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5395 = this;
  return new cljs.core.Vector(meta, this__5395.array, this__5395.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5396 = this;
  return this__5396.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5398 = this;
  if(function() {
    var and__3546__auto____5399 = 0 <= n;
    if(and__3546__auto____5399) {
      return n < this__5398.array.length
    }else {
      return and__3546__auto____5399
    }
  }()) {
    return this__5398.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5400 = this;
  if(function() {
    var and__3546__auto____5401 = 0 <= n;
    if(and__3546__auto____5401) {
      return n < this__5400.array.length
    }else {
      return and__3546__auto____5401
    }
  }()) {
    return this__5400.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5397 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5397.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__455__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__5403 = pv.cnt;
  if(cnt__5403 < 32) {
    return 0
  }else {
    return cnt__5403 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__5404 = level;
  var ret__5405 = node;
  while(true) {
    if(ll__5404 === 0) {
      return ret__5405
    }else {
      var embed__5406 = ret__5405;
      var r__5407 = cljs.core.pv_fresh_node.call(null, edit);
      var ___5408 = cljs.core.pv_aset.call(null, r__5407, 0, embed__5406);
      var G__5409 = ll__5404 - 5;
      var G__5410 = r__5407;
      ll__5404 = G__5409;
      ret__5405 = G__5410;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__5411 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__5412 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__5411, subidx__5412, tailnode);
    return ret__5411
  }else {
    var temp__3695__auto____5413 = cljs.core.pv_aget.call(null, parent, subidx__5412);
    if(cljs.core.truth_(temp__3695__auto____5413)) {
      var child__5414 = temp__3695__auto____5413;
      var node_to_insert__5415 = push_tail.call(null, pv, level - 5, child__5414, tailnode);
      cljs.core.pv_aset.call(null, ret__5411, subidx__5412, node_to_insert__5415);
      return ret__5411
    }else {
      var node_to_insert__5416 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__5411, subidx__5412, node_to_insert__5416);
      return ret__5411
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3546__auto____5417 = 0 <= i;
    if(and__3546__auto____5417) {
      return i < pv.cnt
    }else {
      return and__3546__auto____5417
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__5418 = pv.root;
      var level__5419 = pv.shift;
      while(true) {
        if(level__5419 > 0) {
          var G__5420 = cljs.core.pv_aget.call(null, node__5418, i >>> level__5419 & 31);
          var G__5421 = level__5419 - 5;
          node__5418 = G__5420;
          level__5419 = G__5421;
          continue
        }else {
          return node__5418.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__5422 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__5422, i & 31, val);
    return ret__5422
  }else {
    var subidx__5423 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__5422, subidx__5423, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5423), i, val));
    return ret__5422
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__5424 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5425 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5424));
    if(function() {
      var and__3546__auto____5426 = new_child__5425 == null;
      if(and__3546__auto____5426) {
        return subidx__5424 === 0
      }else {
        return and__3546__auto____5426
      }
    }()) {
      return null
    }else {
      var ret__5427 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__5427, subidx__5424, new_child__5425);
      return ret__5427
    }
  }else {
    if(subidx__5424 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__5428 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__5428, subidx__5424, null);
        return ret__5428
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__5429 = cljs.core._count.call(null, v);
  if(c__5429 > 0) {
    if(void 0 === cljs.core.t5430) {
      cljs.core.t5430 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t5430.cljs$lang$type = true;
      cljs.core.t5430.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t5430")
      };
      cljs.core.t5430.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t5430.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__5431 = this;
        return vseq
      };
      cljs.core.t5430.prototype.cljs$core$ISeq$ = true;
      cljs.core.t5430.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__5432 = this;
        return cljs.core._nth.call(null, this__5432.v, this__5432.offset)
      };
      cljs.core.t5430.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__5433 = this;
        var offset__5434 = this__5433.offset + 1;
        if(offset__5434 < this__5433.c) {
          return this__5433.vector_seq.call(null, this__5433.v, offset__5434)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t5430.prototype.cljs$core$ASeq$ = true;
      cljs.core.t5430.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t5430.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__5435 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t5430.prototype.cljs$core$ISequential$ = true;
      cljs.core.t5430.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t5430.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__5436 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t5430.prototype.cljs$core$IMeta$ = true;
      cljs.core.t5430.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__5437 = this;
        return this__5437.__meta__389__auto__
      };
      cljs.core.t5430.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t5430.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__5438 = this;
        return new cljs.core.t5430(this__5438.c, this__5438.offset, this__5438.v, this__5438.vector_seq, __meta__389__auto__)
      };
      cljs.core.t5430
    }else {
    }
    return new cljs.core.t5430(c__5429, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5443 = this;
  return new cljs.core.TransientVector(this__5443.cnt, this__5443.shift, cljs.core.tv_editable_root.call(null, this__5443.root), cljs.core.tv_editable_tail.call(null, this__5443.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5444 = this;
  var h__364__auto____5445 = this__5444.__hash;
  if(h__364__auto____5445 != null) {
    return h__364__auto____5445
  }else {
    var h__364__auto____5446 = cljs.core.hash_coll.call(null, coll);
    this__5444.__hash = h__364__auto____5446;
    return h__364__auto____5446
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5447 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5448 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5449 = this;
  if(function() {
    var and__3546__auto____5450 = 0 <= k;
    if(and__3546__auto____5450) {
      return k < this__5449.cnt
    }else {
      return and__3546__auto____5450
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__5451 = cljs.core.aclone.call(null, this__5449.tail);
      new_tail__5451[k & 31] = v;
      return new cljs.core.PersistentVector(this__5449.meta, this__5449.cnt, this__5449.shift, this__5449.root, new_tail__5451, null)
    }else {
      return new cljs.core.PersistentVector(this__5449.meta, this__5449.cnt, this__5449.shift, cljs.core.do_assoc.call(null, coll, this__5449.shift, this__5449.root, k, v), this__5449.tail, null)
    }
  }else {
    if(k === this__5449.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__5449.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__5496 = null;
  var G__5496__2 = function(tsym5441, k) {
    var this__5452 = this;
    var tsym5441__5453 = this;
    var coll__5454 = tsym5441__5453;
    return cljs.core._lookup.call(null, coll__5454, k)
  };
  var G__5496__3 = function(tsym5442, k, not_found) {
    var this__5455 = this;
    var tsym5442__5456 = this;
    var coll__5457 = tsym5442__5456;
    return cljs.core._lookup.call(null, coll__5457, k, not_found)
  };
  G__5496 = function(tsym5442, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5496__2.call(this, tsym5442, k);
      case 3:
        return G__5496__3.call(this, tsym5442, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5496
}();
cljs.core.PersistentVector.prototype.apply = function(tsym5439, args5440) {
  return tsym5439.call.apply(tsym5439, [tsym5439].concat(cljs.core.aclone.call(null, args5440)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__5458 = this;
  var step_init__5459 = [0, init];
  var i__5460 = 0;
  while(true) {
    if(i__5460 < this__5458.cnt) {
      var arr__5461 = cljs.core.array_for.call(null, v, i__5460);
      var len__5462 = arr__5461.length;
      var init__5466 = function() {
        var j__5463 = 0;
        var init__5464 = step_init__5459[1];
        while(true) {
          if(j__5463 < len__5462) {
            var init__5465 = f.call(null, init__5464, j__5463 + i__5460, arr__5461[j__5463]);
            if(cljs.core.reduced_QMARK_.call(null, init__5465)) {
              return init__5465
            }else {
              var G__5497 = j__5463 + 1;
              var G__5498 = init__5465;
              j__5463 = G__5497;
              init__5464 = G__5498;
              continue
            }
          }else {
            step_init__5459[0] = len__5462;
            step_init__5459[1] = init__5464;
            return init__5464
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5466)) {
        return cljs.core.deref.call(null, init__5466)
      }else {
        var G__5499 = i__5460 + step_init__5459[0];
        i__5460 = G__5499;
        continue
      }
    }else {
      return step_init__5459[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5467 = this;
  if(this__5467.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__5468 = cljs.core.aclone.call(null, this__5467.tail);
    new_tail__5468.push(o);
    return new cljs.core.PersistentVector(this__5467.meta, this__5467.cnt + 1, this__5467.shift, this__5467.root, new_tail__5468, null)
  }else {
    var root_overflow_QMARK___5469 = this__5467.cnt >>> 5 > 1 << this__5467.shift;
    var new_shift__5470 = root_overflow_QMARK___5469 ? this__5467.shift + 5 : this__5467.shift;
    var new_root__5472 = root_overflow_QMARK___5469 ? function() {
      var n_r__5471 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__5471, 0, this__5467.root);
      cljs.core.pv_aset.call(null, n_r__5471, 1, cljs.core.new_path.call(null, null, this__5467.shift, new cljs.core.VectorNode(null, this__5467.tail)));
      return n_r__5471
    }() : cljs.core.push_tail.call(null, coll, this__5467.shift, this__5467.root, new cljs.core.VectorNode(null, this__5467.tail));
    return new cljs.core.PersistentVector(this__5467.meta, this__5467.cnt + 1, new_shift__5470, new_root__5472, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__5473 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__5474 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__5475 = this;
  var this$__5476 = this;
  return cljs.core.pr_str.call(null, this$__5476)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5477 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5478 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5479 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5480 = this;
  return this__5480.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5481 = this;
  if(this__5481.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__5481.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5482 = this;
  if(this__5482.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__5482.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5482.meta)
    }else {
      if(1 < this__5482.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__5482.meta, this__5482.cnt - 1, this__5482.shift, this__5482.root, this__5482.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__5483 = cljs.core.array_for.call(null, coll, this__5482.cnt - 2);
          var nr__5484 = cljs.core.pop_tail.call(null, coll, this__5482.shift, this__5482.root);
          var new_root__5485 = nr__5484 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__5484;
          var cnt_1__5486 = this__5482.cnt - 1;
          if(function() {
            var and__3546__auto____5487 = 5 < this__5482.shift;
            if(and__3546__auto____5487) {
              return cljs.core.pv_aget.call(null, new_root__5485, 1) == null
            }else {
              return and__3546__auto____5487
            }
          }()) {
            return new cljs.core.PersistentVector(this__5482.meta, cnt_1__5486, this__5482.shift - 5, cljs.core.pv_aget.call(null, new_root__5485, 0), new_tail__5483, null)
          }else {
            return new cljs.core.PersistentVector(this__5482.meta, cnt_1__5486, this__5482.shift, new_root__5485, new_tail__5483, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5489 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5490 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5491 = this;
  return new cljs.core.PersistentVector(meta, this__5491.cnt, this__5491.shift, this__5491.root, this__5491.tail, this__5491.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5492 = this;
  return this__5492.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5493 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5494 = this;
  if(function() {
    var and__3546__auto____5495 = 0 <= n;
    if(and__3546__auto____5495) {
      return n < this__5494.cnt
    }else {
      return and__3546__auto____5495
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5488 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5488.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__5500 = cljs.core.seq.call(null, xs);
  var out__5501 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__5500)) {
      var G__5502 = cljs.core.next.call(null, xs__5500);
      var G__5503 = cljs.core.conj_BANG_.call(null, out__5501, cljs.core.first.call(null, xs__5500));
      xs__5500 = G__5502;
      out__5501 = G__5503;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5501)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__5504) {
    var args = cljs.core.seq(arglist__5504);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5509 = this;
  var h__364__auto____5510 = this__5509.__hash;
  if(h__364__auto____5510 != null) {
    return h__364__auto____5510
  }else {
    var h__364__auto____5511 = cljs.core.hash_coll.call(null, coll);
    this__5509.__hash = h__364__auto____5511;
    return h__364__auto____5511
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5512 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5513 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__5514 = this;
  var v_pos__5515 = this__5514.start + key;
  return new cljs.core.Subvec(this__5514.meta, cljs.core._assoc.call(null, this__5514.v, v_pos__5515, val), this__5514.start, this__5514.end > v_pos__5515 + 1 ? this__5514.end : v_pos__5515 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__5539 = null;
  var G__5539__2 = function(tsym5507, k) {
    var this__5516 = this;
    var tsym5507__5517 = this;
    var coll__5518 = tsym5507__5517;
    return cljs.core._lookup.call(null, coll__5518, k)
  };
  var G__5539__3 = function(tsym5508, k, not_found) {
    var this__5519 = this;
    var tsym5508__5520 = this;
    var coll__5521 = tsym5508__5520;
    return cljs.core._lookup.call(null, coll__5521, k, not_found)
  };
  G__5539 = function(tsym5508, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5539__2.call(this, tsym5508, k);
      case 3:
        return G__5539__3.call(this, tsym5508, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5539
}();
cljs.core.Subvec.prototype.apply = function(tsym5505, args5506) {
  return tsym5505.call.apply(tsym5505, [tsym5505].concat(cljs.core.aclone.call(null, args5506)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5522 = this;
  return new cljs.core.Subvec(this__5522.meta, cljs.core._assoc_n.call(null, this__5522.v, this__5522.end, o), this__5522.start, this__5522.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__5523 = this;
  var this$__5524 = this;
  return cljs.core.pr_str.call(null, this$__5524)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5525 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5526 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5527 = this;
  var subvec_seq__5528 = function subvec_seq(i) {
    if(i === this__5527.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__5527.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__5528.call(null, this__5527.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5529 = this;
  return this__5529.end - this__5529.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5530 = this;
  return cljs.core._nth.call(null, this__5530.v, this__5530.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5531 = this;
  if(this__5531.start === this__5531.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__5531.meta, this__5531.v, this__5531.start, this__5531.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5532 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5533 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5534 = this;
  return new cljs.core.Subvec(meta, this__5534.v, this__5534.start, this__5534.end, this__5534.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5535 = this;
  return this__5535.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5537 = this;
  return cljs.core._nth.call(null, this__5537.v, this__5537.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5538 = this;
  return cljs.core._nth.call(null, this__5538.v, this__5538.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5536 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5536.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__5540 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__5540, 0, tl.length);
  return ret__5540
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__5541 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__5542 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__5541, subidx__5542, level === 5 ? tail_node : function() {
    var child__5543 = cljs.core.pv_aget.call(null, ret__5541, subidx__5542);
    if(child__5543 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__5543, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__5541
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__5544 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__5545 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5546 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__5544, subidx__5545));
    if(function() {
      var and__3546__auto____5547 = new_child__5546 == null;
      if(and__3546__auto____5547) {
        return subidx__5545 === 0
      }else {
        return and__3546__auto____5547
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__5544, subidx__5545, new_child__5546);
      return node__5544
    }
  }else {
    if(subidx__5545 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__5544, subidx__5545, null);
        return node__5544
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3546__auto____5548 = 0 <= i;
    if(and__3546__auto____5548) {
      return i < tv.cnt
    }else {
      return and__3546__auto____5548
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__5549 = tv.root;
      var node__5550 = root__5549;
      var level__5551 = tv.shift;
      while(true) {
        if(level__5551 > 0) {
          var G__5552 = cljs.core.tv_ensure_editable.call(null, root__5549.edit, cljs.core.pv_aget.call(null, node__5550, i >>> level__5551 & 31));
          var G__5553 = level__5551 - 5;
          node__5550 = G__5552;
          level__5551 = G__5553;
          continue
        }else {
          return node__5550.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__5591 = null;
  var G__5591__2 = function(tsym5556, k) {
    var this__5558 = this;
    var tsym5556__5559 = this;
    var coll__5560 = tsym5556__5559;
    return cljs.core._lookup.call(null, coll__5560, k)
  };
  var G__5591__3 = function(tsym5557, k, not_found) {
    var this__5561 = this;
    var tsym5557__5562 = this;
    var coll__5563 = tsym5557__5562;
    return cljs.core._lookup.call(null, coll__5563, k, not_found)
  };
  G__5591 = function(tsym5557, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5591__2.call(this, tsym5557, k);
      case 3:
        return G__5591__3.call(this, tsym5557, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5591
}();
cljs.core.TransientVector.prototype.apply = function(tsym5554, args5555) {
  return tsym5554.call.apply(tsym5554, [tsym5554].concat(cljs.core.aclone.call(null, args5555)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5564 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5565 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5566 = this;
  if(cljs.core.truth_(this__5566.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5567 = this;
  if(function() {
    var and__3546__auto____5568 = 0 <= n;
    if(and__3546__auto____5568) {
      return n < this__5567.cnt
    }else {
      return and__3546__auto____5568
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5569 = this;
  if(cljs.core.truth_(this__5569.root.edit)) {
    return this__5569.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__5570 = this;
  if(cljs.core.truth_(this__5570.root.edit)) {
    if(function() {
      var and__3546__auto____5571 = 0 <= n;
      if(and__3546__auto____5571) {
        return n < this__5570.cnt
      }else {
        return and__3546__auto____5571
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__5570.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__5574 = function go(level, node) {
          var node__5572 = cljs.core.tv_ensure_editable.call(null, this__5570.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__5572, n & 31, val);
            return node__5572
          }else {
            var subidx__5573 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__5572, subidx__5573, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__5572, subidx__5573)));
            return node__5572
          }
        }.call(null, this__5570.shift, this__5570.root);
        this__5570.root = new_root__5574;
        return tcoll
      }
    }else {
      if(n === this__5570.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__5570.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__5575 = this;
  if(cljs.core.truth_(this__5575.root.edit)) {
    if(this__5575.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__5575.cnt) {
        this__5575.cnt = 0;
        return tcoll
      }else {
        if((this__5575.cnt - 1 & 31) > 0) {
          this__5575.cnt = this__5575.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__5576 = cljs.core.editable_array_for.call(null, tcoll, this__5575.cnt - 2);
            var new_root__5578 = function() {
              var nr__5577 = cljs.core.tv_pop_tail.call(null, tcoll, this__5575.shift, this__5575.root);
              if(nr__5577 != null) {
                return nr__5577
              }else {
                return new cljs.core.VectorNode(this__5575.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3546__auto____5579 = 5 < this__5575.shift;
              if(and__3546__auto____5579) {
                return cljs.core.pv_aget.call(null, new_root__5578, 1) == null
              }else {
                return and__3546__auto____5579
              }
            }()) {
              var new_root__5580 = cljs.core.tv_ensure_editable.call(null, this__5575.root.edit, cljs.core.pv_aget.call(null, new_root__5578, 0));
              this__5575.root = new_root__5580;
              this__5575.shift = this__5575.shift - 5;
              this__5575.cnt = this__5575.cnt - 1;
              this__5575.tail = new_tail__5576;
              return tcoll
            }else {
              this__5575.root = new_root__5578;
              this__5575.cnt = this__5575.cnt - 1;
              this__5575.tail = new_tail__5576;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5581 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5582 = this;
  if(cljs.core.truth_(this__5582.root.edit)) {
    if(this__5582.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__5582.tail[this__5582.cnt & 31] = o;
      this__5582.cnt = this__5582.cnt + 1;
      return tcoll
    }else {
      var tail_node__5583 = new cljs.core.VectorNode(this__5582.root.edit, this__5582.tail);
      var new_tail__5584 = cljs.core.make_array.call(null, 32);
      new_tail__5584[0] = o;
      this__5582.tail = new_tail__5584;
      if(this__5582.cnt >>> 5 > 1 << this__5582.shift) {
        var new_root_array__5585 = cljs.core.make_array.call(null, 32);
        var new_shift__5586 = this__5582.shift + 5;
        new_root_array__5585[0] = this__5582.root;
        new_root_array__5585[1] = cljs.core.new_path.call(null, this__5582.root.edit, this__5582.shift, tail_node__5583);
        this__5582.root = new cljs.core.VectorNode(this__5582.root.edit, new_root_array__5585);
        this__5582.shift = new_shift__5586;
        this__5582.cnt = this__5582.cnt + 1;
        return tcoll
      }else {
        var new_root__5587 = cljs.core.tv_push_tail.call(null, tcoll, this__5582.shift, this__5582.root, tail_node__5583);
        this__5582.root = new_root__5587;
        this__5582.cnt = this__5582.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5588 = this;
  if(cljs.core.truth_(this__5588.root.edit)) {
    this__5588.root.edit = null;
    var len__5589 = this__5588.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__5590 = cljs.core.make_array.call(null, len__5589);
    cljs.core.array_copy.call(null, this__5588.tail, 0, trimmed_tail__5590, 0, len__5589);
    return new cljs.core.PersistentVector(null, this__5588.cnt, this__5588.shift, this__5588.root, trimmed_tail__5590, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5592 = this;
  var h__364__auto____5593 = this__5592.__hash;
  if(h__364__auto____5593 != null) {
    return h__364__auto____5593
  }else {
    var h__364__auto____5594 = cljs.core.hash_coll.call(null, coll);
    this__5592.__hash = h__364__auto____5594;
    return h__364__auto____5594
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5595 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__5596 = this;
  var this$__5597 = this;
  return cljs.core.pr_str.call(null, this$__5597)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5598 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5599 = this;
  return cljs.core._first.call(null, this__5599.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5600 = this;
  var temp__3695__auto____5601 = cljs.core.next.call(null, this__5600.front);
  if(cljs.core.truth_(temp__3695__auto____5601)) {
    var f1__5602 = temp__3695__auto____5601;
    return new cljs.core.PersistentQueueSeq(this__5600.meta, f1__5602, this__5600.rear, null)
  }else {
    if(this__5600.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__5600.meta, this__5600.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5603 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5604 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__5604.front, this__5604.rear, this__5604.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5605 = this;
  return this__5605.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5606 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5606.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5607 = this;
  var h__364__auto____5608 = this__5607.__hash;
  if(h__364__auto____5608 != null) {
    return h__364__auto____5608
  }else {
    var h__364__auto____5609 = cljs.core.hash_coll.call(null, coll);
    this__5607.__hash = h__364__auto____5609;
    return h__364__auto____5609
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5610 = this;
  if(cljs.core.truth_(this__5610.front)) {
    return new cljs.core.PersistentQueue(this__5610.meta, this__5610.count + 1, this__5610.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____5611 = this__5610.rear;
      if(cljs.core.truth_(or__3548__auto____5611)) {
        return or__3548__auto____5611
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__5610.meta, this__5610.count + 1, cljs.core.conj.call(null, this__5610.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__5612 = this;
  var this$__5613 = this;
  return cljs.core.pr_str.call(null, this$__5613)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5614 = this;
  var rear__5615 = cljs.core.seq.call(null, this__5614.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____5616 = this__5614.front;
    if(cljs.core.truth_(or__3548__auto____5616)) {
      return or__3548__auto____5616
    }else {
      return rear__5615
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__5614.front, cljs.core.seq.call(null, rear__5615), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5617 = this;
  return this__5617.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5618 = this;
  return cljs.core._first.call(null, this__5618.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5619 = this;
  if(cljs.core.truth_(this__5619.front)) {
    var temp__3695__auto____5620 = cljs.core.next.call(null, this__5619.front);
    if(cljs.core.truth_(temp__3695__auto____5620)) {
      var f1__5621 = temp__3695__auto____5620;
      return new cljs.core.PersistentQueue(this__5619.meta, this__5619.count - 1, f1__5621, this__5619.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__5619.meta, this__5619.count - 1, cljs.core.seq.call(null, this__5619.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5622 = this;
  return cljs.core.first.call(null, this__5622.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5623 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5624 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5625 = this;
  return new cljs.core.PersistentQueue(meta, this__5625.count, this__5625.front, this__5625.rear, this__5625.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5626 = this;
  return this__5626.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5627 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__5628 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__5629 = array.length;
  var i__5630 = 0;
  while(true) {
    if(i__5630 < len__5629) {
      if(cljs.core._EQ_.call(null, k, array[i__5630])) {
        return i__5630
      }else {
        var G__5631 = i__5630 + incr;
        i__5630 = G__5631;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5632 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____5632)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____5632
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__5633 = cljs.core.hash.call(null, a);
  var b__5634 = cljs.core.hash.call(null, b);
  if(a__5633 < b__5634) {
    return-1
  }else {
    if(a__5633 > b__5634) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__5636 = m.keys;
  var len__5637 = ks__5636.length;
  var so__5638 = m.strobj;
  var out__5639 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__5640 = 0;
  var out__5641 = cljs.core.transient$.call(null, out__5639);
  while(true) {
    if(i__5640 < len__5637) {
      var k__5642 = ks__5636[i__5640];
      var G__5643 = i__5640 + 1;
      var G__5644 = cljs.core.assoc_BANG_.call(null, out__5641, k__5642, so__5638[k__5642]);
      i__5640 = G__5643;
      out__5641 = G__5644;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__5641, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5649 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5650 = this;
  var h__364__auto____5651 = this__5650.__hash;
  if(h__364__auto____5651 != null) {
    return h__364__auto____5651
  }else {
    var h__364__auto____5652 = cljs.core.hash_imap.call(null, coll);
    this__5650.__hash = h__364__auto____5652;
    return h__364__auto____5652
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5653 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5654 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5654.strobj, this__5654.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5655 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___5656 = this__5655.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___5656)) {
      var new_strobj__5657 = goog.object.clone.call(null, this__5655.strobj);
      new_strobj__5657[k] = v;
      return new cljs.core.ObjMap(this__5655.meta, this__5655.keys, new_strobj__5657, this__5655.update_count + 1, null)
    }else {
      if(this__5655.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__5658 = goog.object.clone.call(null, this__5655.strobj);
        var new_keys__5659 = cljs.core.aclone.call(null, this__5655.keys);
        new_strobj__5658[k] = v;
        new_keys__5659.push(k);
        return new cljs.core.ObjMap(this__5655.meta, new_keys__5659, new_strobj__5658, this__5655.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5660 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5660.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__5680 = null;
  var G__5680__2 = function(tsym5647, k) {
    var this__5661 = this;
    var tsym5647__5662 = this;
    var coll__5663 = tsym5647__5662;
    return cljs.core._lookup.call(null, coll__5663, k)
  };
  var G__5680__3 = function(tsym5648, k, not_found) {
    var this__5664 = this;
    var tsym5648__5665 = this;
    var coll__5666 = tsym5648__5665;
    return cljs.core._lookup.call(null, coll__5666, k, not_found)
  };
  G__5680 = function(tsym5648, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5680__2.call(this, tsym5648, k);
      case 3:
        return G__5680__3.call(this, tsym5648, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5680
}();
cljs.core.ObjMap.prototype.apply = function(tsym5645, args5646) {
  return tsym5645.call.apply(tsym5645, [tsym5645].concat(cljs.core.aclone.call(null, args5646)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5667 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__5668 = this;
  var this$__5669 = this;
  return cljs.core.pr_str.call(null, this$__5669)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5670 = this;
  if(this__5670.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__5635_SHARP_) {
      return cljs.core.vector.call(null, p1__5635_SHARP_, this__5670.strobj[p1__5635_SHARP_])
    }, this__5670.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5671 = this;
  return this__5671.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5672 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5673 = this;
  return new cljs.core.ObjMap(meta, this__5673.keys, this__5673.strobj, this__5673.update_count, this__5673.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5674 = this;
  return this__5674.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5675 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__5675.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5676 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____5677 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____5677)) {
      return this__5676.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____5677
    }
  }())) {
    var new_keys__5678 = cljs.core.aclone.call(null, this__5676.keys);
    var new_strobj__5679 = goog.object.clone.call(null, this__5676.strobj);
    new_keys__5678.splice(cljs.core.scan_array.call(null, 1, k, new_keys__5678), 1);
    cljs.core.js_delete.call(null, new_strobj__5679, k);
    return new cljs.core.ObjMap(this__5676.meta, new_keys__5678, new_strobj__5679, this__5676.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5686 = this;
  var h__364__auto____5687 = this__5686.__hash;
  if(h__364__auto____5687 != null) {
    return h__364__auto____5687
  }else {
    var h__364__auto____5688 = cljs.core.hash_imap.call(null, coll);
    this__5686.__hash = h__364__auto____5688;
    return h__364__auto____5688
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5689 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5690 = this;
  var bucket__5691 = this__5690.hashobj[cljs.core.hash.call(null, k)];
  var i__5692 = cljs.core.truth_(bucket__5691) ? cljs.core.scan_array.call(null, 2, k, bucket__5691) : null;
  if(cljs.core.truth_(i__5692)) {
    return bucket__5691[i__5692 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5693 = this;
  var h__5694 = cljs.core.hash.call(null, k);
  var bucket__5695 = this__5693.hashobj[h__5694];
  if(cljs.core.truth_(bucket__5695)) {
    var new_bucket__5696 = cljs.core.aclone.call(null, bucket__5695);
    var new_hashobj__5697 = goog.object.clone.call(null, this__5693.hashobj);
    new_hashobj__5697[h__5694] = new_bucket__5696;
    var temp__3695__auto____5698 = cljs.core.scan_array.call(null, 2, k, new_bucket__5696);
    if(cljs.core.truth_(temp__3695__auto____5698)) {
      var i__5699 = temp__3695__auto____5698;
      new_bucket__5696[i__5699 + 1] = v;
      return new cljs.core.HashMap(this__5693.meta, this__5693.count, new_hashobj__5697, null)
    }else {
      new_bucket__5696.push(k, v);
      return new cljs.core.HashMap(this__5693.meta, this__5693.count + 1, new_hashobj__5697, null)
    }
  }else {
    var new_hashobj__5700 = goog.object.clone.call(null, this__5693.hashobj);
    new_hashobj__5700[h__5694] = [k, v];
    return new cljs.core.HashMap(this__5693.meta, this__5693.count + 1, new_hashobj__5700, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5701 = this;
  var bucket__5702 = this__5701.hashobj[cljs.core.hash.call(null, k)];
  var i__5703 = cljs.core.truth_(bucket__5702) ? cljs.core.scan_array.call(null, 2, k, bucket__5702) : null;
  if(cljs.core.truth_(i__5703)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__5726 = null;
  var G__5726__2 = function(tsym5684, k) {
    var this__5704 = this;
    var tsym5684__5705 = this;
    var coll__5706 = tsym5684__5705;
    return cljs.core._lookup.call(null, coll__5706, k)
  };
  var G__5726__3 = function(tsym5685, k, not_found) {
    var this__5707 = this;
    var tsym5685__5708 = this;
    var coll__5709 = tsym5685__5708;
    return cljs.core._lookup.call(null, coll__5709, k, not_found)
  };
  G__5726 = function(tsym5685, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5726__2.call(this, tsym5685, k);
      case 3:
        return G__5726__3.call(this, tsym5685, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5726
}();
cljs.core.HashMap.prototype.apply = function(tsym5682, args5683) {
  return tsym5682.call.apply(tsym5682, [tsym5682].concat(cljs.core.aclone.call(null, args5683)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5710 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__5711 = this;
  var this$__5712 = this;
  return cljs.core.pr_str.call(null, this$__5712)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5713 = this;
  if(this__5713.count > 0) {
    var hashes__5714 = cljs.core.js_keys.call(null, this__5713.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__5681_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__5713.hashobj[p1__5681_SHARP_]))
    }, hashes__5714)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5715 = this;
  return this__5715.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5716 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5717 = this;
  return new cljs.core.HashMap(meta, this__5717.count, this__5717.hashobj, this__5717.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5718 = this;
  return this__5718.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5719 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__5719.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5720 = this;
  var h__5721 = cljs.core.hash.call(null, k);
  var bucket__5722 = this__5720.hashobj[h__5721];
  var i__5723 = cljs.core.truth_(bucket__5722) ? cljs.core.scan_array.call(null, 2, k, bucket__5722) : null;
  if(cljs.core.not.call(null, i__5723)) {
    return coll
  }else {
    var new_hashobj__5724 = goog.object.clone.call(null, this__5720.hashobj);
    if(3 > bucket__5722.length) {
      cljs.core.js_delete.call(null, new_hashobj__5724, h__5721)
    }else {
      var new_bucket__5725 = cljs.core.aclone.call(null, bucket__5722);
      new_bucket__5725.splice(i__5723, 2);
      new_hashobj__5724[h__5721] = new_bucket__5725
    }
    return new cljs.core.HashMap(this__5720.meta, this__5720.count - 1, new_hashobj__5724, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__5727 = ks.length;
  var i__5728 = 0;
  var out__5729 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__5728 < len__5727) {
      var G__5730 = i__5728 + 1;
      var G__5731 = cljs.core.assoc.call(null, out__5729, ks[i__5728], vs[i__5728]);
      i__5728 = G__5730;
      out__5729 = G__5731;
      continue
    }else {
      return out__5729
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__5732 = m.arr;
  var len__5733 = arr__5732.length;
  var i__5734 = 0;
  while(true) {
    if(len__5733 <= i__5734) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__5732[i__5734], k)) {
        return i__5734
      }else {
        if("\ufdd0'else") {
          var G__5735 = i__5734 + 2;
          i__5734 = G__5735;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5740 = this;
  return new cljs.core.TransientArrayMap({}, this__5740.arr.length, cljs.core.aclone.call(null, this__5740.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5741 = this;
  var h__364__auto____5742 = this__5741.__hash;
  if(h__364__auto____5742 != null) {
    return h__364__auto____5742
  }else {
    var h__364__auto____5743 = cljs.core.hash_imap.call(null, coll);
    this__5741.__hash = h__364__auto____5743;
    return h__364__auto____5743
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5744 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5745 = this;
  var idx__5746 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5746 === -1) {
    return not_found
  }else {
    return this__5745.arr[idx__5746 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5747 = this;
  var idx__5748 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5748 === -1) {
    if(this__5747.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__5747.meta, this__5747.cnt + 1, function() {
        var G__5749__5750 = cljs.core.aclone.call(null, this__5747.arr);
        G__5749__5750.push(k);
        G__5749__5750.push(v);
        return G__5749__5750
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__5747.arr[idx__5748 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__5747.meta, this__5747.cnt, function() {
          var G__5751__5752 = cljs.core.aclone.call(null, this__5747.arr);
          G__5751__5752[idx__5748 + 1] = v;
          return G__5751__5752
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5753 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__5783 = null;
  var G__5783__2 = function(tsym5738, k) {
    var this__5754 = this;
    var tsym5738__5755 = this;
    var coll__5756 = tsym5738__5755;
    return cljs.core._lookup.call(null, coll__5756, k)
  };
  var G__5783__3 = function(tsym5739, k, not_found) {
    var this__5757 = this;
    var tsym5739__5758 = this;
    var coll__5759 = tsym5739__5758;
    return cljs.core._lookup.call(null, coll__5759, k, not_found)
  };
  G__5783 = function(tsym5739, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5783__2.call(this, tsym5739, k);
      case 3:
        return G__5783__3.call(this, tsym5739, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5783
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym5736, args5737) {
  return tsym5736.call.apply(tsym5736, [tsym5736].concat(cljs.core.aclone.call(null, args5737)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__5760 = this;
  var len__5761 = this__5760.arr.length;
  var i__5762 = 0;
  var init__5763 = init;
  while(true) {
    if(i__5762 < len__5761) {
      var init__5764 = f.call(null, init__5763, this__5760.arr[i__5762], this__5760.arr[i__5762 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__5764)) {
        return cljs.core.deref.call(null, init__5764)
      }else {
        var G__5784 = i__5762 + 2;
        var G__5785 = init__5764;
        i__5762 = G__5784;
        init__5763 = G__5785;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5765 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__5766 = this;
  var this$__5767 = this;
  return cljs.core.pr_str.call(null, this$__5767)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5768 = this;
  if(this__5768.cnt > 0) {
    var len__5769 = this__5768.arr.length;
    var array_map_seq__5770 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__5769) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__5768.arr[i], this__5768.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__5770.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5771 = this;
  return this__5771.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5772 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5773 = this;
  return new cljs.core.PersistentArrayMap(meta, this__5773.cnt, this__5773.arr, this__5773.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5774 = this;
  return this__5774.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5775 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__5775.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5776 = this;
  var idx__5777 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5777 >= 0) {
    var len__5778 = this__5776.arr.length;
    var new_len__5779 = len__5778 - 2;
    if(new_len__5779 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__5780 = cljs.core.make_array.call(null, new_len__5779);
      var s__5781 = 0;
      var d__5782 = 0;
      while(true) {
        if(s__5781 >= len__5778) {
          return new cljs.core.PersistentArrayMap(this__5776.meta, this__5776.cnt - 1, new_arr__5780, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__5776.arr[s__5781])) {
            var G__5786 = s__5781 + 2;
            var G__5787 = d__5782;
            s__5781 = G__5786;
            d__5782 = G__5787;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__5780[d__5782] = this__5776.arr[s__5781];
              new_arr__5780[d__5782 + 1] = this__5776.arr[s__5781 + 1];
              var G__5788 = s__5781 + 2;
              var G__5789 = d__5782 + 2;
              s__5781 = G__5788;
              d__5782 = G__5789;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__5790 = cljs.core.count.call(null, ks);
  var i__5791 = 0;
  var out__5792 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__5791 < len__5790) {
      var G__5793 = i__5791 + 1;
      var G__5794 = cljs.core.assoc_BANG_.call(null, out__5792, ks[i__5791], vs[i__5791]);
      i__5791 = G__5793;
      out__5792 = G__5794;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5792)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__5795 = this;
  if(cljs.core.truth_(this__5795.editable_QMARK_)) {
    var idx__5796 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5796 >= 0) {
      this__5795.arr[idx__5796] = this__5795.arr[this__5795.len - 2];
      this__5795.arr[idx__5796 + 1] = this__5795.arr[this__5795.len - 1];
      var G__5797__5798 = this__5795.arr;
      G__5797__5798.pop();
      G__5797__5798.pop();
      G__5797__5798;
      this__5795.len = this__5795.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5799 = this;
  if(cljs.core.truth_(this__5799.editable_QMARK_)) {
    var idx__5800 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5800 === -1) {
      if(this__5799.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__5799.len = this__5799.len + 2;
        this__5799.arr.push(key);
        this__5799.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__5799.len, this__5799.arr), key, val)
      }
    }else {
      if(val === this__5799.arr[idx__5800 + 1]) {
        return tcoll
      }else {
        this__5799.arr[idx__5800 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5801 = this;
  if(cljs.core.truth_(this__5801.editable_QMARK_)) {
    if(function() {
      var G__5802__5803 = o;
      if(G__5802__5803 != null) {
        if(function() {
          var or__3548__auto____5804 = G__5802__5803.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____5804) {
            return or__3548__auto____5804
          }else {
            return G__5802__5803.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5802__5803.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5802__5803)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5802__5803)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__5805 = cljs.core.seq.call(null, o);
      var tcoll__5806 = tcoll;
      while(true) {
        var temp__3695__auto____5807 = cljs.core.first.call(null, es__5805);
        if(cljs.core.truth_(temp__3695__auto____5807)) {
          var e__5808 = temp__3695__auto____5807;
          var G__5814 = cljs.core.next.call(null, es__5805);
          var G__5815 = cljs.core._assoc_BANG_.call(null, tcoll__5806, cljs.core.key.call(null, e__5808), cljs.core.val.call(null, e__5808));
          es__5805 = G__5814;
          tcoll__5806 = G__5815;
          continue
        }else {
          return tcoll__5806
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5809 = this;
  if(cljs.core.truth_(this__5809.editable_QMARK_)) {
    this__5809.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__5809.len, 2), this__5809.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__5810 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__5811 = this;
  if(cljs.core.truth_(this__5811.editable_QMARK_)) {
    var idx__5812 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__5812 === -1) {
      return not_found
    }else {
      return this__5811.arr[idx__5812 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__5813 = this;
  if(cljs.core.truth_(this__5813.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__5813.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__5816 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__5817 = 0;
  while(true) {
    if(i__5817 < len) {
      var G__5818 = cljs.core.assoc_BANG_.call(null, out__5816, arr[i__5817], arr[i__5817 + 1]);
      var G__5819 = i__5817 + 2;
      out__5816 = G__5818;
      i__5817 = G__5819;
      continue
    }else {
      return out__5816
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__5820__5821 = cljs.core.aclone.call(null, arr);
    G__5820__5821[i] = a;
    return G__5820__5821
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__5822__5823 = cljs.core.aclone.call(null, arr);
    G__5822__5823[i] = a;
    G__5822__5823[j] = b;
    return G__5822__5823
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__5824 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__5824, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__5824, 2 * i, new_arr__5824.length - 2 * i);
  return new_arr__5824
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__5825 = inode.ensure_editable(edit);
    editable__5825.arr[i] = a;
    return editable__5825
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__5826 = inode.ensure_editable(edit);
    editable__5826.arr[i] = a;
    editable__5826.arr[j] = b;
    return editable__5826
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__5827 = arr.length;
  var i__5828 = 0;
  var init__5829 = init;
  while(true) {
    if(i__5828 < len__5827) {
      var init__5832 = function() {
        var k__5830 = arr[i__5828];
        if(k__5830 != null) {
          return f.call(null, init__5829, k__5830, arr[i__5828 + 1])
        }else {
          var node__5831 = arr[i__5828 + 1];
          if(node__5831 != null) {
            return node__5831.kv_reduce(f, init__5829)
          }else {
            return init__5829
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5832)) {
        return cljs.core.deref.call(null, init__5832)
      }else {
        var G__5833 = i__5828 + 2;
        var G__5834 = init__5832;
        i__5828 = G__5833;
        init__5829 = G__5834;
        continue
      }
    }else {
      return init__5829
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__5835 = this;
  var inode__5836 = this;
  if(this__5835.bitmap === bit) {
    return null
  }else {
    var editable__5837 = inode__5836.ensure_editable(e);
    var earr__5838 = editable__5837.arr;
    var len__5839 = earr__5838.length;
    editable__5837.bitmap = bit ^ editable__5837.bitmap;
    cljs.core.array_copy.call(null, earr__5838, 2 * (i + 1), earr__5838, 2 * i, len__5839 - 2 * (i + 1));
    earr__5838[len__5839 - 2] = null;
    earr__5838[len__5839 - 1] = null;
    return editable__5837
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5840 = this;
  var inode__5841 = this;
  var bit__5842 = 1 << (hash >>> shift & 31);
  var idx__5843 = cljs.core.bitmap_indexed_node_index.call(null, this__5840.bitmap, bit__5842);
  if((this__5840.bitmap & bit__5842) === 0) {
    var n__5844 = cljs.core.bit_count.call(null, this__5840.bitmap);
    if(2 * n__5844 < this__5840.arr.length) {
      var editable__5845 = inode__5841.ensure_editable(edit);
      var earr__5846 = editable__5845.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__5846, 2 * idx__5843, earr__5846, 2 * (idx__5843 + 1), 2 * (n__5844 - idx__5843));
      earr__5846[2 * idx__5843] = key;
      earr__5846[2 * idx__5843 + 1] = val;
      editable__5845.bitmap = editable__5845.bitmap | bit__5842;
      return editable__5845
    }else {
      if(n__5844 >= 16) {
        var nodes__5847 = cljs.core.make_array.call(null, 32);
        var jdx__5848 = hash >>> shift & 31;
        nodes__5847[jdx__5848] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__5849 = 0;
        var j__5850 = 0;
        while(true) {
          if(i__5849 < 32) {
            if((this__5840.bitmap >>> i__5849 & 1) === 0) {
              var G__5903 = i__5849 + 1;
              var G__5904 = j__5850;
              i__5849 = G__5903;
              j__5850 = G__5904;
              continue
            }else {
              nodes__5847[i__5849] = null != this__5840.arr[j__5850] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__5840.arr[j__5850]), this__5840.arr[j__5850], this__5840.arr[j__5850 + 1], added_leaf_QMARK_) : this__5840.arr[j__5850 + 1];
              var G__5905 = i__5849 + 1;
              var G__5906 = j__5850 + 2;
              i__5849 = G__5905;
              j__5850 = G__5906;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__5844 + 1, nodes__5847)
      }else {
        if("\ufdd0'else") {
          var new_arr__5851 = cljs.core.make_array.call(null, 2 * (n__5844 + 4));
          cljs.core.array_copy.call(null, this__5840.arr, 0, new_arr__5851, 0, 2 * idx__5843);
          new_arr__5851[2 * idx__5843] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__5851[2 * idx__5843 + 1] = val;
          cljs.core.array_copy.call(null, this__5840.arr, 2 * idx__5843, new_arr__5851, 2 * (idx__5843 + 1), 2 * (n__5844 - idx__5843));
          var editable__5852 = inode__5841.ensure_editable(edit);
          editable__5852.arr = new_arr__5851;
          editable__5852.bitmap = editable__5852.bitmap | bit__5842;
          return editable__5852
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__5853 = this__5840.arr[2 * idx__5843];
    var val_or_node__5854 = this__5840.arr[2 * idx__5843 + 1];
    if(null == key_or_nil__5853) {
      var n__5855 = val_or_node__5854.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5855 === val_or_node__5854) {
        return inode__5841
      }else {
        return cljs.core.edit_and_set.call(null, inode__5841, edit, 2 * idx__5843 + 1, n__5855)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5853)) {
        if(val === val_or_node__5854) {
          return inode__5841
        }else {
          return cljs.core.edit_and_set.call(null, inode__5841, edit, 2 * idx__5843 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__5841, edit, 2 * idx__5843, null, 2 * idx__5843 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__5853, val_or_node__5854, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__5856 = this;
  var inode__5857 = this;
  return cljs.core.create_inode_seq.call(null, this__5856.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5858 = this;
  var inode__5859 = this;
  var bit__5860 = 1 << (hash >>> shift & 31);
  if((this__5858.bitmap & bit__5860) === 0) {
    return inode__5859
  }else {
    var idx__5861 = cljs.core.bitmap_indexed_node_index.call(null, this__5858.bitmap, bit__5860);
    var key_or_nil__5862 = this__5858.arr[2 * idx__5861];
    var val_or_node__5863 = this__5858.arr[2 * idx__5861 + 1];
    if(null == key_or_nil__5862) {
      var n__5864 = val_or_node__5863.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__5864 === val_or_node__5863) {
        return inode__5859
      }else {
        if(null != n__5864) {
          return cljs.core.edit_and_set.call(null, inode__5859, edit, 2 * idx__5861 + 1, n__5864)
        }else {
          if(this__5858.bitmap === bit__5860) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__5859.edit_and_remove_pair(edit, bit__5860, idx__5861)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5862)) {
        removed_leaf_QMARK_[0] = true;
        return inode__5859.edit_and_remove_pair(edit, bit__5860, idx__5861)
      }else {
        if("\ufdd0'else") {
          return inode__5859
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__5865 = this;
  var inode__5866 = this;
  if(e === this__5865.edit) {
    return inode__5866
  }else {
    var n__5867 = cljs.core.bit_count.call(null, this__5865.bitmap);
    var new_arr__5868 = cljs.core.make_array.call(null, n__5867 < 0 ? 4 : 2 * (n__5867 + 1));
    cljs.core.array_copy.call(null, this__5865.arr, 0, new_arr__5868, 0, 2 * n__5867);
    return new cljs.core.BitmapIndexedNode(e, this__5865.bitmap, new_arr__5868)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__5869 = this;
  var inode__5870 = this;
  return cljs.core.inode_kv_reduce.call(null, this__5869.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__5907 = null;
  var G__5907__3 = function(shift, hash, key) {
    var this__5871 = this;
    var inode__5872 = this;
    var bit__5873 = 1 << (hash >>> shift & 31);
    if((this__5871.bitmap & bit__5873) === 0) {
      return null
    }else {
      var idx__5874 = cljs.core.bitmap_indexed_node_index.call(null, this__5871.bitmap, bit__5873);
      var key_or_nil__5875 = this__5871.arr[2 * idx__5874];
      var val_or_node__5876 = this__5871.arr[2 * idx__5874 + 1];
      if(null == key_or_nil__5875) {
        return val_or_node__5876.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5875)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5875, val_or_node__5876])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__5907__4 = function(shift, hash, key, not_found) {
    var this__5877 = this;
    var inode__5878 = this;
    var bit__5879 = 1 << (hash >>> shift & 31);
    if((this__5877.bitmap & bit__5879) === 0) {
      return not_found
    }else {
      var idx__5880 = cljs.core.bitmap_indexed_node_index.call(null, this__5877.bitmap, bit__5879);
      var key_or_nil__5881 = this__5877.arr[2 * idx__5880];
      var val_or_node__5882 = this__5877.arr[2 * idx__5880 + 1];
      if(null == key_or_nil__5881) {
        return val_or_node__5882.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5881)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5881, val_or_node__5882])
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  G__5907 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5907__3.call(this, shift, hash, key);
      case 4:
        return G__5907__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5907
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__5883 = this;
  var inode__5884 = this;
  var bit__5885 = 1 << (hash >>> shift & 31);
  if((this__5883.bitmap & bit__5885) === 0) {
    return inode__5884
  }else {
    var idx__5886 = cljs.core.bitmap_indexed_node_index.call(null, this__5883.bitmap, bit__5885);
    var key_or_nil__5887 = this__5883.arr[2 * idx__5886];
    var val_or_node__5888 = this__5883.arr[2 * idx__5886 + 1];
    if(null == key_or_nil__5887) {
      var n__5889 = val_or_node__5888.inode_without(shift + 5, hash, key);
      if(n__5889 === val_or_node__5888) {
        return inode__5884
      }else {
        if(null != n__5889) {
          return new cljs.core.BitmapIndexedNode(null, this__5883.bitmap, cljs.core.clone_and_set.call(null, this__5883.arr, 2 * idx__5886 + 1, n__5889))
        }else {
          if(this__5883.bitmap === bit__5885) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__5883.bitmap ^ bit__5885, cljs.core.remove_pair.call(null, this__5883.arr, idx__5886))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5887)) {
        return new cljs.core.BitmapIndexedNode(null, this__5883.bitmap ^ bit__5885, cljs.core.remove_pair.call(null, this__5883.arr, idx__5886))
      }else {
        if("\ufdd0'else") {
          return inode__5884
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5890 = this;
  var inode__5891 = this;
  var bit__5892 = 1 << (hash >>> shift & 31);
  var idx__5893 = cljs.core.bitmap_indexed_node_index.call(null, this__5890.bitmap, bit__5892);
  if((this__5890.bitmap & bit__5892) === 0) {
    var n__5894 = cljs.core.bit_count.call(null, this__5890.bitmap);
    if(n__5894 >= 16) {
      var nodes__5895 = cljs.core.make_array.call(null, 32);
      var jdx__5896 = hash >>> shift & 31;
      nodes__5895[jdx__5896] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__5897 = 0;
      var j__5898 = 0;
      while(true) {
        if(i__5897 < 32) {
          if((this__5890.bitmap >>> i__5897 & 1) === 0) {
            var G__5908 = i__5897 + 1;
            var G__5909 = j__5898;
            i__5897 = G__5908;
            j__5898 = G__5909;
            continue
          }else {
            nodes__5895[i__5897] = null != this__5890.arr[j__5898] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__5890.arr[j__5898]), this__5890.arr[j__5898], this__5890.arr[j__5898 + 1], added_leaf_QMARK_) : this__5890.arr[j__5898 + 1];
            var G__5910 = i__5897 + 1;
            var G__5911 = j__5898 + 2;
            i__5897 = G__5910;
            j__5898 = G__5911;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__5894 + 1, nodes__5895)
    }else {
      var new_arr__5899 = cljs.core.make_array.call(null, 2 * (n__5894 + 1));
      cljs.core.array_copy.call(null, this__5890.arr, 0, new_arr__5899, 0, 2 * idx__5893);
      new_arr__5899[2 * idx__5893] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__5899[2 * idx__5893 + 1] = val;
      cljs.core.array_copy.call(null, this__5890.arr, 2 * idx__5893, new_arr__5899, 2 * (idx__5893 + 1), 2 * (n__5894 - idx__5893));
      return new cljs.core.BitmapIndexedNode(null, this__5890.bitmap | bit__5892, new_arr__5899)
    }
  }else {
    var key_or_nil__5900 = this__5890.arr[2 * idx__5893];
    var val_or_node__5901 = this__5890.arr[2 * idx__5893 + 1];
    if(null == key_or_nil__5900) {
      var n__5902 = val_or_node__5901.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5902 === val_or_node__5901) {
        return inode__5891
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__5890.bitmap, cljs.core.clone_and_set.call(null, this__5890.arr, 2 * idx__5893 + 1, n__5902))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5900)) {
        if(val === val_or_node__5901) {
          return inode__5891
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__5890.bitmap, cljs.core.clone_and_set.call(null, this__5890.arr, 2 * idx__5893 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__5890.bitmap, cljs.core.clone_and_set.call(null, this__5890.arr, 2 * idx__5893, null, 2 * idx__5893 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__5900, val_or_node__5901, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__5912 = array_node.arr;
  var len__5913 = 2 * (array_node.cnt - 1);
  var new_arr__5914 = cljs.core.make_array.call(null, len__5913);
  var i__5915 = 0;
  var j__5916 = 1;
  var bitmap__5917 = 0;
  while(true) {
    if(i__5915 < len__5913) {
      if(function() {
        var and__3546__auto____5918 = i__5915 != idx;
        if(and__3546__auto____5918) {
          return null != arr__5912[i__5915]
        }else {
          return and__3546__auto____5918
        }
      }()) {
        new_arr__5914[j__5916] = arr__5912[i__5915];
        var G__5919 = i__5915 + 1;
        var G__5920 = j__5916 + 2;
        var G__5921 = bitmap__5917 | 1 << i__5915;
        i__5915 = G__5919;
        j__5916 = G__5920;
        bitmap__5917 = G__5921;
        continue
      }else {
        var G__5922 = i__5915 + 1;
        var G__5923 = j__5916;
        var G__5924 = bitmap__5917;
        i__5915 = G__5922;
        j__5916 = G__5923;
        bitmap__5917 = G__5924;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__5917, new_arr__5914)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5925 = this;
  var inode__5926 = this;
  var idx__5927 = hash >>> shift & 31;
  var node__5928 = this__5925.arr[idx__5927];
  if(null == node__5928) {
    return new cljs.core.ArrayNode(null, this__5925.cnt + 1, cljs.core.clone_and_set.call(null, this__5925.arr, idx__5927, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__5929 = node__5928.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5929 === node__5928) {
      return inode__5926
    }else {
      return new cljs.core.ArrayNode(null, this__5925.cnt, cljs.core.clone_and_set.call(null, this__5925.arr, idx__5927, n__5929))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__5930 = this;
  var inode__5931 = this;
  var idx__5932 = hash >>> shift & 31;
  var node__5933 = this__5930.arr[idx__5932];
  if(null != node__5933) {
    var n__5934 = node__5933.inode_without(shift + 5, hash, key);
    if(n__5934 === node__5933) {
      return inode__5931
    }else {
      if(n__5934 == null) {
        if(this__5930.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5931, null, idx__5932)
        }else {
          return new cljs.core.ArrayNode(null, this__5930.cnt - 1, cljs.core.clone_and_set.call(null, this__5930.arr, idx__5932, n__5934))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__5930.cnt, cljs.core.clone_and_set.call(null, this__5930.arr, idx__5932, n__5934))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__5931
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__5966 = null;
  var G__5966__3 = function(shift, hash, key) {
    var this__5935 = this;
    var inode__5936 = this;
    var idx__5937 = hash >>> shift & 31;
    var node__5938 = this__5935.arr[idx__5937];
    if(null != node__5938) {
      return node__5938.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__5966__4 = function(shift, hash, key, not_found) {
    var this__5939 = this;
    var inode__5940 = this;
    var idx__5941 = hash >>> shift & 31;
    var node__5942 = this__5939.arr[idx__5941];
    if(null != node__5942) {
      return node__5942.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__5966 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5966__3.call(this, shift, hash, key);
      case 4:
        return G__5966__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5966
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__5943 = this;
  var inode__5944 = this;
  return cljs.core.create_array_node_seq.call(null, this__5943.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__5945 = this;
  var inode__5946 = this;
  if(e === this__5945.edit) {
    return inode__5946
  }else {
    return new cljs.core.ArrayNode(e, this__5945.cnt, cljs.core.aclone.call(null, this__5945.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5947 = this;
  var inode__5948 = this;
  var idx__5949 = hash >>> shift & 31;
  var node__5950 = this__5947.arr[idx__5949];
  if(null == node__5950) {
    var editable__5951 = cljs.core.edit_and_set.call(null, inode__5948, edit, idx__5949, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__5951.cnt = editable__5951.cnt + 1;
    return editable__5951
  }else {
    var n__5952 = node__5950.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5952 === node__5950) {
      return inode__5948
    }else {
      return cljs.core.edit_and_set.call(null, inode__5948, edit, idx__5949, n__5952)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5953 = this;
  var inode__5954 = this;
  var idx__5955 = hash >>> shift & 31;
  var node__5956 = this__5953.arr[idx__5955];
  if(null == node__5956) {
    return inode__5954
  }else {
    var n__5957 = node__5956.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__5957 === node__5956) {
      return inode__5954
    }else {
      if(null == n__5957) {
        if(this__5953.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5954, edit, idx__5955)
        }else {
          var editable__5958 = cljs.core.edit_and_set.call(null, inode__5954, edit, idx__5955, n__5957);
          editable__5958.cnt = editable__5958.cnt - 1;
          return editable__5958
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__5954, edit, idx__5955, n__5957)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__5959 = this;
  var inode__5960 = this;
  var len__5961 = this__5959.arr.length;
  var i__5962 = 0;
  var init__5963 = init;
  while(true) {
    if(i__5962 < len__5961) {
      var node__5964 = this__5959.arr[i__5962];
      if(node__5964 != null) {
        var init__5965 = node__5964.kv_reduce(f, init__5963);
        if(cljs.core.reduced_QMARK_.call(null, init__5965)) {
          return cljs.core.deref.call(null, init__5965)
        }else {
          var G__5967 = i__5962 + 1;
          var G__5968 = init__5965;
          i__5962 = G__5967;
          init__5963 = G__5968;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__5963
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__5969 = 2 * cnt;
  var i__5970 = 0;
  while(true) {
    if(i__5970 < lim__5969) {
      if(cljs.core._EQ_.call(null, key, arr[i__5970])) {
        return i__5970
      }else {
        var G__5971 = i__5970 + 2;
        i__5970 = G__5971;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5972 = this;
  var inode__5973 = this;
  if(hash === this__5972.collision_hash) {
    var idx__5974 = cljs.core.hash_collision_node_find_index.call(null, this__5972.arr, this__5972.cnt, key);
    if(idx__5974 === -1) {
      var len__5975 = this__5972.arr.length;
      var new_arr__5976 = cljs.core.make_array.call(null, len__5975 + 2);
      cljs.core.array_copy.call(null, this__5972.arr, 0, new_arr__5976, 0, len__5975);
      new_arr__5976[len__5975] = key;
      new_arr__5976[len__5975 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__5972.collision_hash, this__5972.cnt + 1, new_arr__5976)
    }else {
      if(cljs.core._EQ_.call(null, this__5972.arr[idx__5974], val)) {
        return inode__5973
      }else {
        return new cljs.core.HashCollisionNode(null, this__5972.collision_hash, this__5972.cnt, cljs.core.clone_and_set.call(null, this__5972.arr, idx__5974 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__5972.collision_hash >>> shift & 31), [null, inode__5973])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__5977 = this;
  var inode__5978 = this;
  var idx__5979 = cljs.core.hash_collision_node_find_index.call(null, this__5977.arr, this__5977.cnt, key);
  if(idx__5979 === -1) {
    return inode__5978
  }else {
    if(this__5977.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__5977.collision_hash, this__5977.cnt - 1, cljs.core.remove_pair.call(null, this__5977.arr, cljs.core.quot.call(null, idx__5979, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__6006 = null;
  var G__6006__3 = function(shift, hash, key) {
    var this__5980 = this;
    var inode__5981 = this;
    var idx__5982 = cljs.core.hash_collision_node_find_index.call(null, this__5980.arr, this__5980.cnt, key);
    if(idx__5982 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__5980.arr[idx__5982])) {
        return cljs.core.PersistentVector.fromArray([this__5980.arr[idx__5982], this__5980.arr[idx__5982 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__6006__4 = function(shift, hash, key, not_found) {
    var this__5983 = this;
    var inode__5984 = this;
    var idx__5985 = cljs.core.hash_collision_node_find_index.call(null, this__5983.arr, this__5983.cnt, key);
    if(idx__5985 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__5983.arr[idx__5985])) {
        return cljs.core.PersistentVector.fromArray([this__5983.arr[idx__5985], this__5983.arr[idx__5985 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__6006 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6006__3.call(this, shift, hash, key);
      case 4:
        return G__6006__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6006
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__5986 = this;
  var inode__5987 = this;
  return cljs.core.create_inode_seq.call(null, this__5986.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__6007 = null;
  var G__6007__1 = function(e) {
    var this__5988 = this;
    var inode__5989 = this;
    if(e === this__5988.edit) {
      return inode__5989
    }else {
      var new_arr__5990 = cljs.core.make_array.call(null, 2 * (this__5988.cnt + 1));
      cljs.core.array_copy.call(null, this__5988.arr, 0, new_arr__5990, 0, 2 * this__5988.cnt);
      return new cljs.core.HashCollisionNode(e, this__5988.collision_hash, this__5988.cnt, new_arr__5990)
    }
  };
  var G__6007__3 = function(e, count, array) {
    var this__5991 = this;
    var inode__5992 = this;
    if(e === this__5991.edit) {
      this__5991.arr = array;
      this__5991.cnt = count;
      return inode__5992
    }else {
      return new cljs.core.HashCollisionNode(this__5991.edit, this__5991.collision_hash, count, array)
    }
  };
  G__6007 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__6007__1.call(this, e);
      case 3:
        return G__6007__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6007
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5993 = this;
  var inode__5994 = this;
  if(hash === this__5993.collision_hash) {
    var idx__5995 = cljs.core.hash_collision_node_find_index.call(null, this__5993.arr, this__5993.cnt, key);
    if(idx__5995 === -1) {
      if(this__5993.arr.length > 2 * this__5993.cnt) {
        var editable__5996 = cljs.core.edit_and_set.call(null, inode__5994, edit, 2 * this__5993.cnt, key, 2 * this__5993.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__5996.cnt = editable__5996.cnt + 1;
        return editable__5996
      }else {
        var len__5997 = this__5993.arr.length;
        var new_arr__5998 = cljs.core.make_array.call(null, len__5997 + 2);
        cljs.core.array_copy.call(null, this__5993.arr, 0, new_arr__5998, 0, len__5997);
        new_arr__5998[len__5997] = key;
        new_arr__5998[len__5997 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__5994.ensure_editable(edit, this__5993.cnt + 1, new_arr__5998)
      }
    }else {
      if(this__5993.arr[idx__5995 + 1] === val) {
        return inode__5994
      }else {
        return cljs.core.edit_and_set.call(null, inode__5994, edit, idx__5995 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__5993.collision_hash >>> shift & 31), [null, inode__5994, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5999 = this;
  var inode__6000 = this;
  var idx__6001 = cljs.core.hash_collision_node_find_index.call(null, this__5999.arr, this__5999.cnt, key);
  if(idx__6001 === -1) {
    return inode__6000
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__5999.cnt === 1) {
      return null
    }else {
      var editable__6002 = inode__6000.ensure_editable(edit);
      var earr__6003 = editable__6002.arr;
      earr__6003[idx__6001] = earr__6003[2 * this__5999.cnt - 2];
      earr__6003[idx__6001 + 1] = earr__6003[2 * this__5999.cnt - 1];
      earr__6003[2 * this__5999.cnt - 1] = null;
      earr__6003[2 * this__5999.cnt - 2] = null;
      editable__6002.cnt = editable__6002.cnt - 1;
      return editable__6002
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__6004 = this;
  var inode__6005 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6004.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6008 = cljs.core.hash.call(null, key1);
    if(key1hash__6008 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6008, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6009 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__6008, key1, val1, added_leaf_QMARK___6009).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___6009)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6010 = cljs.core.hash.call(null, key1);
    if(key1hash__6010 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6010, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6011 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__6010, key1, val1, added_leaf_QMARK___6011).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___6011)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6012 = this;
  var h__364__auto____6013 = this__6012.__hash;
  if(h__364__auto____6013 != null) {
    return h__364__auto____6013
  }else {
    var h__364__auto____6014 = cljs.core.hash_coll.call(null, coll);
    this__6012.__hash = h__364__auto____6014;
    return h__364__auto____6014
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6015 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__6016 = this;
  var this$__6017 = this;
  return cljs.core.pr_str.call(null, this$__6017)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6018 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6019 = this;
  if(this__6019.s == null) {
    return cljs.core.PersistentVector.fromArray([this__6019.nodes[this__6019.i], this__6019.nodes[this__6019.i + 1]])
  }else {
    return cljs.core.first.call(null, this__6019.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6020 = this;
  if(this__6020.s == null) {
    return cljs.core.create_inode_seq.call(null, this__6020.nodes, this__6020.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__6020.nodes, this__6020.i, cljs.core.next.call(null, this__6020.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6021 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6022 = this;
  return new cljs.core.NodeSeq(meta, this__6022.nodes, this__6022.i, this__6022.s, this__6022.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6023 = this;
  return this__6023.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6024 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6024.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__6025 = nodes.length;
      var j__6026 = i;
      while(true) {
        if(j__6026 < len__6025) {
          if(null != nodes[j__6026]) {
            return new cljs.core.NodeSeq(null, nodes, j__6026, null, null)
          }else {
            var temp__3695__auto____6027 = nodes[j__6026 + 1];
            if(cljs.core.truth_(temp__3695__auto____6027)) {
              var node__6028 = temp__3695__auto____6027;
              var temp__3695__auto____6029 = node__6028.inode_seq();
              if(cljs.core.truth_(temp__3695__auto____6029)) {
                var node_seq__6030 = temp__3695__auto____6029;
                return new cljs.core.NodeSeq(null, nodes, j__6026 + 2, node_seq__6030, null)
              }else {
                var G__6031 = j__6026 + 2;
                j__6026 = G__6031;
                continue
              }
            }else {
              var G__6032 = j__6026 + 2;
              j__6026 = G__6032;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6033 = this;
  var h__364__auto____6034 = this__6033.__hash;
  if(h__364__auto____6034 != null) {
    return h__364__auto____6034
  }else {
    var h__364__auto____6035 = cljs.core.hash_coll.call(null, coll);
    this__6033.__hash = h__364__auto____6035;
    return h__364__auto____6035
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6036 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__6037 = this;
  var this$__6038 = this;
  return cljs.core.pr_str.call(null, this$__6038)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6039 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6040 = this;
  return cljs.core.first.call(null, this__6040.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6041 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__6041.nodes, this__6041.i, cljs.core.next.call(null, this__6041.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6042 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6043 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__6043.nodes, this__6043.i, this__6043.s, this__6043.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6044 = this;
  return this__6044.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6045 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6045.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__6046 = nodes.length;
      var j__6047 = i;
      while(true) {
        if(j__6047 < len__6046) {
          var temp__3695__auto____6048 = nodes[j__6047];
          if(cljs.core.truth_(temp__3695__auto____6048)) {
            var nj__6049 = temp__3695__auto____6048;
            var temp__3695__auto____6050 = nj__6049.inode_seq();
            if(cljs.core.truth_(temp__3695__auto____6050)) {
              var ns__6051 = temp__3695__auto____6050;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__6047 + 1, ns__6051, null)
            }else {
              var G__6052 = j__6047 + 1;
              j__6047 = G__6052;
              continue
            }
          }else {
            var G__6053 = j__6047 + 1;
            j__6047 = G__6053;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6058 = this;
  return new cljs.core.TransientHashMap({}, this__6058.root, this__6058.cnt, this__6058.has_nil_QMARK_, this__6058.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6059 = this;
  var h__364__auto____6060 = this__6059.__hash;
  if(h__364__auto____6060 != null) {
    return h__364__auto____6060
  }else {
    var h__364__auto____6061 = cljs.core.hash_imap.call(null, coll);
    this__6059.__hash = h__364__auto____6061;
    return h__364__auto____6061
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6062 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6063 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6063.has_nil_QMARK_)) {
      return this__6063.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6063.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__6063.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6064 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6065 = this__6064.has_nil_QMARK_;
      if(cljs.core.truth_(and__3546__auto____6065)) {
        return v === this__6064.nil_val
      }else {
        return and__3546__auto____6065
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6064.meta, cljs.core.truth_(this__6064.has_nil_QMARK_) ? this__6064.cnt : this__6064.cnt + 1, this__6064.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___6066 = [false];
    var new_root__6067 = (this__6064.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6064.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6066);
    if(new_root__6067 === this__6064.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6064.meta, cljs.core.truth_(added_leaf_QMARK___6066[0]) ? this__6064.cnt + 1 : this__6064.cnt, new_root__6067, this__6064.has_nil_QMARK_, this__6064.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6068 = this;
  if(k == null) {
    return this__6068.has_nil_QMARK_
  }else {
    if(this__6068.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__6068.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6089 = null;
  var G__6089__2 = function(tsym6056, k) {
    var this__6069 = this;
    var tsym6056__6070 = this;
    var coll__6071 = tsym6056__6070;
    return cljs.core._lookup.call(null, coll__6071, k)
  };
  var G__6089__3 = function(tsym6057, k, not_found) {
    var this__6072 = this;
    var tsym6057__6073 = this;
    var coll__6074 = tsym6057__6073;
    return cljs.core._lookup.call(null, coll__6074, k, not_found)
  };
  G__6089 = function(tsym6057, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6089__2.call(this, tsym6057, k);
      case 3:
        return G__6089__3.call(this, tsym6057, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6089
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym6054, args6055) {
  return tsym6054.call.apply(tsym6054, [tsym6054].concat(cljs.core.aclone.call(null, args6055)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6075 = this;
  var init__6076 = cljs.core.truth_(this__6075.has_nil_QMARK_) ? f.call(null, init, null, this__6075.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__6076)) {
    return cljs.core.deref.call(null, init__6076)
  }else {
    if(null != this__6075.root) {
      return this__6075.root.kv_reduce(f, init__6076)
    }else {
      if("\ufdd0'else") {
        return init__6076
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6077 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__6078 = this;
  var this$__6079 = this;
  return cljs.core.pr_str.call(null, this$__6079)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6080 = this;
  if(this__6080.cnt > 0) {
    var s__6081 = null != this__6080.root ? this__6080.root.inode_seq() : null;
    if(cljs.core.truth_(this__6080.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__6080.nil_val]), s__6081)
    }else {
      return s__6081
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6082 = this;
  return this__6082.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6083 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6084 = this;
  return new cljs.core.PersistentHashMap(meta, this__6084.cnt, this__6084.root, this__6084.has_nil_QMARK_, this__6084.nil_val, this__6084.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6085 = this;
  return this__6085.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6086 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__6086.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6087 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6087.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__6087.meta, this__6087.cnt - 1, this__6087.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__6087.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__6088 = this__6087.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__6088 === this__6087.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__6087.meta, this__6087.cnt - 1, new_root__6088, this__6087.has_nil_QMARK_, this__6087.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__6090 = ks.length;
  var i__6091 = 0;
  var out__6092 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__6091 < len__6090) {
      var G__6093 = i__6091 + 1;
      var G__6094 = cljs.core.assoc_BANG_.call(null, out__6092, ks[i__6091], vs[i__6091]);
      i__6091 = G__6093;
      out__6092 = G__6094;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6092)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__6095 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6096 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__6097 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6098 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6099 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6099.has_nil_QMARK_)) {
      return this__6099.nil_val
    }else {
      return null
    }
  }else {
    if(this__6099.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__6099.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6100 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6100.has_nil_QMARK_)) {
      return this__6100.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6100.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__6100.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6101 = this;
  if(cljs.core.truth_(this__6101.edit)) {
    return this__6101.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__6102 = this;
  var tcoll__6103 = this;
  if(cljs.core.truth_(this__6102.edit)) {
    if(function() {
      var G__6104__6105 = o;
      if(G__6104__6105 != null) {
        if(function() {
          var or__3548__auto____6106 = G__6104__6105.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____6106) {
            return or__3548__auto____6106
          }else {
            return G__6104__6105.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6104__6105.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6104__6105)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6104__6105)
      }
    }()) {
      return tcoll__6103.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6107 = cljs.core.seq.call(null, o);
      var tcoll__6108 = tcoll__6103;
      while(true) {
        var temp__3695__auto____6109 = cljs.core.first.call(null, es__6107);
        if(cljs.core.truth_(temp__3695__auto____6109)) {
          var e__6110 = temp__3695__auto____6109;
          var G__6121 = cljs.core.next.call(null, es__6107);
          var G__6122 = tcoll__6108.assoc_BANG_(cljs.core.key.call(null, e__6110), cljs.core.val.call(null, e__6110));
          es__6107 = G__6121;
          tcoll__6108 = G__6122;
          continue
        }else {
          return tcoll__6108
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__6111 = this;
  var tcoll__6112 = this;
  if(cljs.core.truth_(this__6111.edit)) {
    if(k == null) {
      if(this__6111.nil_val === v) {
      }else {
        this__6111.nil_val = v
      }
      if(cljs.core.truth_(this__6111.has_nil_QMARK_)) {
      }else {
        this__6111.count = this__6111.count + 1;
        this__6111.has_nil_QMARK_ = true
      }
      return tcoll__6112
    }else {
      var added_leaf_QMARK___6113 = [false];
      var node__6114 = (this__6111.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6111.root).inode_assoc_BANG_(this__6111.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6113);
      if(node__6114 === this__6111.root) {
      }else {
        this__6111.root = node__6114
      }
      if(cljs.core.truth_(added_leaf_QMARK___6113[0])) {
        this__6111.count = this__6111.count + 1
      }else {
      }
      return tcoll__6112
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__6115 = this;
  var tcoll__6116 = this;
  if(cljs.core.truth_(this__6115.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__6115.has_nil_QMARK_)) {
        this__6115.has_nil_QMARK_ = false;
        this__6115.nil_val = null;
        this__6115.count = this__6115.count - 1;
        return tcoll__6116
      }else {
        return tcoll__6116
      }
    }else {
      if(this__6115.root == null) {
        return tcoll__6116
      }else {
        var removed_leaf_QMARK___6117 = [false];
        var node__6118 = this__6115.root.inode_without_BANG_(this__6115.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___6117);
        if(node__6118 === this__6115.root) {
        }else {
          this__6115.root = node__6118
        }
        if(cljs.core.truth_(removed_leaf_QMARK___6117[0])) {
          this__6115.count = this__6115.count - 1
        }else {
        }
        return tcoll__6116
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__6119 = this;
  var tcoll__6120 = this;
  if(cljs.core.truth_(this__6119.edit)) {
    this__6119.edit = null;
    return new cljs.core.PersistentHashMap(null, this__6119.count, this__6119.root, this__6119.has_nil_QMARK_, this__6119.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__6123 = node;
  var stack__6124 = stack;
  while(true) {
    if(t__6123 != null) {
      var G__6125 = cljs.core.truth_(ascending_QMARK_) ? t__6123.left : t__6123.right;
      var G__6126 = cljs.core.conj.call(null, stack__6124, t__6123);
      t__6123 = G__6125;
      stack__6124 = G__6126;
      continue
    }else {
      return stack__6124
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6127 = this;
  var h__364__auto____6128 = this__6127.__hash;
  if(h__364__auto____6128 != null) {
    return h__364__auto____6128
  }else {
    var h__364__auto____6129 = cljs.core.hash_coll.call(null, coll);
    this__6127.__hash = h__364__auto____6129;
    return h__364__auto____6129
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6130 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__6131 = this;
  var this$__6132 = this;
  return cljs.core.pr_str.call(null, this$__6132)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6133 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6134 = this;
  if(this__6134.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__6134.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__6135 = this;
  return cljs.core.peek.call(null, this__6135.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__6136 = this;
  var t__6137 = cljs.core.peek.call(null, this__6136.stack);
  var next_stack__6138 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__6136.ascending_QMARK_) ? t__6137.right : t__6137.left, cljs.core.pop.call(null, this__6136.stack), this__6136.ascending_QMARK_);
  if(next_stack__6138 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__6138, this__6136.ascending_QMARK_, this__6136.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6139 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6140 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__6140.stack, this__6140.ascending_QMARK_, this__6140.cnt, this__6140.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6141 = this;
  return this__6141.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3546__auto____6142 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3546__auto____6142) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3546__auto____6142
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3546__auto____6143 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3546__auto____6143) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3546__auto____6143
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__6144 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__6144)) {
    return cljs.core.deref.call(null, init__6144)
  }else {
    var init__6145 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__6144) : init__6144;
    if(cljs.core.reduced_QMARK_.call(null, init__6145)) {
      return cljs.core.deref.call(null, init__6145)
    }else {
      var init__6146 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__6145) : init__6145;
      if(cljs.core.reduced_QMARK_.call(null, init__6146)) {
        return cljs.core.deref.call(null, init__6146)
      }else {
        return init__6146
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6151 = this;
  var h__364__auto____6152 = this__6151.__hash;
  if(h__364__auto____6152 != null) {
    return h__364__auto____6152
  }else {
    var h__364__auto____6153 = cljs.core.hash_coll.call(null, coll);
    this__6151.__hash = h__364__auto____6153;
    return h__364__auto____6153
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6154 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6155 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6156 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6156.key, this__6156.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__6203 = null;
  var G__6203__2 = function(tsym6149, k) {
    var this__6157 = this;
    var tsym6149__6158 = this;
    var node__6159 = tsym6149__6158;
    return cljs.core._lookup.call(null, node__6159, k)
  };
  var G__6203__3 = function(tsym6150, k, not_found) {
    var this__6160 = this;
    var tsym6150__6161 = this;
    var node__6162 = tsym6150__6161;
    return cljs.core._lookup.call(null, node__6162, k, not_found)
  };
  G__6203 = function(tsym6150, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6203__2.call(this, tsym6150, k);
      case 3:
        return G__6203__3.call(this, tsym6150, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6203
}();
cljs.core.BlackNode.prototype.apply = function(tsym6147, args6148) {
  return tsym6147.call.apply(tsym6147, [tsym6147].concat(cljs.core.aclone.call(null, args6148)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6163 = this;
  return cljs.core.PersistentVector.fromArray([this__6163.key, this__6163.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6164 = this;
  return this__6164.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6165 = this;
  return this__6165.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__6166 = this;
  var node__6167 = this;
  return ins.balance_right(node__6167)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__6168 = this;
  var node__6169 = this;
  return new cljs.core.RedNode(this__6168.key, this__6168.val, this__6168.left, this__6168.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__6170 = this;
  var node__6171 = this;
  return cljs.core.balance_right_del.call(null, this__6170.key, this__6170.val, this__6170.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__6172 = this;
  var node__6173 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__6174 = this;
  var node__6175 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6175, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__6176 = this;
  var node__6177 = this;
  return cljs.core.balance_left_del.call(null, this__6176.key, this__6176.val, del, this__6176.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__6178 = this;
  var node__6179 = this;
  return ins.balance_left(node__6179)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__6180 = this;
  var node__6181 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__6181, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__6204 = null;
  var G__6204__0 = function() {
    var this__6184 = this;
    var this$__6185 = this;
    return cljs.core.pr_str.call(null, this$__6185)
  };
  G__6204 = function() {
    switch(arguments.length) {
      case 0:
        return G__6204__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6204
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__6186 = this;
  var node__6187 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6187, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__6188 = this;
  var node__6189 = this;
  return node__6189
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6190 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6191 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6192 = this;
  return cljs.core.list.call(null, this__6192.key, this__6192.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6194 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6195 = this;
  return this__6195.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6196 = this;
  return cljs.core.PersistentVector.fromArray([this__6196.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6197 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6197.key, this__6197.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6198 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6199 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6199.key, this__6199.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6200 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6201 = this;
  if(n === 0) {
    return this__6201.key
  }else {
    if(n === 1) {
      return this__6201.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6202 = this;
  if(n === 0) {
    return this__6202.key
  }else {
    if(n === 1) {
      return this__6202.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6193 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6209 = this;
  var h__364__auto____6210 = this__6209.__hash;
  if(h__364__auto____6210 != null) {
    return h__364__auto____6210
  }else {
    var h__364__auto____6211 = cljs.core.hash_coll.call(null, coll);
    this__6209.__hash = h__364__auto____6211;
    return h__364__auto____6211
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6212 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6213 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6214 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6214.key, this__6214.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__6261 = null;
  var G__6261__2 = function(tsym6207, k) {
    var this__6215 = this;
    var tsym6207__6216 = this;
    var node__6217 = tsym6207__6216;
    return cljs.core._lookup.call(null, node__6217, k)
  };
  var G__6261__3 = function(tsym6208, k, not_found) {
    var this__6218 = this;
    var tsym6208__6219 = this;
    var node__6220 = tsym6208__6219;
    return cljs.core._lookup.call(null, node__6220, k, not_found)
  };
  G__6261 = function(tsym6208, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6261__2.call(this, tsym6208, k);
      case 3:
        return G__6261__3.call(this, tsym6208, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6261
}();
cljs.core.RedNode.prototype.apply = function(tsym6205, args6206) {
  return tsym6205.call.apply(tsym6205, [tsym6205].concat(cljs.core.aclone.call(null, args6206)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6221 = this;
  return cljs.core.PersistentVector.fromArray([this__6221.key, this__6221.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6222 = this;
  return this__6222.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6223 = this;
  return this__6223.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__6224 = this;
  var node__6225 = this;
  return new cljs.core.RedNode(this__6224.key, this__6224.val, this__6224.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__6226 = this;
  var node__6227 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__6228 = this;
  var node__6229 = this;
  return new cljs.core.RedNode(this__6228.key, this__6228.val, this__6228.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__6230 = this;
  var node__6231 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__6232 = this;
  var node__6233 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6233, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__6234 = this;
  var node__6235 = this;
  return new cljs.core.RedNode(this__6234.key, this__6234.val, del, this__6234.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__6236 = this;
  var node__6237 = this;
  return new cljs.core.RedNode(this__6236.key, this__6236.val, ins, this__6236.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__6238 = this;
  var node__6239 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6238.left)) {
    return new cljs.core.RedNode(this__6238.key, this__6238.val, this__6238.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__6238.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6238.right)) {
      return new cljs.core.RedNode(this__6238.right.key, this__6238.right.val, new cljs.core.BlackNode(this__6238.key, this__6238.val, this__6238.left, this__6238.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__6238.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__6239, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__6262 = null;
  var G__6262__0 = function() {
    var this__6242 = this;
    var this$__6243 = this;
    return cljs.core.pr_str.call(null, this$__6243)
  };
  G__6262 = function() {
    switch(arguments.length) {
      case 0:
        return G__6262__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6262
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__6244 = this;
  var node__6245 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6244.right)) {
    return new cljs.core.RedNode(this__6244.key, this__6244.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6244.left, null), this__6244.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6244.left)) {
      return new cljs.core.RedNode(this__6244.left.key, this__6244.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6244.left.left, null), new cljs.core.BlackNode(this__6244.key, this__6244.val, this__6244.left.right, this__6244.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6245, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__6246 = this;
  var node__6247 = this;
  return new cljs.core.BlackNode(this__6246.key, this__6246.val, this__6246.left, this__6246.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6248 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6249 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6250 = this;
  return cljs.core.list.call(null, this__6250.key, this__6250.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6252 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6253 = this;
  return this__6253.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6254 = this;
  return cljs.core.PersistentVector.fromArray([this__6254.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6255 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6255.key, this__6255.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6256 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6257 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6257.key, this__6257.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6258 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6259 = this;
  if(n === 0) {
    return this__6259.key
  }else {
    if(n === 1) {
      return this__6259.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6260 = this;
  if(n === 0) {
    return this__6260.key
  }else {
    if(n === 1) {
      return this__6260.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6251 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__6263 = comp.call(null, k, tree.key);
    if(c__6263 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__6263 < 0) {
        var ins__6264 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__6264 != null) {
          return tree.add_left(ins__6264)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__6265 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__6265 != null) {
            return tree.add_right(ins__6265)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__6266 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6266)) {
            return new cljs.core.RedNode(app__6266.key, app__6266.val, new cljs.core.RedNode(left.key, left.val, left.left, app__6266.left), new cljs.core.RedNode(right.key, right.val, app__6266.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__6266, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__6267 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6267)) {
              return new cljs.core.RedNode(app__6267.key, app__6267.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__6267.left, null), new cljs.core.BlackNode(right.key, right.val, app__6267.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__6267, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(tree != null) {
    var c__6268 = comp.call(null, k, tree.key);
    if(c__6268 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__6268 < 0) {
        var del__6269 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3548__auto____6270 = del__6269 != null;
          if(or__3548__auto____6270) {
            return or__3548__auto____6270
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__6269, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__6269, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__6271 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3548__auto____6272 = del__6271 != null;
            if(or__3548__auto____6272) {
              return or__3548__auto____6272
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__6271)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__6271, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__6273 = tree.key;
  var c__6274 = comp.call(null, k, tk__6273);
  if(c__6274 === 0) {
    return tree.replace(tk__6273, v, tree.left, tree.right)
  }else {
    if(c__6274 < 0) {
      return tree.replace(tk__6273, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__6273, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6279 = this;
  var h__364__auto____6280 = this__6279.__hash;
  if(h__364__auto____6280 != null) {
    return h__364__auto____6280
  }else {
    var h__364__auto____6281 = cljs.core.hash_imap.call(null, coll);
    this__6279.__hash = h__364__auto____6281;
    return h__364__auto____6281
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6282 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6283 = this;
  var n__6284 = coll.entry_at(k);
  if(n__6284 != null) {
    return n__6284.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6285 = this;
  var found__6286 = [null];
  var t__6287 = cljs.core.tree_map_add.call(null, this__6285.comp, this__6285.tree, k, v, found__6286);
  if(t__6287 == null) {
    var found_node__6288 = cljs.core.nth.call(null, found__6286, 0);
    if(cljs.core._EQ_.call(null, v, found_node__6288.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6285.comp, cljs.core.tree_map_replace.call(null, this__6285.comp, this__6285.tree, k, v), this__6285.cnt, this__6285.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6285.comp, t__6287.blacken(), this__6285.cnt + 1, this__6285.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6289 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6321 = null;
  var G__6321__2 = function(tsym6277, k) {
    var this__6290 = this;
    var tsym6277__6291 = this;
    var coll__6292 = tsym6277__6291;
    return cljs.core._lookup.call(null, coll__6292, k)
  };
  var G__6321__3 = function(tsym6278, k, not_found) {
    var this__6293 = this;
    var tsym6278__6294 = this;
    var coll__6295 = tsym6278__6294;
    return cljs.core._lookup.call(null, coll__6295, k, not_found)
  };
  G__6321 = function(tsym6278, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6321__2.call(this, tsym6278, k);
      case 3:
        return G__6321__3.call(this, tsym6278, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6321
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym6275, args6276) {
  return tsym6275.call.apply(tsym6275, [tsym6275].concat(cljs.core.aclone.call(null, args6276)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6296 = this;
  if(this__6296.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__6296.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6297 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6298 = this;
  if(this__6298.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6298.tree, false, this__6298.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__6299 = this;
  var this$__6300 = this;
  return cljs.core.pr_str.call(null, this$__6300)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__6301 = this;
  var coll__6302 = this;
  var t__6303 = this__6301.tree;
  while(true) {
    if(t__6303 != null) {
      var c__6304 = this__6301.comp.call(null, k, t__6303.key);
      if(c__6304 === 0) {
        return t__6303
      }else {
        if(c__6304 < 0) {
          var G__6322 = t__6303.left;
          t__6303 = G__6322;
          continue
        }else {
          if("\ufdd0'else") {
            var G__6323 = t__6303.right;
            t__6303 = G__6323;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6305 = this;
  if(this__6305.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6305.tree, ascending_QMARK_, this__6305.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6306 = this;
  if(this__6306.cnt > 0) {
    var stack__6307 = null;
    var t__6308 = this__6306.tree;
    while(true) {
      if(t__6308 != null) {
        var c__6309 = this__6306.comp.call(null, k, t__6308.key);
        if(c__6309 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__6307, t__6308), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__6309 < 0) {
              var G__6324 = cljs.core.conj.call(null, stack__6307, t__6308);
              var G__6325 = t__6308.left;
              stack__6307 = G__6324;
              t__6308 = G__6325;
              continue
            }else {
              var G__6326 = stack__6307;
              var G__6327 = t__6308.right;
              stack__6307 = G__6326;
              t__6308 = G__6327;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__6309 > 0) {
                var G__6328 = cljs.core.conj.call(null, stack__6307, t__6308);
                var G__6329 = t__6308.right;
                stack__6307 = G__6328;
                t__6308 = G__6329;
                continue
              }else {
                var G__6330 = stack__6307;
                var G__6331 = t__6308.left;
                stack__6307 = G__6330;
                t__6308 = G__6331;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__6307 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__6307, ascending_QMARK_, -1)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6310 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6311 = this;
  return this__6311.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6312 = this;
  if(this__6312.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6312.tree, true, this__6312.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6313 = this;
  return this__6313.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6314 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6315 = this;
  return new cljs.core.PersistentTreeMap(this__6315.comp, this__6315.tree, this__6315.cnt, meta, this__6315.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6319 = this;
  return this__6319.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6320 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__6320.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6316 = this;
  var found__6317 = [null];
  var t__6318 = cljs.core.tree_map_remove.call(null, this__6316.comp, this__6316.tree, k, found__6317);
  if(t__6318 == null) {
    if(cljs.core.nth.call(null, found__6317, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6316.comp, null, 0, this__6316.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6316.comp, t__6318.blacken(), this__6316.cnt - 1, this__6316.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__6332 = cljs.core.seq.call(null, keyvals);
    var out__6333 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__6332)) {
        var G__6334 = cljs.core.nnext.call(null, in$__6332);
        var G__6335 = cljs.core.assoc_BANG_.call(null, out__6333, cljs.core.first.call(null, in$__6332), cljs.core.second.call(null, in$__6332));
        in$__6332 = G__6334;
        out__6333 = G__6335;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6333)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__6336) {
    var keyvals = cljs.core.seq(arglist__6336);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__6337) {
    var keyvals = cljs.core.seq(arglist__6337);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__6338 = cljs.core.seq.call(null, keyvals);
    var out__6339 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__6338)) {
        var G__6340 = cljs.core.nnext.call(null, in$__6338);
        var G__6341 = cljs.core.assoc.call(null, out__6339, cljs.core.first.call(null, in$__6338), cljs.core.second.call(null, in$__6338));
        in$__6338 = G__6340;
        out__6339 = G__6341;
        continue
      }else {
        return out__6339
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__6342) {
    var keyvals = cljs.core.seq(arglist__6342);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__6343 = cljs.core.seq.call(null, keyvals);
    var out__6344 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__6343)) {
        var G__6345 = cljs.core.nnext.call(null, in$__6343);
        var G__6346 = cljs.core.assoc.call(null, out__6344, cljs.core.first.call(null, in$__6343), cljs.core.second.call(null, in$__6343));
        in$__6343 = G__6345;
        out__6344 = G__6346;
        continue
      }else {
        return out__6344
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__6347) {
    var comparator = cljs.core.first(arglist__6347);
    var keyvals = cljs.core.rest(arglist__6347);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__6348_SHARP_, p2__6349_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____6350 = p1__6348_SHARP_;
          if(cljs.core.truth_(or__3548__auto____6350)) {
            return or__3548__auto____6350
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__6349_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__6351) {
    var maps = cljs.core.seq(arglist__6351);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__6354 = function(m, e) {
        var k__6352 = cljs.core.first.call(null, e);
        var v__6353 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__6352)) {
          return cljs.core.assoc.call(null, m, k__6352, f.call(null, cljs.core.get.call(null, m, k__6352), v__6353))
        }else {
          return cljs.core.assoc.call(null, m, k__6352, v__6353)
        }
      };
      var merge2__6356 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__6354, function() {
          var or__3548__auto____6355 = m1;
          if(cljs.core.truth_(or__3548__auto____6355)) {
            return or__3548__auto____6355
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__6356, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__6357) {
    var f = cljs.core.first(arglist__6357);
    var maps = cljs.core.rest(arglist__6357);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__6358 = cljs.core.ObjMap.fromObject([], {});
  var keys__6359 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__6359)) {
      var key__6360 = cljs.core.first.call(null, keys__6359);
      var entry__6361 = cljs.core.get.call(null, map, key__6360, "\ufdd0'user/not-found");
      var G__6362 = cljs.core.not_EQ_.call(null, entry__6361, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__6358, key__6360, entry__6361) : ret__6358;
      var G__6363 = cljs.core.next.call(null, keys__6359);
      ret__6358 = G__6362;
      keys__6359 = G__6363;
      continue
    }else {
      return ret__6358
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6369 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__6369.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6370 = this;
  var h__364__auto____6371 = this__6370.__hash;
  if(h__364__auto____6371 != null) {
    return h__364__auto____6371
  }else {
    var h__364__auto____6372 = cljs.core.hash_iset.call(null, coll);
    this__6370.__hash = h__364__auto____6372;
    return h__364__auto____6372
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6373 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6374 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6374.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6393 = null;
  var G__6393__2 = function(tsym6367, k) {
    var this__6375 = this;
    var tsym6367__6376 = this;
    var coll__6377 = tsym6367__6376;
    return cljs.core._lookup.call(null, coll__6377, k)
  };
  var G__6393__3 = function(tsym6368, k, not_found) {
    var this__6378 = this;
    var tsym6368__6379 = this;
    var coll__6380 = tsym6368__6379;
    return cljs.core._lookup.call(null, coll__6380, k, not_found)
  };
  G__6393 = function(tsym6368, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6393__2.call(this, tsym6368, k);
      case 3:
        return G__6393__3.call(this, tsym6368, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6393
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym6365, args6366) {
  return tsym6365.call.apply(tsym6365, [tsym6365].concat(cljs.core.aclone.call(null, args6366)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6381 = this;
  return new cljs.core.PersistentHashSet(this__6381.meta, cljs.core.assoc.call(null, this__6381.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__6382 = this;
  var this$__6383 = this;
  return cljs.core.pr_str.call(null, this$__6383)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6384 = this;
  return cljs.core.keys.call(null, this__6384.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6385 = this;
  return new cljs.core.PersistentHashSet(this__6385.meta, cljs.core.dissoc.call(null, this__6385.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6386 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6387 = this;
  var and__3546__auto____6388 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6388) {
    var and__3546__auto____6389 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6389) {
      return cljs.core.every_QMARK_.call(null, function(p1__6364_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6364_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6389
    }
  }else {
    return and__3546__auto____6388
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6390 = this;
  return new cljs.core.PersistentHashSet(meta, this__6390.hash_map, this__6390.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6391 = this;
  return this__6391.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6392 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__6392.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6411 = null;
  var G__6411__2 = function(tsym6397, k) {
    var this__6399 = this;
    var tsym6397__6400 = this;
    var tcoll__6401 = tsym6397__6400;
    if(cljs.core._lookup.call(null, this__6399.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6411__3 = function(tsym6398, k, not_found) {
    var this__6402 = this;
    var tsym6398__6403 = this;
    var tcoll__6404 = tsym6398__6403;
    if(cljs.core._lookup.call(null, this__6402.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6411 = function(tsym6398, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6411__2.call(this, tsym6398, k);
      case 3:
        return G__6411__3.call(this, tsym6398, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6411
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym6395, args6396) {
  return tsym6395.call.apply(tsym6395, [tsym6395].concat(cljs.core.aclone.call(null, args6396)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__6405 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__6406 = this;
  if(cljs.core._lookup.call(null, this__6406.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6407 = this;
  return cljs.core.count.call(null, this__6407.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__6408 = this;
  this__6408.transient_map = cljs.core.dissoc_BANG_.call(null, this__6408.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6409 = this;
  this__6409.transient_map = cljs.core.assoc_BANG_.call(null, this__6409.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6410 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__6410.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6416 = this;
  var h__364__auto____6417 = this__6416.__hash;
  if(h__364__auto____6417 != null) {
    return h__364__auto____6417
  }else {
    var h__364__auto____6418 = cljs.core.hash_iset.call(null, coll);
    this__6416.__hash = h__364__auto____6418;
    return h__364__auto____6418
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6419 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6420 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6420.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6444 = null;
  var G__6444__2 = function(tsym6414, k) {
    var this__6421 = this;
    var tsym6414__6422 = this;
    var coll__6423 = tsym6414__6422;
    return cljs.core._lookup.call(null, coll__6423, k)
  };
  var G__6444__3 = function(tsym6415, k, not_found) {
    var this__6424 = this;
    var tsym6415__6425 = this;
    var coll__6426 = tsym6415__6425;
    return cljs.core._lookup.call(null, coll__6426, k, not_found)
  };
  G__6444 = function(tsym6415, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6444__2.call(this, tsym6415, k);
      case 3:
        return G__6444__3.call(this, tsym6415, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6444
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym6412, args6413) {
  return tsym6412.call.apply(tsym6412, [tsym6412].concat(cljs.core.aclone.call(null, args6413)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6427 = this;
  return new cljs.core.PersistentTreeSet(this__6427.meta, cljs.core.assoc.call(null, this__6427.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6428 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__6428.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__6429 = this;
  var this$__6430 = this;
  return cljs.core.pr_str.call(null, this$__6430)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6431 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__6431.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6432 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__6432.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6433 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6434 = this;
  return cljs.core._comparator.call(null, this__6434.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6435 = this;
  return cljs.core.keys.call(null, this__6435.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6436 = this;
  return new cljs.core.PersistentTreeSet(this__6436.meta, cljs.core.dissoc.call(null, this__6436.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6437 = this;
  return cljs.core.count.call(null, this__6437.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6438 = this;
  var and__3546__auto____6439 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6439) {
    var and__3546__auto____6440 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6440) {
      return cljs.core.every_QMARK_.call(null, function(p1__6394_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6394_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6440
    }
  }else {
    return and__3546__auto____6439
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6441 = this;
  return new cljs.core.PersistentTreeSet(meta, this__6441.tree_map, this__6441.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6442 = this;
  return this__6442.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6443 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__6443.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__6445 = cljs.core.seq.call(null, coll);
  var out__6446 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__6445))) {
      var G__6447 = cljs.core.next.call(null, in$__6445);
      var G__6448 = cljs.core.conj_BANG_.call(null, out__6446, cljs.core.first.call(null, in$__6445));
      in$__6445 = G__6447;
      out__6446 = G__6448;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6446)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__6449) {
    var keys = cljs.core.seq(arglist__6449);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__6451) {
    var comparator = cljs.core.first(arglist__6451);
    var keys = cljs.core.rest(arglist__6451);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__6452 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____6453 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____6453)) {
        var e__6454 = temp__3695__auto____6453;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__6454))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__6452, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6450_SHARP_) {
      var temp__3695__auto____6455 = cljs.core.find.call(null, smap, p1__6450_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____6455)) {
        var e__6456 = temp__3695__auto____6455;
        return cljs.core.second.call(null, e__6456)
      }else {
        return p1__6450_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__6464 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__6457, seen) {
        while(true) {
          var vec__6458__6459 = p__6457;
          var f__6460 = cljs.core.nth.call(null, vec__6458__6459, 0, null);
          var xs__6461 = vec__6458__6459;
          var temp__3698__auto____6462 = cljs.core.seq.call(null, xs__6461);
          if(cljs.core.truth_(temp__3698__auto____6462)) {
            var s__6463 = temp__3698__auto____6462;
            if(cljs.core.contains_QMARK_.call(null, seen, f__6460)) {
              var G__6465 = cljs.core.rest.call(null, s__6463);
              var G__6466 = seen;
              p__6457 = G__6465;
              seen = G__6466;
              continue
            }else {
              return cljs.core.cons.call(null, f__6460, step.call(null, cljs.core.rest.call(null, s__6463), cljs.core.conj.call(null, seen, f__6460)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__6464.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__6467 = cljs.core.PersistentVector.fromArray([]);
  var s__6468 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__6468))) {
      var G__6469 = cljs.core.conj.call(null, ret__6467, cljs.core.first.call(null, s__6468));
      var G__6470 = cljs.core.next.call(null, s__6468);
      ret__6467 = G__6469;
      s__6468 = G__6470;
      continue
    }else {
      return cljs.core.seq.call(null, ret__6467)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3548__auto____6471 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3548__auto____6471) {
        return or__3548__auto____6471
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__6472 = x.lastIndexOf("/");
      if(i__6472 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__6472 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3548__auto____6473 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3548__auto____6473) {
      return or__3548__auto____6473
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__6474 = x.lastIndexOf("/");
    if(i__6474 > -1) {
      return cljs.core.subs.call(null, x, 2, i__6474)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__6477 = cljs.core.ObjMap.fromObject([], {});
  var ks__6478 = cljs.core.seq.call(null, keys);
  var vs__6479 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6480 = ks__6478;
      if(cljs.core.truth_(and__3546__auto____6480)) {
        return vs__6479
      }else {
        return and__3546__auto____6480
      }
    }())) {
      var G__6481 = cljs.core.assoc.call(null, map__6477, cljs.core.first.call(null, ks__6478), cljs.core.first.call(null, vs__6479));
      var G__6482 = cljs.core.next.call(null, ks__6478);
      var G__6483 = cljs.core.next.call(null, vs__6479);
      map__6477 = G__6481;
      ks__6478 = G__6482;
      vs__6479 = G__6483;
      continue
    }else {
      return map__6477
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__6486__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6475_SHARP_, p2__6476_SHARP_) {
        return max_key.call(null, k, p1__6475_SHARP_, p2__6476_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6486 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6486__delegate.call(this, k, x, y, more)
    };
    G__6486.cljs$lang$maxFixedArity = 3;
    G__6486.cljs$lang$applyTo = function(arglist__6487) {
      var k = cljs.core.first(arglist__6487);
      var x = cljs.core.first(cljs.core.next(arglist__6487));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6487)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6487)));
      return G__6486__delegate(k, x, y, more)
    };
    G__6486.cljs$lang$arity$variadic = G__6486__delegate;
    return G__6486
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__6488__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6484_SHARP_, p2__6485_SHARP_) {
        return min_key.call(null, k, p1__6484_SHARP_, p2__6485_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6488 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6488__delegate.call(this, k, x, y, more)
    };
    G__6488.cljs$lang$maxFixedArity = 3;
    G__6488.cljs$lang$applyTo = function(arglist__6489) {
      var k = cljs.core.first(arglist__6489);
      var x = cljs.core.first(cljs.core.next(arglist__6489));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6489)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6489)));
      return G__6488__delegate(k, x, y, more)
    };
    G__6488.cljs$lang$arity$variadic = G__6488__delegate;
    return G__6488
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____6490 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6490)) {
        var s__6491 = temp__3698__auto____6490;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__6491), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__6491)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____6492 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6492)) {
      var s__6493 = temp__3698__auto____6492;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__6493)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6493), take_while.call(null, pred, cljs.core.rest.call(null, s__6493)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__6494 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__6494.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__6495 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3698__auto____6496 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3698__auto____6496)) {
        var vec__6497__6498 = temp__3698__auto____6496;
        var e__6499 = cljs.core.nth.call(null, vec__6497__6498, 0, null);
        var s__6500 = vec__6497__6498;
        if(cljs.core.truth_(include__6495.call(null, e__6499))) {
          return s__6500
        }else {
          return cljs.core.next.call(null, s__6500)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6495, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6501 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3698__auto____6501)) {
      var vec__6502__6503 = temp__3698__auto____6501;
      var e__6504 = cljs.core.nth.call(null, vec__6502__6503, 0, null);
      var s__6505 = vec__6502__6503;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__6504)) ? s__6505 : cljs.core.next.call(null, s__6505))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__6506 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3698__auto____6507 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3698__auto____6507)) {
        var vec__6508__6509 = temp__3698__auto____6507;
        var e__6510 = cljs.core.nth.call(null, vec__6508__6509, 0, null);
        var s__6511 = vec__6508__6509;
        if(cljs.core.truth_(include__6506.call(null, e__6510))) {
          return s__6511
        }else {
          return cljs.core.next.call(null, s__6511)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6506, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6512 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3698__auto____6512)) {
      var vec__6513__6514 = temp__3698__auto____6512;
      var e__6515 = cljs.core.nth.call(null, vec__6513__6514, 0, null);
      var s__6516 = vec__6513__6514;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__6515)) ? s__6516 : cljs.core.next.call(null, s__6516))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__6517 = this;
  var h__364__auto____6518 = this__6517.__hash;
  if(h__364__auto____6518 != null) {
    return h__364__auto____6518
  }else {
    var h__364__auto____6519 = cljs.core.hash_coll.call(null, rng);
    this__6517.__hash = h__364__auto____6519;
    return h__364__auto____6519
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__6520 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__6521 = this;
  var this$__6522 = this;
  return cljs.core.pr_str.call(null, this$__6522)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__6523 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__6524 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__6525 = this;
  var comp__6526 = this__6525.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__6526.call(null, this__6525.start, this__6525.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__6527 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__6527.end - this__6527.start) / this__6527.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__6528 = this;
  return this__6528.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__6529 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__6529.meta, this__6529.start + this__6529.step, this__6529.end, this__6529.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__6530 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__6531 = this;
  return new cljs.core.Range(meta, this__6531.start, this__6531.end, this__6531.step, this__6531.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__6532 = this;
  return this__6532.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__6533 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6533.start + n * this__6533.step
  }else {
    if(function() {
      var and__3546__auto____6534 = this__6533.start > this__6533.end;
      if(and__3546__auto____6534) {
        return this__6533.step === 0
      }else {
        return and__3546__auto____6534
      }
    }()) {
      return this__6533.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__6535 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6535.start + n * this__6535.step
  }else {
    if(function() {
      var and__3546__auto____6536 = this__6535.start > this__6535.end;
      if(and__3546__auto____6536) {
        return this__6535.step === 0
      }else {
        return and__3546__auto____6536
      }
    }()) {
      return this__6535.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__6537 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6537.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____6538 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6538)) {
      var s__6539 = temp__3698__auto____6538;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__6539), take_nth.call(null, n, cljs.core.drop.call(null, n, s__6539)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____6541 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6541)) {
      var s__6542 = temp__3698__auto____6541;
      var fst__6543 = cljs.core.first.call(null, s__6542);
      var fv__6544 = f.call(null, fst__6543);
      var run__6545 = cljs.core.cons.call(null, fst__6543, cljs.core.take_while.call(null, function(p1__6540_SHARP_) {
        return cljs.core._EQ_.call(null, fv__6544, f.call(null, p1__6540_SHARP_))
      }, cljs.core.next.call(null, s__6542)));
      return cljs.core.cons.call(null, run__6545, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__6545), s__6542))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____6556 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____6556)) {
        var s__6557 = temp__3695__auto____6556;
        return reductions.call(null, f, cljs.core.first.call(null, s__6557), cljs.core.rest.call(null, s__6557))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____6558 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6558)) {
        var s__6559 = temp__3698__auto____6558;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__6559)), cljs.core.rest.call(null, s__6559))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__6561 = null;
      var G__6561__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6561__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6561__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6561__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6561__4 = function() {
        var G__6562__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6562 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6562__delegate.call(this, x, y, z, args)
        };
        G__6562.cljs$lang$maxFixedArity = 3;
        G__6562.cljs$lang$applyTo = function(arglist__6563) {
          var x = cljs.core.first(arglist__6563);
          var y = cljs.core.first(cljs.core.next(arglist__6563));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6563)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6563)));
          return G__6562__delegate(x, y, z, args)
        };
        G__6562.cljs$lang$arity$variadic = G__6562__delegate;
        return G__6562
      }();
      G__6561 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6561__0.call(this);
          case 1:
            return G__6561__1.call(this, x);
          case 2:
            return G__6561__2.call(this, x, y);
          case 3:
            return G__6561__3.call(this, x, y, z);
          default:
            return G__6561__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6561.cljs$lang$maxFixedArity = 3;
      G__6561.cljs$lang$applyTo = G__6561__4.cljs$lang$applyTo;
      return G__6561
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6564 = null;
      var G__6564__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6564__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6564__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6564__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6564__4 = function() {
        var G__6565__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6565 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6565__delegate.call(this, x, y, z, args)
        };
        G__6565.cljs$lang$maxFixedArity = 3;
        G__6565.cljs$lang$applyTo = function(arglist__6566) {
          var x = cljs.core.first(arglist__6566);
          var y = cljs.core.first(cljs.core.next(arglist__6566));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6566)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6566)));
          return G__6565__delegate(x, y, z, args)
        };
        G__6565.cljs$lang$arity$variadic = G__6565__delegate;
        return G__6565
      }();
      G__6564 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6564__0.call(this);
          case 1:
            return G__6564__1.call(this, x);
          case 2:
            return G__6564__2.call(this, x, y);
          case 3:
            return G__6564__3.call(this, x, y, z);
          default:
            return G__6564__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6564.cljs$lang$maxFixedArity = 3;
      G__6564.cljs$lang$applyTo = G__6564__4.cljs$lang$applyTo;
      return G__6564
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6567 = null;
      var G__6567__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6567__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6567__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6567__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6567__4 = function() {
        var G__6568__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6568 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6568__delegate.call(this, x, y, z, args)
        };
        G__6568.cljs$lang$maxFixedArity = 3;
        G__6568.cljs$lang$applyTo = function(arglist__6569) {
          var x = cljs.core.first(arglist__6569);
          var y = cljs.core.first(cljs.core.next(arglist__6569));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6569)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6569)));
          return G__6568__delegate(x, y, z, args)
        };
        G__6568.cljs$lang$arity$variadic = G__6568__delegate;
        return G__6568
      }();
      G__6567 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6567__0.call(this);
          case 1:
            return G__6567__1.call(this, x);
          case 2:
            return G__6567__2.call(this, x, y);
          case 3:
            return G__6567__3.call(this, x, y, z);
          default:
            return G__6567__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6567.cljs$lang$maxFixedArity = 3;
      G__6567.cljs$lang$applyTo = G__6567__4.cljs$lang$applyTo;
      return G__6567
    }()
  };
  var juxt__4 = function() {
    var G__6570__delegate = function(f, g, h, fs) {
      var fs__6560 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6571 = null;
        var G__6571__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6546_SHARP_, p2__6547_SHARP_) {
            return cljs.core.conj.call(null, p1__6546_SHARP_, p2__6547_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__6560)
        };
        var G__6571__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6548_SHARP_, p2__6549_SHARP_) {
            return cljs.core.conj.call(null, p1__6548_SHARP_, p2__6549_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__6560)
        };
        var G__6571__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6550_SHARP_, p2__6551_SHARP_) {
            return cljs.core.conj.call(null, p1__6550_SHARP_, p2__6551_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__6560)
        };
        var G__6571__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6552_SHARP_, p2__6553_SHARP_) {
            return cljs.core.conj.call(null, p1__6552_SHARP_, p2__6553_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__6560)
        };
        var G__6571__4 = function() {
          var G__6572__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6554_SHARP_, p2__6555_SHARP_) {
              return cljs.core.conj.call(null, p1__6554_SHARP_, cljs.core.apply.call(null, p2__6555_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__6560)
          };
          var G__6572 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6572__delegate.call(this, x, y, z, args)
          };
          G__6572.cljs$lang$maxFixedArity = 3;
          G__6572.cljs$lang$applyTo = function(arglist__6573) {
            var x = cljs.core.first(arglist__6573);
            var y = cljs.core.first(cljs.core.next(arglist__6573));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6573)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6573)));
            return G__6572__delegate(x, y, z, args)
          };
          G__6572.cljs$lang$arity$variadic = G__6572__delegate;
          return G__6572
        }();
        G__6571 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6571__0.call(this);
            case 1:
              return G__6571__1.call(this, x);
            case 2:
              return G__6571__2.call(this, x, y);
            case 3:
              return G__6571__3.call(this, x, y, z);
            default:
              return G__6571__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__6571.cljs$lang$maxFixedArity = 3;
        G__6571.cljs$lang$applyTo = G__6571__4.cljs$lang$applyTo;
        return G__6571
      }()
    };
    var G__6570 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6570__delegate.call(this, f, g, h, fs)
    };
    G__6570.cljs$lang$maxFixedArity = 3;
    G__6570.cljs$lang$applyTo = function(arglist__6574) {
      var f = cljs.core.first(arglist__6574);
      var g = cljs.core.first(cljs.core.next(arglist__6574));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6574)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6574)));
      return G__6570__delegate(f, g, h, fs)
    };
    G__6570.cljs$lang$arity$variadic = G__6570__delegate;
    return G__6570
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__6576 = cljs.core.next.call(null, coll);
        coll = G__6576;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____6575 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____6575)) {
          return n > 0
        }else {
          return and__3546__auto____6575
        }
      }())) {
        var G__6577 = n - 1;
        var G__6578 = cljs.core.next.call(null, coll);
        n = G__6577;
        coll = G__6578;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__6579 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__6579), s)) {
    if(cljs.core.count.call(null, matches__6579) === 1) {
      return cljs.core.first.call(null, matches__6579)
    }else {
      return cljs.core.vec.call(null, matches__6579)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__6580 = re.exec(s);
  if(matches__6580 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__6580) === 1) {
      return cljs.core.first.call(null, matches__6580)
    }else {
      return cljs.core.vec.call(null, matches__6580)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__6581 = cljs.core.re_find.call(null, re, s);
  var match_idx__6582 = s.search(re);
  var match_str__6583 = cljs.core.coll_QMARK_.call(null, match_data__6581) ? cljs.core.first.call(null, match_data__6581) : match_data__6581;
  var post_match__6584 = cljs.core.subs.call(null, s, match_idx__6582 + cljs.core.count.call(null, match_str__6583));
  if(cljs.core.truth_(match_data__6581)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__6581, re_seq.call(null, re, post_match__6584))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6586__6587 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___6588 = cljs.core.nth.call(null, vec__6586__6587, 0, null);
  var flags__6589 = cljs.core.nth.call(null, vec__6586__6587, 1, null);
  var pattern__6590 = cljs.core.nth.call(null, vec__6586__6587, 2, null);
  return new RegExp(pattern__6590, flags__6589)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__6585_SHARP_) {
    return print_one.call(null, p1__6585_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____6591 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____6591)) {
            var and__3546__auto____6595 = function() {
              var G__6592__6593 = obj;
              if(G__6592__6593 != null) {
                if(function() {
                  var or__3548__auto____6594 = G__6592__6593.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3548__auto____6594) {
                    return or__3548__auto____6594
                  }else {
                    return G__6592__6593.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6592__6593.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6592__6593)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6592__6593)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____6595)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____6595
            }
          }else {
            return and__3546__auto____6591
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3546__auto____6596 = obj != null;
          if(and__3546__auto____6596) {
            return obj.cljs$lang$type
          }else {
            return and__3546__auto____6596
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__6597__6598 = obj;
          if(G__6597__6598 != null) {
            if(function() {
              var or__3548__auto____6599 = G__6597__6598.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3548__auto____6599) {
                return or__3548__auto____6599
              }else {
                return G__6597__6598.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__6597__6598.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6597__6598)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6597__6598)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__6600 = cljs.core.first.call(null, objs);
  var sb__6601 = new goog.string.StringBuffer;
  var G__6602__6603 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6602__6603)) {
    var obj__6604 = cljs.core.first.call(null, G__6602__6603);
    var G__6602__6605 = G__6602__6603;
    while(true) {
      if(obj__6604 === first_obj__6600) {
      }else {
        sb__6601.append(" ")
      }
      var G__6606__6607 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6604, opts));
      if(cljs.core.truth_(G__6606__6607)) {
        var string__6608 = cljs.core.first.call(null, G__6606__6607);
        var G__6606__6609 = G__6606__6607;
        while(true) {
          sb__6601.append(string__6608);
          var temp__3698__auto____6610 = cljs.core.next.call(null, G__6606__6609);
          if(cljs.core.truth_(temp__3698__auto____6610)) {
            var G__6606__6611 = temp__3698__auto____6610;
            var G__6614 = cljs.core.first.call(null, G__6606__6611);
            var G__6615 = G__6606__6611;
            string__6608 = G__6614;
            G__6606__6609 = G__6615;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6612 = cljs.core.next.call(null, G__6602__6605);
      if(cljs.core.truth_(temp__3698__auto____6612)) {
        var G__6602__6613 = temp__3698__auto____6612;
        var G__6616 = cljs.core.first.call(null, G__6602__6613);
        var G__6617 = G__6602__6613;
        obj__6604 = G__6616;
        G__6602__6605 = G__6617;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__6601
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__6618 = cljs.core.pr_sb.call(null, objs, opts);
  sb__6618.append("\n");
  return[cljs.core.str(sb__6618)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__6619 = cljs.core.first.call(null, objs);
  var G__6620__6621 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6620__6621)) {
    var obj__6622 = cljs.core.first.call(null, G__6620__6621);
    var G__6620__6623 = G__6620__6621;
    while(true) {
      if(obj__6622 === first_obj__6619) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__6624__6625 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6622, opts));
      if(cljs.core.truth_(G__6624__6625)) {
        var string__6626 = cljs.core.first.call(null, G__6624__6625);
        var G__6624__6627 = G__6624__6625;
        while(true) {
          cljs.core.string_print.call(null, string__6626);
          var temp__3698__auto____6628 = cljs.core.next.call(null, G__6624__6627);
          if(cljs.core.truth_(temp__3698__auto____6628)) {
            var G__6624__6629 = temp__3698__auto____6628;
            var G__6632 = cljs.core.first.call(null, G__6624__6629);
            var G__6633 = G__6624__6629;
            string__6626 = G__6632;
            G__6624__6627 = G__6633;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6630 = cljs.core.next.call(null, G__6620__6623);
      if(cljs.core.truth_(temp__3698__auto____6630)) {
        var G__6620__6631 = temp__3698__auto____6630;
        var G__6634 = cljs.core.first.call(null, G__6620__6631);
        var G__6635 = G__6620__6631;
        obj__6622 = G__6634;
        G__6620__6623 = G__6635;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__6636) {
    var objs = cljs.core.seq(arglist__6636);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__6637) {
    var objs = cljs.core.seq(arglist__6637);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__6638) {
    var objs = cljs.core.seq(arglist__6638);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__6639) {
    var objs = cljs.core.seq(arglist__6639);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__6640) {
    var objs = cljs.core.seq(arglist__6640);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__6641) {
    var objs = cljs.core.seq(arglist__6641);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__6642) {
    var objs = cljs.core.seq(arglist__6642);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__6643) {
    var objs = cljs.core.seq(arglist__6643);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6644 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6644, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6645 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6645, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6646 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6646, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3698__auto____6647 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____6647)) {
        var nspc__6648 = temp__3698__auto____6647;
        return[cljs.core.str(nspc__6648), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3698__auto____6649 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____6649)) {
          var nspc__6650 = temp__3698__auto____6649;
          return[cljs.core.str(nspc__6650), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6651 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6651, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6652 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6652, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6653 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__6654 = this;
  var G__6655__6656 = cljs.core.seq.call(null, this__6654.watches);
  if(cljs.core.truth_(G__6655__6656)) {
    var G__6658__6660 = cljs.core.first.call(null, G__6655__6656);
    var vec__6659__6661 = G__6658__6660;
    var key__6662 = cljs.core.nth.call(null, vec__6659__6661, 0, null);
    var f__6663 = cljs.core.nth.call(null, vec__6659__6661, 1, null);
    var G__6655__6664 = G__6655__6656;
    var G__6658__6665 = G__6658__6660;
    var G__6655__6666 = G__6655__6664;
    while(true) {
      var vec__6667__6668 = G__6658__6665;
      var key__6669 = cljs.core.nth.call(null, vec__6667__6668, 0, null);
      var f__6670 = cljs.core.nth.call(null, vec__6667__6668, 1, null);
      var G__6655__6671 = G__6655__6666;
      f__6670.call(null, key__6669, this$, oldval, newval);
      var temp__3698__auto____6672 = cljs.core.next.call(null, G__6655__6671);
      if(cljs.core.truth_(temp__3698__auto____6672)) {
        var G__6655__6673 = temp__3698__auto____6672;
        var G__6680 = cljs.core.first.call(null, G__6655__6673);
        var G__6681 = G__6655__6673;
        G__6658__6665 = G__6680;
        G__6655__6666 = G__6681;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__6674 = this;
  return this$.watches = cljs.core.assoc.call(null, this__6674.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__6675 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__6675.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__6676 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__6676.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__6677 = this;
  return this__6677.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6678 = this;
  return this__6678.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__6679 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6688__delegate = function(x, p__6682) {
      var map__6683__6684 = p__6682;
      var map__6683__6685 = cljs.core.seq_QMARK_.call(null, map__6683__6684) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6683__6684) : map__6683__6684;
      var validator__6686 = cljs.core.get.call(null, map__6683__6685, "\ufdd0'validator");
      var meta__6687 = cljs.core.get.call(null, map__6683__6685, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__6687, validator__6686, null)
    };
    var G__6688 = function(x, var_args) {
      var p__6682 = null;
      if(goog.isDef(var_args)) {
        p__6682 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6688__delegate.call(this, x, p__6682)
    };
    G__6688.cljs$lang$maxFixedArity = 1;
    G__6688.cljs$lang$applyTo = function(arglist__6689) {
      var x = cljs.core.first(arglist__6689);
      var p__6682 = cljs.core.rest(arglist__6689);
      return G__6688__delegate(x, p__6682)
    };
    G__6688.cljs$lang$arity$variadic = G__6688__delegate;
    return G__6688
  }();
  atom = function(x, var_args) {
    var p__6682 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____6690 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____6690)) {
    var validate__6691 = temp__3698__auto____6690;
    if(cljs.core.truth_(validate__6691.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__6692 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__6692, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__6693__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6693 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6693__delegate.call(this, a, f, x, y, z, more)
    };
    G__6693.cljs$lang$maxFixedArity = 5;
    G__6693.cljs$lang$applyTo = function(arglist__6694) {
      var a = cljs.core.first(arglist__6694);
      var f = cljs.core.first(cljs.core.next(arglist__6694));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6694)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6694))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6694)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6694)))));
      return G__6693__delegate(a, f, x, y, z, more)
    };
    G__6693.cljs$lang$arity$variadic = G__6693__delegate;
    return G__6693
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6695) {
    var iref = cljs.core.first(arglist__6695);
    var f = cljs.core.first(cljs.core.next(arglist__6695));
    var args = cljs.core.rest(cljs.core.next(arglist__6695));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__6696 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__6696.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6697 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__6697.state, function(p__6698) {
    var curr_state__6699 = p__6698;
    var curr_state__6700 = cljs.core.seq_QMARK_.call(null, curr_state__6699) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__6699) : curr_state__6699;
    var done__6701 = cljs.core.get.call(null, curr_state__6700, "\ufdd0'done");
    if(cljs.core.truth_(done__6701)) {
      return curr_state__6700
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__6697.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__6702__6703 = options;
    var map__6702__6704 = cljs.core.seq_QMARK_.call(null, map__6702__6703) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6702__6703) : map__6702__6703;
    var keywordize_keys__6705 = cljs.core.get.call(null, map__6702__6704, "\ufdd0'keywordize-keys");
    var keyfn__6706 = cljs.core.truth_(keywordize_keys__6705) ? cljs.core.keyword : cljs.core.str;
    var f__6712 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__625__auto____6711 = function iter__6707(s__6708) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__6708__6709 = s__6708;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__6708__6709))) {
                        var k__6710 = cljs.core.first.call(null, s__6708__6709);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__6706.call(null, k__6710), thisfn.call(null, x[k__6710])]), iter__6707.call(null, cljs.core.rest.call(null, s__6708__6709)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____6711.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__6712.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__6713) {
    var x = cljs.core.first(arglist__6713);
    var options = cljs.core.rest(arglist__6713);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__6714 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__6718__delegate = function(args) {
      var temp__3695__auto____6715 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__6714), args);
      if(cljs.core.truth_(temp__3695__auto____6715)) {
        var v__6716 = temp__3695__auto____6715;
        return v__6716
      }else {
        var ret__6717 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__6714, cljs.core.assoc, args, ret__6717);
        return ret__6717
      }
    };
    var G__6718 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6718__delegate.call(this, args)
    };
    G__6718.cljs$lang$maxFixedArity = 0;
    G__6718.cljs$lang$applyTo = function(arglist__6719) {
      var args = cljs.core.seq(arglist__6719);
      return G__6718__delegate(args)
    };
    G__6718.cljs$lang$arity$variadic = G__6718__delegate;
    return G__6718
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__6720 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__6720)) {
        var G__6721 = ret__6720;
        f = G__6721;
        continue
      }else {
        return ret__6720
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__6722__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__6722 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6722__delegate.call(this, f, args)
    };
    G__6722.cljs$lang$maxFixedArity = 1;
    G__6722.cljs$lang$applyTo = function(arglist__6723) {
      var f = cljs.core.first(arglist__6723);
      var args = cljs.core.rest(arglist__6723);
      return G__6722__delegate(f, args)
    };
    G__6722.cljs$lang$arity$variadic = G__6722__delegate;
    return G__6722
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__6724 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__6724, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__6724, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3548__auto____6725 = cljs.core._EQ_.call(null, child, parent);
    if(or__3548__auto____6725) {
      return or__3548__auto____6725
    }else {
      var or__3548__auto____6726 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3548__auto____6726) {
        return or__3548__auto____6726
      }else {
        var and__3546__auto____6727 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3546__auto____6727) {
          var and__3546__auto____6728 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3546__auto____6728) {
            var and__3546__auto____6729 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3546__auto____6729) {
              var ret__6730 = true;
              var i__6731 = 0;
              while(true) {
                if(function() {
                  var or__3548__auto____6732 = cljs.core.not.call(null, ret__6730);
                  if(or__3548__auto____6732) {
                    return or__3548__auto____6732
                  }else {
                    return i__6731 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__6730
                }else {
                  var G__6733 = isa_QMARK_.call(null, h, child.call(null, i__6731), parent.call(null, i__6731));
                  var G__6734 = i__6731 + 1;
                  ret__6730 = G__6733;
                  i__6731 = G__6734;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____6729
            }
          }else {
            return and__3546__auto____6728
          }
        }else {
          return and__3546__auto____6727
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6201))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6205))))].join(""));
    }
    var tp__6738 = "\ufdd0'parents".call(null, h);
    var td__6739 = "\ufdd0'descendants".call(null, h);
    var ta__6740 = "\ufdd0'ancestors".call(null, h);
    var tf__6741 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____6742 = cljs.core.contains_QMARK_.call(null, tp__6738.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__6740.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__6740.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__6738, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__6741.call(null, "\ufdd0'ancestors".call(null, h), tag, td__6739, parent, ta__6740), "\ufdd0'descendants":tf__6741.call(null, "\ufdd0'descendants".call(null, h), parent, ta__6740, tag, td__6739)})
    }();
    if(cljs.core.truth_(or__3548__auto____6742)) {
      return or__3548__auto____6742
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__6743 = "\ufdd0'parents".call(null, h);
    var childsParents__6744 = cljs.core.truth_(parentMap__6743.call(null, tag)) ? cljs.core.disj.call(null, parentMap__6743.call(null, tag), parent) : cljs.core.set([]);
    var newParents__6745 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__6744)) ? cljs.core.assoc.call(null, parentMap__6743, tag, childsParents__6744) : cljs.core.dissoc.call(null, parentMap__6743, tag);
    var deriv_seq__6746 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__6735_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__6735_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__6735_SHARP_), cljs.core.second.call(null, p1__6735_SHARP_)))
    }, cljs.core.seq.call(null, newParents__6745)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__6743.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__6736_SHARP_, p2__6737_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__6736_SHARP_, p2__6737_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__6746))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__6747 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____6749 = cljs.core.truth_(function() {
    var and__3546__auto____6748 = xprefs__6747;
    if(cljs.core.truth_(and__3546__auto____6748)) {
      return xprefs__6747.call(null, y)
    }else {
      return and__3546__auto____6748
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____6749)) {
    return or__3548__auto____6749
  }else {
    var or__3548__auto____6751 = function() {
      var ps__6750 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__6750) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__6750), prefer_table))) {
          }else {
          }
          var G__6754 = cljs.core.rest.call(null, ps__6750);
          ps__6750 = G__6754;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____6751)) {
      return or__3548__auto____6751
    }else {
      var or__3548__auto____6753 = function() {
        var ps__6752 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__6752) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__6752), y, prefer_table))) {
            }else {
            }
            var G__6755 = cljs.core.rest.call(null, ps__6752);
            ps__6752 = G__6755;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____6753)) {
        return or__3548__auto____6753
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____6756 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____6756)) {
    return or__3548__auto____6756
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__6765 = cljs.core.reduce.call(null, function(be, p__6757) {
    var vec__6758__6759 = p__6757;
    var k__6760 = cljs.core.nth.call(null, vec__6758__6759, 0, null);
    var ___6761 = cljs.core.nth.call(null, vec__6758__6759, 1, null);
    var e__6762 = vec__6758__6759;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__6760)) {
      var be2__6764 = cljs.core.truth_(function() {
        var or__3548__auto____6763 = be == null;
        if(or__3548__auto____6763) {
          return or__3548__auto____6763
        }else {
          return cljs.core.dominates.call(null, k__6760, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__6762 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__6764), k__6760, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__6760), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__6764)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__6764
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__6765)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__6765));
      return cljs.core.second.call(null, best_entry__6765)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3546__auto____6766 = mf;
    if(and__3546__auto____6766) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3546__auto____6766
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6767 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6767) {
        return or__3548__auto____6767
      }else {
        var or__3548__auto____6768 = cljs.core._reset["_"];
        if(or__3548__auto____6768) {
          return or__3548__auto____6768
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3546__auto____6769 = mf;
    if(and__3546__auto____6769) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3546__auto____6769
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____6770 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6770) {
        return or__3548__auto____6770
      }else {
        var or__3548__auto____6771 = cljs.core._add_method["_"];
        if(or__3548__auto____6771) {
          return or__3548__auto____6771
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____6772 = mf;
    if(and__3546__auto____6772) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3546__auto____6772
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____6773 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6773) {
        return or__3548__auto____6773
      }else {
        var or__3548__auto____6774 = cljs.core._remove_method["_"];
        if(or__3548__auto____6774) {
          return or__3548__auto____6774
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3546__auto____6775 = mf;
    if(and__3546__auto____6775) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3546__auto____6775
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____6776 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6776) {
        return or__3548__auto____6776
      }else {
        var or__3548__auto____6777 = cljs.core._prefer_method["_"];
        if(or__3548__auto____6777) {
          return or__3548__auto____6777
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____6778 = mf;
    if(and__3546__auto____6778) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3546__auto____6778
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____6779 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6779) {
        return or__3548__auto____6779
      }else {
        var or__3548__auto____6780 = cljs.core._get_method["_"];
        if(or__3548__auto____6780) {
          return or__3548__auto____6780
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3546__auto____6781 = mf;
    if(and__3546__auto____6781) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3546__auto____6781
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6782 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6782) {
        return or__3548__auto____6782
      }else {
        var or__3548__auto____6783 = cljs.core._methods["_"];
        if(or__3548__auto____6783) {
          return or__3548__auto____6783
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3546__auto____6784 = mf;
    if(and__3546__auto____6784) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3546__auto____6784
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6785 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6785) {
        return or__3548__auto____6785
      }else {
        var or__3548__auto____6786 = cljs.core._prefers["_"];
        if(or__3548__auto____6786) {
          return or__3548__auto____6786
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3546__auto____6787 = mf;
    if(and__3546__auto____6787) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3546__auto____6787
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3548__auto____6788 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6788) {
        return or__3548__auto____6788
      }else {
        var or__3548__auto____6789 = cljs.core._dispatch["_"];
        if(or__3548__auto____6789) {
          return or__3548__auto____6789
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__6790 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__6791 = cljs.core._get_method.call(null, mf, dispatch_val__6790);
  if(cljs.core.truth_(target_fn__6791)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__6790)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__6791, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6792 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__6793 = this;
  cljs.core.swap_BANG_.call(null, this__6793.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6793.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6793.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6793.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__6794 = this;
  cljs.core.swap_BANG_.call(null, this__6794.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__6794.method_cache, this__6794.method_table, this__6794.cached_hierarchy, this__6794.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__6795 = this;
  cljs.core.swap_BANG_.call(null, this__6795.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__6795.method_cache, this__6795.method_table, this__6795.cached_hierarchy, this__6795.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__6796 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__6796.cached_hierarchy), cljs.core.deref.call(null, this__6796.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__6796.method_cache, this__6796.method_table, this__6796.cached_hierarchy, this__6796.hierarchy)
  }
  var temp__3695__auto____6797 = cljs.core.deref.call(null, this__6796.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____6797)) {
    var target_fn__6798 = temp__3695__auto____6797;
    return target_fn__6798
  }else {
    var temp__3695__auto____6799 = cljs.core.find_and_cache_best_method.call(null, this__6796.name, dispatch_val, this__6796.hierarchy, this__6796.method_table, this__6796.prefer_table, this__6796.method_cache, this__6796.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____6799)) {
      var target_fn__6800 = temp__3695__auto____6799;
      return target_fn__6800
    }else {
      return cljs.core.deref.call(null, this__6796.method_table).call(null, this__6796.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__6801 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__6801.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__6801.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__6801.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__6801.method_cache, this__6801.method_table, this__6801.cached_hierarchy, this__6801.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__6802 = this;
  return cljs.core.deref.call(null, this__6802.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__6803 = this;
  return cljs.core.deref.call(null, this__6803.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__6804 = this;
  return cljs.core.do_dispatch.call(null, mf, this__6804.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__6805__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__6805 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__6805__delegate.call(this, _, args)
  };
  G__6805.cljs$lang$maxFixedArity = 1;
  G__6805.cljs$lang$applyTo = function(arglist__6806) {
    var _ = cljs.core.first(arglist__6806);
    var args = cljs.core.rest(arglist__6806);
    return G__6805__delegate(_, args)
  };
  G__6805.cljs$lang$arity$variadic = G__6805__delegate;
  return G__6805
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("webfui_examples.add_two_numbers");
goog.require("cljs.core");
alert("yup");
