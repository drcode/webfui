(ns webfui.plugin.scrolling
  (:use [webfui.plugin.core :only [Plugin]]
        [webfui.dom-manipulation :only [select-path-html parsed-html unparse-html path-dom resolve-target]]))

(def dom-watchers-atom (atom nil))
(def parsed-html-atom (atom nil))

(defn scroll [event]
  (let [target (.-target event)
        [tagname attributes :as element] (resolve-target @@parsed-html-atom target)
        scroll-top (.-scrollTop target)
        scroll-left (.-scrollLeft target)
        event (@@dom-watchers-atom (keyword (:watch attributes)))
        new-element (update-in element [1] assoc :scroll-top scroll-top :scroll-left scroll-left)]
    (event element new-element)))

(defn check-for-scroll [event]
  (let [target (.-target event)]
    (.addEventListener target "scroll" scroll)))

(defn xpath [s]
  (let [res (.evaluate js/document s js/document nil (.-ORDERED_NODE_ITERATOR_TYPE js/XPathResult) nil)]
    (doall (take-while identity (repeatedly (fn [] (.iterateNext res)))))))

(deftype scrolling []
  Plugin
  (declare-events [this body dom-watchers parsed-html]
                  (reset! dom-watchers-atom dom-watchers)
                  (reset! parsed-html-atom parsed-html)
                  (.addEventListener body "mousedown" check-for-scroll)
                  (.addEventListener body "keydown" check-for-scroll))
  
  (fix-dom [this]
           (doseq [element (xpath "//*[@scroll-top]")]
             (let [scroll-top (js/parseInt (.getAttribute element "scroll-top"))]
               (when (> (js/Math.abs (- (.-scrollTop element) scroll-top)) 1) 
                 (set! (.-scrollTop element) scroll-top)
                 (.addEventListener element "scroll" scroll)
                 (.removeAttribute element "scroll-top"))))))


