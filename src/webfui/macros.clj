;*CLJSBUILD-MACRO-FILE*;

(ns webfui.macros)

(defmacro dbg [cur & more]
          `(do (.log js/console (print-str '~cur "-->"))
               (let [x# (~cur ~@more)]
                    (.log js/console (print-str '~cur "-->" (pr-str x#)))
                    x#)))

(defmacro dbgv [& vars]
          `(do ~@(map (fn [var]
                          `(do (.log js/console (print-str '~var "==>" (pr-str ~var)))
                               ~var))
                      vars)))