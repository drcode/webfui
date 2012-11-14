;*CLJSBUILD-MACRO-FILE*;

(ns webfui.framework.macros)

(defmacro add-dom-watch [id vars & more]
          `(webfui.framework/add-dom-watch-helper ~id (fn ~vars ~@more)))

(defmacro add-mouse-watch [id vars & more]
          (if (vector? id)
              `(webfui.framework/add-mouse-watch-helper ~(first id) (fn ~vars ~@more) ~(second id))
              `(webfui.framework/add-mouse-watch-helper ~id (fn ~vars ~@more) :full)))