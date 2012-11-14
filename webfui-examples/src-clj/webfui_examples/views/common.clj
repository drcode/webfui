(ns webfui-examples.views.common
  (:use [noir.core :only [defpartial]]
        [hiccup.page :only [include-css include-js html5]]
        [hiccup.element :only [javascript-tag]]))

(defpartial layout [name]
            (html5
              [:head
               [:title "webfui-examples"]
               (include-css (str "/css/" name ".css"))
               (javascript-tag "var CLOSURE_NO_DEPS = true;")
               (include-js (str "/js/" name ".js"))]
              [:body]))
